# backend/routers/report.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.gemini_service import generate_report

router = APIRouter()

class ReportRequest(BaseModel):
    incident_data: dict

@router.post("/report")
async def generate_incident_report(req: ReportRequest):
    try:
        report_text = await generate_report(req.incident_data)
        return {"report": report_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
