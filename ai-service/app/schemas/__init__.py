"""
Pydantic schemas for all AI API endpoints (request + response).
All schemas enforce strict types — FastAPI/Pydantic rejects invalid AI output.
"""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


# ── Request schemas ────────────────────────────────────────────────────────────

class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., max_length=50_000, description="Extracted plain-text content of the resume")
    student_id: str = Field(..., description="Student ID (used for context, not stored in prompt)")
    job_description: Optional[str] = Field(None, max_length=10_000, description="Optional target job description to analyze against")


class CareerGuidanceRequest(BaseModel):
    student_id: str
    current_skills: list[str] = Field(default_factory=list)
    career_goal: Optional[str] = None
    skill_gaps: list[str] = Field(default_factory=list)
    readiness_score: Optional[int] = Field(None, ge=0, le=100)
    cgpa: Optional[float] = None
    graduation_year: Optional[int] = None
    placement_status: Optional[str] = None


class InterviewQuestionsRequest(BaseModel):
    role: str = Field(..., max_length=200)
    required_skills: list[str] = Field(default_factory=list)
    interview_type: str = Field(default="General", description="Technical|Behavioral|HR|Mixed")
    count: int = Field(default=5, ge=1, le=10)
    drive_context: Optional[str] = Field(None, max_length=1000)


class InterviewEvaluateRequest(BaseModel):
    question: str = Field(..., max_length=1000)
    answer: str = Field(..., max_length=5000)
    role: str = Field(..., max_length=200)
    topic: Optional[str] = None


class DrivePreparationRequest(BaseModel):
    student_id: str
    drive_role: str = Field(..., max_length=200)
    drive_description: Optional[str] = Field(None, max_length=2000)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    student_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    readiness_score: Optional[int] = Field(None, ge=0, le=100)
    preparation_progress: Optional[int] = Field(None, ge=0, le=100, description="Percent of preparation tasks completed")


# ── Response schemas ────────────────────────────────────────────────────────────

class ResumeAnalysisResponse(BaseModel):
    summary: str
    ats_score: Optional[int] = Field(None, alias="atsScore", ge=0, le=100)
    extracted_skills: list[str] = Field(default_factory=list, alias="extractedSkills")
    missing_sections: list[str] = Field(default_factory=list, alias="missingSections")
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    keyword_density: Optional[dict[str, Any]] = Field(None, alias="keywordDensity")
    confidence: str = "LOW"
    is_ai_generated: bool = Field(True, alias="isAiGenerated")
    prompt_version: str = Field("1.0", alias="promptVersion")
    model: Optional[str] = None

    class Config:
        populate_by_name = True


class CareerGuidanceResponse(BaseModel):
    summary: str
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    short_term_actions: list[str] = Field(default_factory=list, alias="shortTermActions")
    long_term_actions: list[str] = Field(default_factory=list, alias="longTermActions")
    confidence: str = "LOW"
    is_ai_generated: bool = Field(True, alias="isAiGenerated")
    prompt_version: str = Field("1.0", alias="promptVersion")

    class Config:
        populate_by_name = True


class InterviewQuestion(BaseModel):
    id: int
    question: str
    topic: str
    difficulty: str
    hint: Optional[str] = None


class InterviewQuestionsResponse(BaseModel):
    questions: list[InterviewQuestion]
    is_ai_generated: bool = Field(True, alias="isAiGenerated")
    prompt_version: str = Field("1.0", alias="promptVersion")

    class Config:
        populate_by_name = True


class EvaluationDetail(BaseModel):
    relevance: int = Field(..., ge=1, le=10)
    clarity: int = Field(..., ge=1, le=10)
    technical_depth: int = Field(..., ge=1, le=10, alias="technicalDepth")
    completeness: int = Field(..., ge=1, le=10)
    overall: int = Field(..., ge=1, le=10)
    feedback: str
    improvements: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class InterviewEvaluateResponse(BaseModel):
    evaluation: EvaluationDetail
    is_ai_generated: bool = Field(True, alias="isAiGenerated")
    prompt_version: str = Field("1.0", alias="promptVersion")

    class Config:
        populate_by_name = True


class DrivePreparationResponse(BaseModel):
    summary: str
    readiness_assessment: str = Field("NEEDS_WORK", alias="readinessAssessment")
    priorities: list[str] = Field(default_factory=list)
    suggested_topics: list[str] = Field(default_factory=list, alias="suggestedTopics")
    interview_focus: list[str] = Field(default_factory=list, alias="interviewFocus")
    timeline_advice: Optional[str] = Field(None, alias="timelineAdvice")
    is_ai_generated: bool = Field(True, alias="isAiGenerated")
    prompt_version: str = Field("1.0", alias="promptVersion")

    class Config:
        populate_by_name = True


class ErrorResponse(BaseModel):
    error: str
    code: str
    detail: Optional[str] = None
