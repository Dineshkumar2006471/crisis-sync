# backend/services/gemini_service.py
import asyncio
import json
import os

import google.generativeai as genai
from dotenv import load_dotenv

try:
    import vertexai
    from vertexai.generative_models import GenerationConfig, GenerativeModel
except ImportError:
    vertexai = None

# Load environment variables
load_dotenv('.env.local')

prefer_vertex = os.environ.get("USE_VERTEX_AI", "false").lower() == "true"
api_key = os.environ.get("GEMINI_API_KEY")
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

model = None
active_model_name = "rules-fallback"
using_vertex = False

if prefer_vertex and project_id and vertexai is not None:
    try:
        print(f"Initializing Vertex AI with project {project_id} in {location}")
        vertexai.init(project=project_id, location=location)
        model = GenerativeModel(
            "gemini-2.5-flash",
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        active_model_name = "gemini-2.5-flash"
        using_vertex = True
    except Exception as exc:
        print(f"Vertex initialization failed, falling back to Gemini AI Studio: {exc}")

if model is None and api_key:
    print("Initializing Gemini AI Studio")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        "gemini-flash-latest",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    active_model_name = "gemini-flash-latest"

if model is None:
    print("WARNING: Neither Gemini API Key nor Vertex AI config found.")

CLASSIFY_PROMPT = """
You are a crisis response AI for a premium hotel named {hotel_name}.
The hotel is in India.
The reporter wrote the following message in {language}:

{incident_text}

Analyze the report and return ONLY valid JSON with these keys:
- crisis_type: one of fire, medical, security, structural, power, other
- severity: one of critical, high, medium, low
- severity_score: integer between 0 and 100 representing overall operational urgency
- confidence: numeric value between 0 and 1
- summary_english: brief factual SITREP in English
- guest_instruction: calm sentence-case safety instruction for the guest in {language}
- staff_instructions: object with front_desk, security, housekeeping, management
- tactical_objectives: array of exactly 3 short mission objectives tailored to this incident
- call_emergency_services: boolean
- emergency_number: string or null, and if emergency services are needed it must be one of 101, 102, or 112

Rules:
- Base your answer on the actual reporter text above.
- Do not return placeholder or example content.
- If the incident is serious, instruct evacuation using stairs and never elevators.
- Keep guest_instruction in normal sentence case, never all caps.
- Use Indian emergency routing: fire=101, medical=102, security/structural/power/other=112.
- A locked room, jammed door, or access-control issue without violence, smoke, injury, or intruder evidence is usually security with medium severity, not high.
- Reserve high or critical severity for active danger, injury risk, fire, violent threat, structural instability, trapped occupants, or life-safety impact.
"""

CONFIDENCE_WORD_MAP = {
    "very low": 0.2,
    "low": 0.35,
    "medium": 0.6,
    "moderate": 0.6,
    "high": 0.8,
    "very high": 0.95,
}


def _normalize_confidence(value: object) -> float:
    if isinstance(value, (int, float)):
        return min(max(float(value), 0.0), 1.0)

    if isinstance(value, str):
        raw = value.strip().lower()
        if raw in CONFIDENCE_WORD_MAP:
            return CONFIDENCE_WORD_MAP[raw]
        try:
            return min(max(float(raw), 0.0), 1.0)
        except ValueError:
            return 0.8

    return 0.8


def _normalize_output(data: dict) -> dict:
    crisis_type = str(data.get("crisis_type", "other")).strip().lower()
    severity = str(data.get("severity", "medium")).strip().lower()

    type_map = {
        "fire": "fire",
        "medical": "medical",
        "security": "security",
        "structural": "structural",
        "power": "power",
        "other": "other",
        "natural disaster": "other",
        "disaster": "other",
    }
    severity_map = {
        "critical": "critical",
        "high": "high",
        "medium": "medium",
        "low": "low",
    }

    staff = data.get("staff_instructions") if isinstance(data.get("staff_instructions"), dict) else {}
    normalized_crisis_type = type_map.get(crisis_type, "other")
    normalized_severity = severity_map.get(severity, "medium")
    call_emergency_services = bool(data.get("call_emergency_services", False))
    emergency_number = str(data.get("emergency_number", "") or "").strip()

    if emergency_number not in {"101", "102", "112"}:
        if normalized_crisis_type == "fire":
            emergency_number = "101"
        elif normalized_crisis_type == "medical":
            emergency_number = "102"
        else:
            emergency_number = "112"

    return {
        "crisis_type": normalized_crisis_type,
        "severity": normalized_severity,
        "severity_score": _normalize_severity_score(data.get("severity_score"), normalized_severity),
        "confidence": _normalize_confidence(data.get("confidence", 0.8)),
        "summary_english": str(data.get("summary_english", "Incident reported and classified.")),
        "guest_instruction": str(
            data.get(
                "guest_instruction",
                "Please move to a safe area and follow staff instructions.",
            )
        ),
        "staff_instructions": {
            "front_desk": str(
                staff.get("front_desk")
                or staff.get("front_office")
                or staff.get("general")
                or "Coordinate guest communication and announcements."
            ),
            "security": str(
                staff.get("security")
                or staff.get("general")
                or "Secure access points and guide evacuation routes."
            ),
            "housekeeping": str(
                staff.get("housekeeping")
                or staff.get("engineering")
                or staff.get("general")
                or "Assist guests and clear evacuation pathways."
            ),
            "management": str(
                staff.get("management")
                or staff.get("general")
                or "Oversee escalation and coordinate with responders."
            ),
        },
        "tactical_objectives": _normalize_tactical_objectives(data.get("tactical_objectives"), normalized_crisis_type),
        "call_emergency_services": call_emergency_services,
        "emergency_number": emergency_number if call_emergency_services else (emergency_number or "112"),
        "model_version": str(data.get("model_version", "unknown")),
    }


def _normalize_severity_score(value: object, severity: str) -> int:
    defaults = {
        "critical": 92,
        "high": 78,
        "medium": 55,
        "low": 26,
    }

    if isinstance(value, (int, float)):
        return max(0, min(100, int(round(float(value)))))

    if isinstance(value, str):
        try:
            return max(0, min(100, int(round(float(value.strip())))))
        except ValueError:
            pass

    return defaults.get(severity, 55)


def _normalize_tactical_objectives(value: object, crisis_type: str) -> list[str]:
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        if len(cleaned) >= 3:
            return cleaned[:3]

    defaults = {
        "fire": [
            "Confirm smoke or flame source and trigger fire protocol",
            "Clear guests from the affected floor using stair routes",
            "Stage responders and fire services access at the nearest safe approach",
        ],
        "medical": [
            "Confirm the guest condition and keep the area clear for treatment",
            "Dispatch the nearest trained responder with first-aid equipment",
            "Prepare ambulance handoff and route access if escalation is needed",
        ],
        "security": [
            "Verify the guest's immediate safety and isolate the affected access point",
            "Dispatch security or engineering to restore controlled access",
            "Preserve relevant CCTV or access-control evidence for follow-up",
        ],
        "structural": [
            "Isolate the affected area and stop guest traffic nearby",
            "Check for debris, collapse risk, or trapped occupants",
            "Escalate to engineering leadership and emergency services if instability is confirmed",
        ],
        "power": [
            "Confirm the outage scope and identify impacted guest areas",
            "Dispatch engineering to restore critical systems and trapped-access risks",
            "Issue calm guest guidance and protect elevator and corridor safety",
        ],
        "other": [
            "Confirm the reported situation with the nearest staff unit",
            "Stabilize guest safety at the reported location",
            "Escalate to the correct department and maintain incident updates",
        ],
    }

    return defaults.get(crisis_type, defaults["other"])


async def classify_crisis(incident_text: str, language: str, hotel_name: str) -> dict:
    if model is None:
        raise Exception("Gemini model is not configured. Check GEMINI_API_KEY.")

    prompt = CLASSIFY_PROMPT.format(
        incident_text=incident_text,
        language=language,
        hotel_name=hotel_name,
    )

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
    except Exception as exc:
        print(f"Gemini API Error: {exc}")
        raise Exception(f"AI Service Error: {exc}")

    try:
        raw = response.text.strip()
        if "```json" in raw:
            raw = raw.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in raw:
            raw = raw.split("```", 1)[1].split("```", 1)[0].strip()

        parsed = json.loads(raw)
        parsed["model_version"] = active_model_name
        return _normalize_output(parsed)
    except Exception as exc:
        print(f"Failed to parse Gemini output: {response.text if response else 'No Response'}")
        raise ValueError(f"AI returned invalid result format: {exc}")


async def generate_report(incident_data: dict) -> str:
    if model is None:
        raise Exception("Gemini model is not configured.")

    prompt = f"""
    Generate a formal professional incident report for a hotel manager based on the following data:
    {json.dumps(incident_data, indent=2)}

    Structure the report in Markdown:
    # INCIDENT REPORT
    ## Executive Summary
    ## Key Details
    ## Response Action Taken
    ## Recommendations
    """

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        return response.text
    except Exception as exc:
        print(f"Gemini Report Error: {exc}")
        return "Failed to generate AI report summary."
