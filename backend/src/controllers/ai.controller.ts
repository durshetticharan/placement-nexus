/**
 * AI Controller — Express request handlers.
 * Authenticates + authorizes, assembles safe context from DB, calls AI client,
 * validates response, persists results, and returns safe DTOs to frontend.
 *
 * AI output NEVER mutates:
 * - Eligibility / DriveRequirement
 * - JobMatch / jobMatchPct / dynamicJobMatch
 * - ReadinessScore
 * - Application status
 * - SkillGap records (without explicit student confirmation)
 */
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as aiClient from '../services/ai.client';

const prisma = new PrismaClient();

// ── Per-user rate limiting (in-memory) ───────────────────────────────────────
const AI_RATE_WINDOW_MS = 60_000;
const AI_RATE_MAX = 5;
const rateStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, endpoint: string): boolean {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + AI_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= AI_RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function rateLimitDeny(res: Response): void {
  res.status(429).json({
    success: false,
    error: { code: 'AI_RATE_LIMIT', message: 'Too many AI requests. Please wait a minute.' },
  });
}

// ── AI Health ─────────────────────────────────────────────────────────────────

export async function aiHealth(req: Request, res: Response): Promise<void> {
  try {
    const health = await aiClient.checkAIHealth();
    res.json({ success: true, data: health });
  } catch {
    res.status(503).json({
      success: false,
      error: { code: 'AI_UNAVAILABLE', message: 'AI service is temporarily unavailable.' },
    });
  }
}

// ── Resume Analysis ───────────────────────────────────────────────────────────

export async function resumeAnalyze(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  if (!checkRateLimit(userId, 'resume-analyze')) { rateLimitDeny(res); return; }

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { resumes: { orderBy: { uploadedAt: 'desc' }, take: 1 } },
    });
    if (!student) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile not found.' } }); return; }

    const resumeText: string = (req.body.resume_text || '').slice(0, 20_000);
    if (resumeText.trim().length < 50) {
      res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_TEXT', message: 'Provide resume_text (min 50 characters) in the request body.' },
      });
      return;
    }

    const jobDescription: string | undefined = req.body.job_description;
    const result = await aiClient.analyzeResume({ resume_text: resumeText, student_id: student.id, job_description: jobDescription });

    // Persist — does NOT mutate StudentSkill
    if (student.resumes.length > 0) {
      await prisma.resumeAnalysis.create({
        data: {
          resumeId: student.resumes[0].id,
          studentId: student.id,
          status: 'COMPLETED',
          atsScore: result.atsScore ?? result.ats_score ?? null,
          extractedSkills: result.extractedSkills || result.extracted_skills || [],
          missingSections: result.missingSections || result.missing_sections || [],
          suggestions: result.improvements ? { list: result.improvements } : undefined,
          isAiGenerated: true,
        },
      });
    }

    res.json({ success: true, data: { ...result, isAiGenerated: true } });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'AI_ERROR', message: err.message || 'Resume analysis failed.' },
    });
  }
}

// ── Career Guidance ───────────────────────────────────────────────────────────

export async function careerGuidance(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  if (!checkRateLimit(userId, 'career-guidance')) { rateLimitDeny(res); return; }

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        careerGoals: { include: { careerPath: true } },
        skillGaps: { include: { skill: true } },
        readinessScores: { orderBy: { computedAt: 'desc' }, take: 1 },
        academics: true,
      },
    });
    if (!student) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile not found.' } }); return; }

    // Build minimal non-sensitive context — no passwords, tokens, auth fields
    const profile = {
      current_skills: student.skills.map((s: any) => s.skill.name),
      career_goal: student.careerGoals[0]?.careerPath?.name ?? null,
      skill_gaps: student.skillGaps.map((g: any) => g.skill.name),
      readiness_score: student.readinessScores[0]?.overallScore ?? null,
      cgpa: student.academics?.cgpa ? Number(student.academics.cgpa) : null,
      graduation_year: student.academics?.graduationYear ?? null,
      placement_status: student.placementStatus,
    };

    const result = await aiClient.getCareerGuidance({
      student_id: student.id,
      current_skills: profile.current_skills,
      career_goal: profile.career_goal ?? undefined,
      skill_gaps: profile.skill_gaps,
      readiness_score: profile.readiness_score ?? undefined,
      cgpa: profile.cgpa ?? undefined,
      graduation_year: profile.graduation_year ?? undefined,
      placement_status: profile.placement_status,
    });

    res.json({ success: true, data: { ...result, isAiGenerated: true } });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'AI_ERROR', message: err.message || 'Career guidance failed.' },
    });
  }
}

// ── Interview Practice — Generate Questions ───────────────────────────────────

export async function interviewGenerateQuestions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  if (!checkRateLimit(userId, 'interview-questions')) { rateLimitDeny(res); return; }

  try {
    const { role, required_skills = [], interview_type = 'General', count = 5, drive_context, drive_id } = req.body;
    if (!role) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'role is required.' } }); return; }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile not found.' } }); return; }

    const result = await aiClient.generateInterviewQuestions({
      role,
      required_skills,
      interview_type,
      count: Math.min(count, 10),
      drive_context,
    });

    const session = await prisma.aIInterviewSession.create({
      data: {
        studentId: student.id,
        role,
        interviewType: interview_type,
        driveId: (drive_id as string) ?? null,
        questions: result.questions || [],
        promptVersion: result.promptVersion || '1.0',
        isAiGenerated: true,
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        questions: result.questions,
        isAiGenerated: true,
        disclaimer: 'AI-generated practice questions only — not actual company interview questions.',
      },
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'AI_ERROR', message: err.message || 'Failed to generate questions.' },
    });
  }
}

// ── Interview Practice — Evaluate Answer ─────────────────────────────────────

export async function interviewEvaluateAnswer(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  if (!checkRateLimit(userId, 'interview-evaluate')) { rateLimitDeny(res); return; }

  try {
    const { session_id, question, answer, role, topic } = req.body;
    if (!question || !answer || !role) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'question, answer, and role are required.' } });
      return;
    }

    // Verify session ownership if provided
    if (session_id) {
      const student = await prisma.student.findUnique({ where: { userId } });
      const session = await prisma.aIInterviewSession.findFirst({
        where: { id: session_id, studentId: student?.id },
      });
      if (!session) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Session not found or not yours.' } }); return; }
    }

    const result = await aiClient.evaluateInterviewAnswer({ question, answer, role, topic });

    res.json({
      success: true,
      data: {
        ...result,
        isAiGenerated: true,
        disclaimer: 'AI-generated advisory feedback for practice only — not an official hiring assessment.',
      },
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'AI_ERROR', message: err.message || 'Evaluation failed.' },
    });
  }
}

// ── Drive Preparation Advice ──────────────────────────────────────────────────

export async function drivePreparationAdvice(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  if (!checkRateLimit(userId, 'drive-prep')) { rateLimitDeny(res); return; }

  try {
    const { drive_id } = req.params;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        skillGaps: { include: { skill: true } },
        readinessScores: { orderBy: { computedAt: 'desc' }, take: 1 },
      },
    });
    if (!student) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile not found.' } }); return; }

    const drive = await prisma.placementDrive.findUnique({
      where: { id: drive_id as string },
      include: {
        requirements: { include: { requiredSkills: true, preferredSkills: true } },
        company: { select: { name: true, industry: true } },
      },
    });
    if (!drive) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } }); return; }

    const req_ = drive.requirements;
    const requiredSkills = req_?.requiredSkills?.map((s: any) => s.name) ?? [];
    const preferredSkills = req_?.preferredSkills?.map((s: any) => s.name) ?? [];
    const studentSkills = student.skills.map((s: any) => s.skill.name);
    const skillGaps = student.skillGaps.map((g: any) => g.skill.name);

    const result = await aiClient.getDrivePreparationAdvice({
      student_id: student.id,
      drive_role: drive.jobTitle,
      drive_description: drive.description ?? undefined,
      required_skills: requiredSkills,
      preferred_skills: preferredSkills,
      student_skills: studentSkills,
      skill_gaps: skillGaps,
      readiness_score: student.readinessScores[0]?.overallScore ?? undefined,
    });

    res.json({
      success: true,
      data: {
        ...result,
        driveRole: drive.jobTitle,
        companyName: drive.company.name,
        isAiGenerated: true,
        disclaimer: 'AI-generated preparation advice only. Eligibility, job match, and readiness scores are determined by official deterministic systems.',
      },
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'AI_ERROR', message: err.message || 'Drive preparation advice failed.' },
    });
  }
}

// ── List Interview Sessions ───────────────────────────────────────────────────

export async function listInterviewSessions(req: Request, res: Response): Promise<void> {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found.' } }); return; }

    const sessions = await prisma.aIInterviewSession.findMany({
      where: { studentId: student.id },
      select: { id: true, role: true, interviewType: true, driveId: true, createdAt: true, isAiGenerated: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: sessions });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list sessions.' } });
  }
}
