import * as assessmentRepo from '../repositories/assessment.repository';
import { AssessmentCategory, AssessmentStatus, QuestionType } from '@prisma/client';
import { QuestionInput } from '../validation/assessment.validation';

function createError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

// ── Assessment Management ─────────────────────────────────────────────────────

export async function createAssessment(
  officerId: string,
  data: {
    title: string;
    description?: string | null;
    category: AssessmentCategory;
    topic: string;
    difficulty?: string | null;
    durationMins: number;
    passPercentage?: number | null;
  },
) {
  return assessmentRepo.createAssessment({
    ...data,
    status: AssessmentStatus.DRAFT,
    createdById: officerId,
  });
}

export async function listAssessments(filters: {
  category?: AssessmentCategory;
  topic?: string;
  status?: AssessmentStatus;
}) {
  return assessmentRepo.listAssessments(filters);
}

export async function getAssessmentForOfficer(id: string) {
  const assessment = await assessmentRepo.findAssessmentById(id);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }
  // Officer sees full data including isCorrect flags
  return assessment;
}

export async function getAssessmentForStudent(id: string) {
  const assessment = await assessmentRepo.findAssessmentById(id);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }
  if (assessment.status !== AssessmentStatus.PUBLISHED) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }

  // Strip answer key: remove isCorrect from each option
  return {
    ...assessment,
    questions: assessment.questions.map((q) => ({
      ...q,
      // Remove testCase hidden flags and correct answers from options
      options: q.options.map(({ isCorrect: _stripped, ...safeOption }) => safeOption),
      // Strip hidden test cases for CODING questions (student sees only visible ones)
      testCases:
        q.type === QuestionType.CODING && q.testCases
          ? (q.testCases as Array<{ input: string; expectedOutput: string; isHidden: boolean }>)
              .filter((tc) => !tc.isHidden)
              .map(({ isHidden: _h, ...safe }) => safe)
          : undefined,
    })),
  };
}

export async function updateAssessmentMeta(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    category: AssessmentCategory;
    topic: string;
    difficulty: string | null;
    durationMins: number;
    passPercentage: number | null;
  }>,
) {
  const assessment = await assessmentRepo.findAssessmentById(id);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }

  if (assessment.status === AssessmentStatus.PUBLISHED) {
    const attemptCount = await assessmentRepo.countAttempts(id);
    if (attemptCount > 0) {
      throw createError(
        'This assessment is published and has existing attempts. It cannot be modified. Archive it first.',
        'CONFLICT',
        409,
      );
    }
  }

  return assessmentRepo.updateAssessment(id, data);
}

export async function publishAssessment(id: string) {
  const assessment = await assessmentRepo.findAssessmentById(id);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }
  if (assessment.status === AssessmentStatus.PUBLISHED) {
    throw createError('Assessment is already published.', 'CONFLICT', 409);
  }
  if (assessment.status === AssessmentStatus.ARCHIVED) {
    throw createError('A archived assessment cannot be published. Create a new one instead.', 'CONFLICT', 409);
  }
  if (assessment.questions.length === 0) {
    throw createError(
      'Cannot publish an assessment with no questions. Add at least one question first.',
      'VALIDATION_ERROR',
      400,
    );
  }
  return assessmentRepo.updateAssessment(id, { status: AssessmentStatus.PUBLISHED });
}

export async function archiveAssessment(id: string) {
  const assessment = await assessmentRepo.findAssessmentById(id);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }
  if (assessment.status === AssessmentStatus.ARCHIVED) {
    throw createError('Assessment is already archived.', 'CONFLICT', 409);
  }
  return assessmentRepo.updateAssessment(id, { status: AssessmentStatus.ARCHIVED });
}

export async function hardDeleteAssessment(id: string) {
  const assessment = await assessmentRepo.findAssessmentById(id);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }
  if (assessment.status !== AssessmentStatus.DRAFT) {
    throw createError(
      'Only DRAFT assessments can be deleted. Published or archived assessments must be archived instead.',
      'CONFLICT',
      409,
    );
  }
  const attemptCount = await assessmentRepo.countAttempts(id);
  if (attemptCount > 0) {
    throw createError(
      'Cannot delete an assessment that has existing attempts. Archive it instead.',
      'CONFLICT',
      409,
    );
  }
  return assessmentRepo.deleteAssessment(id);
}

// ── Question Management ───────────────────────────────────────────────────────

/**
 * Validates MCQ/CODING/DESCRIPTIVE business rules before creating a question.
 */
function validateQuestionRules(data: QuestionInput) {
  const { type, options, testCases } = data;

  if (type === QuestionType.MCQ_SINGLE) {
    if (!options || options.length < 2) {
      throw createError(
        'MCQ_SINGLE questions must have at least 2 options.',
        'VALIDATION_ERROR',
        400,
      );
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw createError(
        'MCQ_SINGLE questions must have exactly one correct option.',
        'VALIDATION_ERROR',
        400,
      );
    }
  }

  if (type === QuestionType.MCQ_MULTIPLE) {
    if (!options || options.length < 2) {
      throw createError(
        'MCQ_MULTIPLE questions must have at least 2 options.',
        'VALIDATION_ERROR',
        400,
      );
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount < 1) {
      throw createError(
        'MCQ_MULTIPLE questions must have at least one correct option.',
        'VALIDATION_ERROR',
        400,
      );
    }
  }

  if (type === QuestionType.CODING) {
    if (!testCases || testCases.length === 0) {
      throw createError(
        'CODING questions must include at least one test case.',
        'VALIDATION_ERROR',
        400,
      );
    }
  }

  // DESCRIPTIVE — no options or testCases needed; both are silently ignored
}

export async function addQuestion(assessmentId: string, data: QuestionInput) {
  const assessment = await assessmentRepo.findAssessmentById(assessmentId);
  if (!assessment) {
    throw createError('Assessment not found.', 'NOT_FOUND', 404);
  }

  validateQuestionRules(data);

  const { options, testCases, ...questionData } = data;
  const question = await assessmentRepo.createQuestion(assessmentId, {
    ...questionData,
    testCases: testCases ? (testCases as object) : null,
  });

  if (
    (data.type === QuestionType.MCQ_SINGLE || data.type === QuestionType.MCQ_MULTIPLE) &&
    options &&
    options.length > 0
  ) {
    await assessmentRepo.createQuestionOptions(question.id, options);
  }

  // Return the question with its freshly-created options
  return assessmentRepo.findQuestionById(question.id);
}

export async function updateQuestion(questionId: string, data: Partial<QuestionInput>) {
  const question = await assessmentRepo.findQuestionById(questionId);
  if (!question) {
    throw createError('Question not found.', 'NOT_FOUND', 404);
  }

  // Check if the parent assessment is published WITH attempts
  const assessment = await assessmentRepo.findAssessmentById(question.assessmentId);
  if (assessment && assessment.status === AssessmentStatus.PUBLISHED) {
    const attemptCount = await assessmentRepo.countAttempts(question.assessmentId);
    if (attemptCount > 0) {
      throw createError(
        'Questions cannot be modified after the assessment has been published and has existing attempts.',
        'CONFLICT',
        409,
      );
    }
  }

  // If full question data provided, validate rules again
  const effectiveType = data.type ?? question.type;
  const effectiveOptions = data.options ?? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }));

  validateQuestionRules({ ...question, type: effectiveType, options: effectiveOptions, ...data } as QuestionInput);

  const { options, testCases, ...questionData } = data;

  await assessmentRepo.updateQuestion(questionId, {
    ...questionData,
    ...(testCases !== undefined ? { testCases: testCases as object } : {}),
  } as any);

  // Replace options if they were provided
  if (options !== undefined) {
    await assessmentRepo.deleteOptionsByQuestion(questionId);
    if (options.length > 0) {
      await assessmentRepo.createQuestionOptions(questionId, options);
    }
  }

  return assessmentRepo.findQuestionById(questionId);
}

export async function deleteQuestion(questionId: string) {
  const question = await assessmentRepo.findQuestionById(questionId);
  if (!question) {
    throw createError('Question not found.', 'NOT_FOUND', 404);
  }

  const assessment = await assessmentRepo.findAssessmentById(question.assessmentId);
  if (assessment && assessment.status === AssessmentStatus.PUBLISHED) {
    const attemptCount = await assessmentRepo.countAttempts(question.assessmentId);
    if (attemptCount > 0) {
      throw createError(
        'Questions cannot be deleted after the assessment has been published and has existing attempts.',
        'CONFLICT',
        409,
      );
    }
  }

  await assessmentRepo.deleteQuestion(questionId);
  return { message: 'Question deleted successfully.' };
}
