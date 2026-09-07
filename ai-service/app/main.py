"""
Placement Nexus AI Service — FastAPI application entry point.
Port: 8000 (internal only — not exposed to frontend directly).
"""
from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers.ai_router import router as ai_router

app = FastAPI(
    title="Placement Nexus AI Service",
    description="Internal AI service — not publicly accessible. Called by the Express backend.",
    version="17.0.0",
    # Hide docs in production
    docs_url=None if os.environ.get("NODE_ENV") == "production" else "/docs",
    redoc_url=None if os.environ.get("NODE_ENV") == "production" else "/redoc",
)

# Restrict CORS to localhost Express backend only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health")
def health_check():
    provider = os.environ.get("AI_PROVIDER", "mock")
    return {
        "status": "ok",
        "service": "Placement Nexus AI Service",
        "version": "17.0.0",
        "provider": provider,
        "geminiKeySet": bool(os.environ.get("AI_GEMINI_API_KEY")),
        "internalKeySet": bool(os.environ.get("AI_INTERNAL_KEY")),
    }
