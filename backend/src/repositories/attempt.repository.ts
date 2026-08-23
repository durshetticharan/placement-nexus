import { PrismaClient, AttemptStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ── AssessmentAttempt ─────────────────────────────────────────────────────────

export async function createAttempt(assessmentId: string, studentId: string) {
  return prisma.assessmentAttempt.create({
    data: { assessmentId, studentId, status: AttemptStatus.IN_PROGRESS },
  });
}

export async function findAttemptById(id: string) {
  return prisma.assessmentAttempt.findUnique({
    where: { id },
    include: {
      assessment: {
        include: {
          questions: {
            orderBy: { createdAt: 'asc' },
            include: {
              options: { orderBy: { id: 'asc' } },
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            include: { options: { orderBy: { id: 'asc' } } },
          },
        },
      },
      result: true,
    },
  });
}

/**
 * Find any IN_PROGRESS attempt for this student+assessment combo.
 * Used to detect resume-eligible attempts so we don't create duplicates.
 */
export async function findActiveAttempt(studentId: string, assessmentId: string) {
  return prisma.assessmentAttempt.findFirst({
    where: { studentId, assessmentId, status: AttemptStatus.IN_PROGRESS },
    include: {
      assessment: {
        include: {
          questions: {
            orderBy: { createdAt: 'asc' },
            include: { options: { orderBy: { id: 'asc' } } },
          },
        },
      },
    },
  });
}

/**
 * Upsert an answer for (attemptId, questionId).
 * The schema has @@unique([attemptId, questionId]) so each question can only
 * have ONE answer row per attempt — multiple selections for MCQ_MULTIPLE are
 * serialised into freeTextAnswer as a JSON array of option IDs.
 */
export async function upsertAnswer(
  attemptId: string,
  questionId: string,
  data: {
    selectedOptionId?: string | null;
    freeTextAnswer?: string | null;
    isCorrect?: boolean | null;
    marksAwarded?: number | null;
  },
) {
  return prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, ...data },
    update: { ...data },
  });
}

export async function updateAttemptStatus(
  id: string,
  data: {
    status: AttemptStatus;
    submittedAt?: Date;
    timeTakenSecs?: number;
  },
) {
  return prisma.assessmentAttempt.update({ where: { id }, data });
}

export async function findAttemptsByStudent(studentId: string) {
  return prisma.assessmentAttempt.findMany({
    where: { studentId },
    include: {
      assessment: {
        select: { id: true, title: true, category: true, topic: true, durationMins: true },
      },
      result: true,
    },
    orderBy: { startedAt: 'desc' },
  });
}

// ── AssessmentResult ──────────────────────────────────────────────────────────

export async function createResult(
  attemptId: string,
  data: {
    totalMarks: number;
    scoredMarks: number;
    percentage: number;
    topicBreakdown: object;
  },
) {
  return prisma.assessmentResult.create({
    data: {
      attemptId,
      totalMarks: data.totalMarks,
      scoredMarks: data.scoredMarks,
      percentage: data.percentage,
      topicBreakdown: data.topicBreakdown,
    },
  });
}

export async function findResultByAttemptId(attemptId: string) {
  return prisma.assessmentResult.findUnique({ where: { attemptId } });
}
