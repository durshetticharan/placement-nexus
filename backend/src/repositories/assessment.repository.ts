import { PrismaClient, AssessmentCategory, AssessmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ── Assessment CRUD ───────────────────────────────────────────────────────────

export async function createAssessment(data: {
  title: string;
  description?: string | null;
  category: AssessmentCategory;
  topic: string;
  difficulty?: string | null;
  durationMins: number;
  passPercentage?: number | null;
  createdById: string;
  status?: AssessmentStatus;
}) {
  return prisma.assessment.create({ data });
}

export async function findAssessmentById(id: string) {
  return prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { createdAt: 'asc' },
        include: {
          options: {
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  });
}

export async function listAssessments(filters: {
  category?: AssessmentCategory;
  topic?: string;
  status?: AssessmentStatus;
}) {
  return prisma.assessment.findMany({
    where: {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.topic ? { topic: { contains: filters.topic, mode: 'insensitive' } } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      _count: {
        select: { questions: true, attempts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAssessment(id: string, data: Partial<{
  title: string;
  description: string | null;
  category: AssessmentCategory;
  topic: string;
  difficulty: string | null;
  durationMins: number;
  passPercentage: number | null;
  status: AssessmentStatus;
}>) {
  return prisma.assessment.update({ where: { id }, data });
}

export async function deleteAssessment(id: string) {
  return prisma.assessment.delete({ where: { id } });
}

export async function countAttempts(assessmentId: string): Promise<number> {
  return prisma.assessmentAttempt.count({ where: { assessmentId } });
}

// ── Question CRUD ─────────────────────────────────────────────────────────────

export async function createQuestion(assessmentId: string, data: {
  type: string;
  text: string;
  topic?: string | null;
  difficulty?: string | null;
  marks: number;
  starterCode?: string | null;
  testCases?: object | null;
}) {
  return prisma.question.create({
    data: {
      assessmentId,
      type: data.type as any,
      text: data.text,
      topic: data.topic,
      difficulty: data.difficulty,
      marks: data.marks,
      starterCode: data.starterCode,
      testCases: data.testCases ?? undefined,
    },
    include: { options: true },
  });
}

export async function findQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: { options: true },
  });
}

export async function updateQuestion(id: string, data: Partial<{
  type: string;
  text: string;
  topic: string | null;
  difficulty: string | null;
  marks: number;
  starterCode: string | null;
  testCases: object | null;
}>) {
  return prisma.question.update({
    where: { id },
    data: data as any,
    include: { options: true },
  });
}

export async function deleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

// ── QuestionOption CRUD ───────────────────────────────────────────────────────

export async function createQuestionOptions(
  questionId: string,
  options: Array<{ text: string; isCorrect: boolean }>,
) {
  return prisma.$transaction(
    options.map((opt) =>
      prisma.questionOption.create({
        data: { questionId, text: opt.text, isCorrect: opt.isCorrect },
      }),
    ),
  );
}

export async function updateQuestionOption(id: string, data: Partial<{ text: string; isCorrect: boolean }>) {
  return prisma.questionOption.update({ where: { id }, data });
}

export async function deleteQuestionOption(id: string) {
  return prisma.questionOption.delete({ where: { id } });
}

export async function deleteOptionsByQuestion(questionId: string) {
  return prisma.questionOption.deleteMany({ where: { questionId } });
}
