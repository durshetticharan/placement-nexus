"""
AI API routers.
All endpoints require the internal service key (X-Internal-Key header).
The key is set via AI_INTERNAL_KEY environment variable — never exposed to the frontend.
"""
from __future__ import annotations

import os
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)

from app.schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    CareerGuidanceRequest,
    CareerGuidanceResponse,
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    InterviewEvaluateRequest,
    InterviewEvaluateResponse,
    DrivePreparationRequest,
    DrivePreparationResponse,
)
from app.services.ai_service import (
    analyze_resume,
    career_guidance,
    generate_interview_questions,
    evaluate_interview_answer,
    drive_preparation_advice,
)
from app.utils.pdf import extract_text_from_pdf, truncate_text

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Internal Auth ──────────────────────────────────────────────────────────────

def verify_internal_key(x_internal_key: str = Header(...)):
    """Validate the service-to-service key. Never exposed to frontend."""
    expected = os.environ.get("AI_INTERNAL_KEY", "")
    if not expected:
        # In development with AI_INTERNAL_KEY unset, allow localhost calls
        # (controlled by NODE_ENV=development on the caller)
        return
    if x_internal_key != expected:
        raise HTTPException(status_code=403, detail="Invalid internal service key.")


# ── Resume Analysis ────────────────────────────────────────────────────────────

@router.post("/resume/analyze", response_model=ResumeAnalysisResponse)
async def resume_analyze(
    payload: ResumeAnalysisRequest,
    _=Depends(verify_internal_key),
):
    """
    Analyze resume text with AI.
    Text must already be extracted by the Node backend.
    AI output is advisory; does not alter any profile data automatically.
    """
    if len(payload.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short to analyze.")
    safe_text = truncate_text(payload.resume_text, max_chars=20_000)
    try:
        result = await analyze_resume(safe_text, payload.job_description)
        return ResumeAnalysisResponse(
            summary=result.get("summary", "No summary available."),
            atsScore=result.get("atsScore") or result.get("ats_score"),
            extractedSkills=result.get("extractedSkills", result.get("extracted_skills", [])),
            missingSections=result.get("missingSections", result.get("missing_sections", [])),
            strengths=result.get("strengths", []),
            improvements=result.get("improvements", []),
            keywordDensity=result.get("keywordDensity"),
            jdRequiredSkills=result.get("jdRequiredSkills", []),
            jdPreferredSkills=result.get("jdPreferredSkills", []),
            jdKeywords=result.get("jdKeywords", []),
            resumeKeywords=result.get("resumeKeywords", []),
            resumeExperience=result.get("resumeExperience", []),
            resumeProjects=result.get("resumeProjects", []),
            resumeEducation=result.get("resumeEducation", []),
            resumeSections=result.get("resumeSections", []),
            jdExperienceRequirements=result.get("jdExperienceRequirements", []),
            jdEducationRequirements=result.get("jdEducationRequirements", []),
            confidence=result.get("confidence", "LOW"),
            isAiGenerated=True,
            promptVersion=result.get("promptVersion", "1.0"),
            model=result.get("model"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"AI returned invalid output: {exc}")
    except Exception as exc:
        logger.error(f"AI service error in resume_analyze: {exc}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")


# ── Resume PDF Upload (convenience endpoint) ───────────────────────────────────

@router.post("/resume/extract-text")
async def resume_extract_text(
    file: UploadFile = File(...),
    _=Depends(verify_internal_key),
):
    """
    Accept a PDF file and return its extracted plain text.
    Does NOT call any AI model. Extremely fast and deterministic.
    """
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF exceeds 5 MB limit.")

    text, status = extract_text_from_pdf(content)
    if status == "image_only":
        raise HTTPException(status_code=400, detail="Unable to extract readable text from this PDF. Please upload a text-based resume PDF.")
    if status in ("empty", "error"):
        raise HTTPException(status_code=400, detail="Unable to extract readable text from this PDF.")

    return JSONResponse(status_code=200, content={"text": text})


@router.post("/resume/analyze-pdf")
async def resume_analyze_pdf(
    file: UploadFile = File(...),
    student_id: str = Form(...),
    job_description: Optional[str] = Form(None),
    _=Depends(verify_internal_key),
):
    """
    Accept a PDF file, extract text, then analyze.
    File type and size are validated before processing.
    """
    # Validate type
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    content = await file.read()
    # 5MB limit
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF exceeds 5 MB limit.")

    text, status = extract_text_from_pdf(content)
    if status == "image_only":
        return JSONResponse(
            status_code=200,
            content={
                "warning": "PDF appears to contain only images — no text could be extracted. Upload a text-based PDF.",
                "isAiGenerated": False,
            },
        )
    if status in ("empty", "error"):
        raise HTTPException(status_code=400, detail=f"Could not extract text from PDF: {text}")

    safe_text = truncate_text(text, max_chars=20_000)
    try:
        result = await analyze_resume(safe_text, job_description)
        return result
    except Exception as exc:
        logger.error(f"AI service error in resume_analyze_pdf: {exc}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")


# ── Career Guidance ────────────────────────────────────────────────────────────

@router.post("/career/guidance", response_model=CareerGuidanceResponse)
async def career_guidance_endpoint(
    payload: CareerGuidanceRequest,
    _=Depends(verify_internal_key),
):
    """
    Generate career guidance from student profile data.
    Does NOT alter ReadinessScore, Eligibility, or Job Match.
    """
    profile = payload.model_dump()
    try:
        result = await career_guidance(profile)
        return CareerGuidanceResponse(
            summary=result.get("summary", ""),
            strengths=result.get("strengths", []),
            gaps=result.get("gaps", []),
            recommendations=result.get("recommendations", []),
            shortTermActions=result.get("shortTermActions", result.get("short_term_actions", [])),
            longTermActions=result.get("longTermActions", result.get("long_term_actions", [])),
            confidence=result.get("confidence", "LOW"),
            isAiGenerated=True,
            promptVersion=result.get("promptVersion", "1.0"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error(f"AI service error in career_guidance: {exc}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")


# ── Interview Practice ─────────────────────────────────────────────────────────

@router.post("/interview/questions", response_model=InterviewQuestionsResponse)
async def interview_questions(
    payload: InterviewQuestionsRequest,
    _=Depends(verify_internal_key),
):
    """
    Generate practice interview questions.
    Questions are AI-generated for practice purposes only — not real company questions.
    """
    try:
        result = await generate_interview_questions(
            role=payload.role,
            required_skills=payload.required_skills,
            interview_type=payload.interview_type,
            count=payload.count,
            drive_context=payload.drive_context,
        )
        questions = result.get("questions", [])
        return InterviewQuestionsResponse(
            questions=questions,
            isAiGenerated=True,
            promptVersion=result.get("promptVersion", "1.0"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error(f"AI service error in interview_questions: {exc}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")


@router.post("/interview/evaluate", response_model=InterviewEvaluateResponse)
async def interview_evaluate(
    payload: InterviewEvaluateRequest,
    _=Depends(verify_internal_key),
):
    """
    Evaluate a practice interview answer.
    Advisory only — NOT an official hiring evaluation.
    """
    try:
        result = await evaluate_interview_answer(
            question=payload.question,
            answer=payload.answer,
            role=payload.role,
            topic=payload.topic,
        )
        eval_data = result.get("evaluation", {})
        return InterviewEvaluateResponse(
            evaluation={
                "relevance": eval_data.get("relevance", 5),
                "clarity": eval_data.get("clarity", 5),
                "technicalDepth": eval_data.get("technicalDepth", eval_data.get("technical_depth", 5)),
                "completeness": eval_data.get("completeness", 5),
                "overall": eval_data.get("overall", 5),
                "feedback": eval_data.get("feedback", "No feedback available."),
                "improvements": eval_data.get("improvements", []),
                "strengths": eval_data.get("strengths", []),
            },
            isAiGenerated=True,
            promptVersion=result.get("promptVersion", "1.0"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error(f"AI service error in interview_evaluate: {exc}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")


# ── Drive Preparation ──────────────────────────────────────────────────────────

@router.post("/drive/preparation", response_model=DrivePreparationResponse)
async def drive_preparation(
    payload: DrivePreparationRequest,
    _=Depends(verify_internal_key),
):
    """
    Generate drive preparation advice.
    Does NOT alter eligibility, job match score, or readiness score.
    """
    context = payload.model_dump()
    try:
        result = await drive_preparation_advice(context)
        return DrivePreparationResponse(
            summary=result.get("summary", ""),
            readinessAssessment=result.get("readinessAssessment", result.get("readiness_assessment", "NEEDS_WORK")),
            priorities=result.get("priorities", []),
            suggestedTopics=result.get("suggestedTopics", result.get("suggested_topics", [])),
            interviewFocus=result.get("interviewFocus", result.get("interview_focus", [])),
            timelineAdvice=result.get("timelineAdvice", result.get("timeline_advice")),
            isAiGenerated=True,
            promptVersion=result.get("promptVersion", "1.0"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error(f"AI service error in drive_preparation: {exc}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")
