# backend/routers/classify.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.gemini_service import classify_crisis

router = APIRouter()


def _fallback_classification(incident_text: str) -> dict:
    text = incident_text.lower()

    crisis_type = "other"
    severity = "medium"
    call_emergency_services = False
    emergency_number = "112"

    if any(k in text for k in ["fire", "smoke", "burn", "alarm"]):
        crisis_type = "fire"
        severity = "critical"
        call_emergency_services = True
        emergency_number = "101"
    elif any(k in text for k in ["medical", "injury", "unconscious", "choking", "heart"]):
        crisis_type = "medical"
        severity = "high"
        call_emergency_services = True
        emergency_number = "102"
    elif any(k in text for k in ["security", "weapon", "attack", "fight", "intruder", "theft"]):
        crisis_type = "security"
        severity = "high"
        call_emergency_services = True
        emergency_number = "112"
    elif any(k in text for k in ["collapse", "crack", "structural", "ceiling"]):
        crisis_type = "structural"
        severity = "high"
        call_emergency_services = True
    elif any(k in text for k in ["power", "blackout", "electrical", "outage"]):
        crisis_type = "power"
        severity = "medium"

    return {
        "crisis_type": crisis_type,
        "severity": severity,
        "confidence": 0.55,
        "summary_english": "Fallback classification used because AI service was temporarily unavailable.",
        "guest_instruction": "Please remain calm, move to a safe area, and follow staff instructions.",
        "staff_instructions": {
            "front_desk": "Acknowledge report and notify relevant emergency response teams immediately.",
            "security": "Secure the affected area and guide guests to safe zones.",
            "housekeeping": "Support evacuation pathways and assist vulnerable guests.",
            "management": "Coordinate incident response and contact emergency services if required.",
        },
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
    confidence: float
    summary_english: str
    guest_instruction: str
    staff_instructions: dict
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
