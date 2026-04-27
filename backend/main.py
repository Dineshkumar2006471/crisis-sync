# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env.local in the root
load_dotenv(dotenv_path=".env.local")

app = FastAPI(
    title="CrisisSync API",
    description="AI-powered crisis classification backend for CrisisSync",
    version="1.0.0",
)

# CORS — allow Next.js frontend and any Firebase Hosting URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.firebaseapp.com",
        "https://*.web.app",
        "https://*.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers.classify import router as classify_router
from backend.routers.report import router as report_router

app.include_router(classify_router, tags=["Classification"])
app.include_router(report_router, tags=["Reports"])

@app.get("/health")
async def health_check():
    use_vertex = os.environ.get("USE_VERTEX_AI", "false").lower() == "true"
    model_name = "gemini-2.5-flash" if use_vertex else "gemini-flash-latest"
    platform = "Vertex AI" if use_vertex else "Gemini AI Studio"
    
    return {
        "status": "operational",
        "service": "CrisisSync API",
        "platform": platform,
        "model": model_name,
        "version": "1.1.0",
    }

@app.get("/test-gemini")
async def test_gemini_permissions():
    try:
        from backend.services.gemini_service import classify_crisis
        use_vertex = os.environ.get("USE_VERTEX_AI", "false").lower() == "true"
        platform = "Vertex AI" if use_vertex else "Gemini AI Studio"
        
        # Run a minimal classification test
        test_result = await classify_crisis("Test incident", "English", "Test Hotel")
        return {
            "status": "success",
            "message": f"Gemini API permissions verified on {platform}",
            "model_version": test_result.get("model_version", "unknown"),
            "sample_parse": test_result.get("crisis_type")
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": type(e).__name__,
            "message": str(e)
        }

@app.get("/")
async def root():
    return {"message": "CrisisSync API — Rapid Crisis Response Platform", "docs": "/docs"}
