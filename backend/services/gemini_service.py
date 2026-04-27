# backend/services/gemini_service.py
import os
import json
import asyncio
import google.generativeai as genai
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
except ImportError:
    vertexai = None

from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Setup Gemini
use_vertex = os.environ.get("USE_VERTEX_AI", "false").lower() == "true"
api_key = os.environ.get("GEMINI_API_KEY")
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

model = None

if use_vertex and project_id:
    print(f"Initializing Vertex AI with project {project_id} in {location}")
    vertexai.init(project=project_id, location=location)
    model = GenerativeModel(
        "gemini-2.5-flash",
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )
    )
elif api_key:
    print("Initializing Gemini AI Studio")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        'gemini-flash-latest',
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )
    )
else:
    print("WARNING: Neither Gemini API Key nor Vertex AI config found.")

CLASSIFY_PROMPT = """
You are a Crisis AI for a premium hotel (Hotel Name: {hotel_name}).
Your task is to analyze a reporter's text (reported in {language}) and extract tactical intelligence.

1. Crisis Type: fire, medical, security, structural, power, or other.
2. Severity: critical, high, medium, low.
3. Summary: A brief, professional SITREP (Situation Report) in English.
4. Guest Instruction: Direct, calming instructions for the guest in {language}.
5. Staff Instructions: Specific, actionable directives for:
   - Front Desk
   - Security
   - Housekeeping
   - Management
6. Emergency Services: Should we call 101/102/112? Specify the number.

AI REASONING & ANALYSIS REQUIREMENTS:
In your 'summary_english' or as part of your internal analysis (which should be reflected in the instructions), you must clearly identify:
- WHO the user is (e.g., guest, visitor, staff member).
- WHAT situation they are in (e.g., trapped in a room, witnessing an event).
- WHAT danger they are facing (e.g., smoke inhalation, physical threat, injury).

Ensure the response is valid JSON.

CRITICAL INSTRUCTION: The 'guest_instruction' MUST be in normal sentence case (NOT ALL CAPS). 
ALWAYS use this exact guest protocol for any serious emergency: "Please stay calm and evacuate the building immediately using the nearest emergency exit stairs. Do not use the elevators. Once outside, proceed to the designated assembly point at the main parking area and wait for further instructions."
If it is a minor issue (e.g. power out in one room), adapt slightly but KEEP IT IN NORMAL SENTENCE CASE.

Required JSON keys:
crisis_type, severity, confidence, summary_english, guest_instruction,
staff_instructions(front_desk, security, housekeeping, management),
call_emergency_services, emergency_number
"""



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
        return {
                "crisis_type": type_map.get(crisis_type, "other"),
                "severity": severity_map.get(severity, "medium"),
                "confidence": float(data.get("confidence", 0.8)),
                "summary_english": str(data.get("summary_english", "Incident reported and classified.")),
                "guest_instruction": str(data.get("guest_instruction", "Please move to a safe area and follow staff instructions.")),
                "staff_instructions": {
                        "front_desk": str(staff.get("front_desk") or staff.get("front_office") or staff.get("general") or "Coordinate guest communication and announcements."),
                        "security": str(staff.get("security") or staff.get("general") or "Secure access points and guide evacuation routes."),
                        "housekeeping": str(staff.get("housekeeping") or staff.get("engineering") or staff.get("general") or "Assist guests and clear evacuation pathways."),
                        "management": str(staff.get("management") or staff.get("general") or "Oversee escalation and coordinate with responders."),
                },
                "call_emergency_services": bool(data.get("call_emergency_services", False)),
                "emergency_number": str(data.get("emergency_number", "112")),
                "model_version": str(data.get("model_version", "unknown")),
        }

async def classify_crisis(incident_text: str, language: str, hotel_name: str) -> dict:
    if model is None:
        raise Exception("Gemini model is not configured. Check GEMINI_API_KEY.")
        
    prompt = CLASSIFY_PROMPT.format(
        incident_text=incident_text,
        language=language,
        hotel_name=hotel_name
    )
    
    try:
        # Use stable sync SDK call in a worker thread to keep FastAPI async-friendly.
        response = await asyncio.to_thread(model.generate_content, prompt)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise Exception(f"AI Service Error: {e}")

    try:
        raw = response.text.strip()
        # Clean markdown
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
            
        parsed = json.loads(raw)
        model_name = "gemini-2.5-flash" if use_vertex else "gemini-flash-latest"
        parsed["model_version"] = model_name
        return _normalize_output(parsed)
    except Exception as e:
        print(f"Failed to parse Gemini output: {response.text if response else 'No Response'}")
        raise ValueError(f"AI returned invalid result format: {e}")

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
    except Exception as e:
        print(f"Gemini Report Error: {e}")
        return "Failed to generate AI report summary."
