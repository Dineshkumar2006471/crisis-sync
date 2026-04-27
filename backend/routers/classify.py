# backend/routers/classify.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.gemini_service import classify_crisis

router = APIRouter()


def _fallback_classification(incident_text: str) -> dict:
    text = incident_text.lower()

    crisis_type = "other"
    severity = "medium"
    severity_score = 50
    call_emergency_services = False
    emergency_number = "112"
    summary_english = "Local rules-based classification was used because AI analysis was unavailable."
    guest_instruction = "Please remain calm and follow staff instructions."
    staff_instructions = {
        "front_desk": "Acknowledge report and notify relevant emergency response teams immediately.",
        "security": "Secure the affected area and guide guests to safe zones.",
        "housekeeping": "Support evacuation pathways and assist vulnerable guests.",
        "management": "Coordinate incident response and contact emergency services if required.",
    }
    tactical_objectives = [
        "Confirm the reported situation with the nearest staff unit",
        "Stabilize guest safety at the reported location",
        "Escalate to the correct department and maintain incident updates",
    ]

    if any(k in text for k in ["fire", "smoke", "burn", "alarm"]):
        crisis_type = "fire"
        severity = "critical"
        severity_score = 95
        call_emergency_services = True
        emergency_number = "101"
        summary_english = "Fire or smoke hazard reported in the hotel."
        guest_instruction = "Please evacuate using the nearest stairwell and do not use elevators."
        staff_instructions = {
            "front_desk": "Trigger fire protocol and direct guests to evacuation routes.",
            "security": "Respond to the affected zone, secure corridors, and support fire service access.",
            "housekeeping": "Sweep nearby rooms and guide guests to safe exits.",
            "management": "Activate the incident command plan and coordinate emergency services.",
        }
        tactical_objectives = [
            "Confirm smoke or flame source and trigger fire protocol",
            "Clear guests from the affected floor using stair routes",
            "Stage responders and fire services access at the nearest safe approach",
        ]
    elif any(k in text for k in ["medical", "injury", "unconscious", "choking", "heart"]):
        crisis_type = "medical"
        severity = "high"
        severity_score = 82
        call_emergency_services = True
        emergency_number = "102"
        summary_english = "Medical assistance appears to be required for a guest or staff member."
        guest_instruction = "Please remain calm. Help is being dispatched to your location."
        staff_instructions = {
            "front_desk": "Call for medical support and keep a clear access path for responders.",
            "security": "Move to the scene quickly and help maintain space for treatment.",
            "housekeeping": "Bring nearby support resources and assist vulnerable guests nearby.",
            "management": "Oversee escalation and ambulance coordination if required.",
        }
        tactical_objectives = [
            "Confirm the patient condition and keep the area clear for treatment",
            "Dispatch the nearest trained responder with first-aid equipment",
            "Prepare ambulance handoff and route access if escalation is needed",
        ]
    elif any(k in text for k in ["security", "weapon", "attack", "fight", "intruder", "theft"]):
        crisis_type = "security"
        severity = "high"
        severity_score = 80
        call_emergency_services = True
        emergency_number = "112"
        summary_english = "A security threat or unauthorized access concern has been reported."
        guest_instruction = "Please remain where you are if safe, avoid confrontation, and wait for staff instructions."
        staff_instructions = {
            "front_desk": "Keep the line open with the guest and dispatch security immediately.",
            "security": "Respond to the reported location, assess the threat, and protect guests nearby.",
            "housekeeping": "Avoid the affected area unless requested for support.",
            "management": "Monitor escalation and contact law enforcement if the threat is active.",
        }
        tactical_objectives = [
            "Verify the active threat and isolate the affected access point",
            "Dispatch the nearest security unit to the reported location",
            "Preserve CCTV and witness details for follow-up",
        ]
    elif any(k in text for k in ["lock", "locked", "door stuck", "jammed", "can't open", "cannot open", "stuck door", "key card not working"]):
        crisis_type = "security"
        severity = "medium"
        severity_score = 58
        summary_english = "A guest reported a locked or inaccessible door requiring staff assistance."
        guest_instruction = "Please remain calm. Staff are being sent to help you regain safe access."
        staff_instructions = {
            "front_desk": "Keep contact with the guest and dispatch security or engineering support.",
            "security": "Go to the reported door, verify guest safety, and restore controlled access.",
            "housekeeping": "Stand by in case corridor support or guest assistance is needed.",
            "management": "Monitor resolution time and escalate if the guest may be trapped or vulnerable.",
        }
        tactical_objectives = [
            "Confirm whether the guest is locked in, locked out, or otherwise unsafe",
            "Dispatch security or engineering to restore controlled access",
            "Preserve door-access evidence and document the resolution outcome",
        ]
    elif any(k in text for k in ["collapse", "crack", "structural", "ceiling"]):
        crisis_type = "structural"
        severity = "high"
        severity_score = 84
        call_emergency_services = True
        summary_english = "A structural safety issue has been reported."
        guest_instruction = "Please move away from the affected area and wait for staff instructions."
        tactical_objectives = [
            "Isolate the affected area and stop guest traffic nearby",
            "Check for debris, collapse risk, or trapped occupants",
            "Escalate to engineering leadership and emergency services if instability is confirmed",
        ]
    elif any(k in text for k in ["power", "blackout", "electrical", "outage"]):
        crisis_type = "power"
        severity = "medium"
        severity_score = 62
        summary_english = "A power or electrical service interruption has been reported."
        guest_instruction = "Please stay calm and remain where it is safe while staff assess the outage."
        tactical_objectives = [
            "Confirm the outage scope and identify impacted guest areas",
            "Dispatch engineering to restore critical systems and trapped-access risks",
            "Issue calm guest guidance and protect elevator and corridor safety",
        ]

    return {
        "crisis_type": crisis_type,
        "severity": severity,
        "severity_score": severity_score,
        "confidence": 0.55,
        "summary_english": summary_english,
        "guest_instruction": guest_instruction,
        "staff_instructions": staff_instructions,
        "tactical_objectives": tactical_objectives,
        "call_emergency_services": call_emergency_services,
        "emergency_number": emergency_number,
    }

class ClassifyRequest(BaseModel):
    incident_text: str
    language: str = "English"
    hotel_name: str = "Unknown Hotel"

class ClassifyResponse(BaseModel):
    crisis_type: str
    severity: str
    severity_score: int
    confidence: float
    summary_english: str
    guest_instruction: str
    staff_instructions: dict
    tactical_objectives: list[str]
    call_emergency_services: bool
    emergency_number: str

@router.post("/classify", response_model=ClassifyResponse)
async def classify_incident(req: ClassifyRequest):
    if not req.incident_text.strip():
        raise HTTPException(status_code=400, detail="incident_text cannot be empty")
    
    try:
        result = await classify_crisis(
            incident_text=req.incident_text,
            language=req.language,
            hotel_name=req.hotel_name
        )
        return result
    except ValueError as e:
        return _fallback_classification(req.incident_text)
    except Exception as e:
        return _fallback_classification(req.incident_text)
