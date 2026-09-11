/**
 * AI Service — frontend API calls via the Express backend.
 * Frontend NEVER calls the FastAPI service directly.
 * No API keys are present in frontend code.
 */
import api from './api';

export interface ResumeAnalysisResult {
  summary: string;
  atsScore?: number;
  extractedSkills: string[];
  missingSections: string[];
  strengths: string[];
  improvements: string[];
  confidence: string;
  isAiGenerated: boolean;
}

export interface CareerGuidanceResult {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  shortTermActions: string[];
  longTermActions: string[];
  confidence: string;
  isAiGenerated: boolean;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hint?: string;
}

export interface InterviewSessionResult {
  sessionId: string;
  questions: InterviewQuestion[];
  isAiGenerated: boolean;
  disclaimer: string;
}

export interface EvaluationResult {
  evaluation: {
    relevance: number;
    clarity: number;
    technicalDepth: number;
    completeness: number;
    overall: number;
    feedback: string;
    improvements: string[];
    strengths: string[];
  };
  isAiGenerated: boolean;
  disclaimer: string;
}

export interface DrivePreparationResult {
  summary: string;
  readinessAssessment: 'STRONG' | 'MODERATE' | 'NEEDS_WORK';
  priorities: string[];
  suggestedTopics: string[];
  interviewFocus: string[];
  timelineAdvice?: string;
  driveRole: string;
  companyName: string;
  isAiGenerated: boolean;
  disclaimer: string;
}

export interface InterviewSession {
  id: string;
  role: string;
  interviewType: string;
  driveId?: string;
  createdAt: string;
  isAiGenerated: boolean;
}

const AI_BASE = '/ai';

export async function analyzeResume(resumeText: string, jobDescription?: string): Promise<ResumeAnalysisResult> {
  const { data } = await api.post(`${AI_BASE}/resume/analyze`, { 
    resume_text: resumeText,
    job_description: jobDescription
  });
  return data.data;
}

export async function getCareerGuidance(): Promise<CareerGuidanceResult> {
  const { data } = await api.post(`${AI_BASE}/career/guidance`, {});
  return data.data;
}

export async function generateInterviewQuestions(params: {
  role: string;
  required_skills?: string[];
  interview_type?: string;
  count?: number;
  drive_context?: string;
  drive_id?: string;
}): Promise<InterviewSessionResult> {
  const { data } = await api.post(`${AI_BASE}/interview/questions`, params);
  return data.data;
}

export async function evaluateAnswer(params: {
  session_id?: string;
  question: string;
  answer: string;
  role: string;
  topic?: string;
}): Promise<EvaluationResult> {
  const { data } = await api.post(`${AI_BASE}/interview/evaluate`, params);
  return data.data;
}

export async function getDrivePreparationAdvice(driveId: string): Promise<DrivePreparationResult> {
  const { data } = await api.post(`${AI_BASE}/drives/${driveId}/preparation`);
  return data.data;
}

export async function listInterviewSessions(): Promise<InterviewSession[]> {
  const { data } = await api.get(`${AI_BASE}/interview/sessions`);
  return data.data;
}

export async function getAIHealth(): Promise<{ status: string; provider: string }> {
  const { data } = await api.get(`${AI_BASE}/health`);
  return data.data;
}
