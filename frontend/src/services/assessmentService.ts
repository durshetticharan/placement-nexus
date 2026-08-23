import api from './api';

export type AssessmentCategory = 'APTITUDE' | 'TECHNICAL' | 'CODING';
export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'CODING' | 'DESCRIPTIVE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'EXPIRED';

export interface QuestionOption {
  id?: string;
  questionId?: string;
  text: string;
  isCorrect?: boolean; // undefined for students
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface Question {
  id: string;
  assessmentId: string;
  type: QuestionType;
  text: string;
  topic?: string | null;
  difficulty?: Difficulty | null;
  marks: number;
  starterCode?: string | null;
  testCases?: TestCase[] | null;
  options: QuestionOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string | null;
  category: AssessmentCategory;
  topic: string;
  difficulty?: Difficulty | null;
  durationMins: number;
  passPercentage?: number | null;
  status: AssessmentStatus;
  createdById: string;
  questions?: Question[];
  _count?: {
    questions: number;
    attempts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentPayload {
  title: string;
  description?: string | null;
  category: AssessmentCategory;
  topic: string;
  difficulty?: Difficulty | null;
  durationMins: number;
  passPercentage?: number | null;
}

export interface QuestionPayload {
  type: QuestionType;
  text: string;
  topic?: string | null;
  difficulty?: Difficulty | null;
  marks?: number;
  starterCode?: string | null;
  testCases?: TestCase[] | null;
  options?: Array<{ text: string; isCorrect?: boolean }>;
}

export interface SaveAnswerPayload {
  questionId: string;
  selectedOptionId?: string | null;
  selectedOptionIds?: string[] | null;
  freeTextAnswer?: string | null;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  timeTakenSecs?: number | null;
  assessment: Assessment;
  answers?: Array<{
    id: string;
    questionId: string;
    selectedOptionId?: string | null;
    freeTextAnswer?: string | null;
    isCorrect?: boolean | null;
    marksAwarded?: number | null;
  }>;
  result?: AssessmentResult | null;
  hasUngradedQuestions?: boolean;
  pendingManualReviewCount?: number;
}

export interface AssessmentResult {
  id: string;
  attemptId: string;
  totalMarks: number;
  scoredMarks: number;
  percentage: number;
  percentile?: number | null;
  topicBreakdown: Record<string, number>;
  createdAt: string;
}

export interface StartAttemptResponse {
  attempt: AssessmentAttempt;
  questions: Question[];
  resumed: boolean;
}

export interface SubmitAttemptResponse {
  result: AssessmentResult;
  hasUngradedQuestions: boolean;
  pendingManualReviewCount: number;
  status: AttemptStatus;
}

// ── Officer API Calls ─────────────────────────────────────────────────────────

export async function createAssessment(data: CreateAssessmentPayload): Promise<Assessment> {
  const res = await api.post('/assessments', data);
  return res.data.data;
}

export async function listAssessments(filters?: {
  category?: AssessmentCategory;
  topic?: string;
  status?: AssessmentStatus;
}): Promise<Assessment[]> {
  const res = await api.get('/assessments', { params: filters });
  return res.data.data;
}

export async function getAssessment(id: string): Promise<Assessment> {
  const res = await api.get(`/assessments/${id}`);
  return res.data.data;
}

export async function updateAssessment(
  id: string,
  data: Partial<CreateAssessmentPayload>
): Promise<Assessment> {
  const res = await api.patch(`/assessments/${id}`, data);
  return res.data.data;
}

export async function deleteAssessment(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/assessments/${id}`);
  return res.data.data;
}

export async function publishAssessment(id: string): Promise<Assessment> {
  const res = await api.post(`/assessments/${id}/publish`);
  return res.data.data;
}

export async function archiveAssessment(id: string): Promise<Assessment> {
  const res = await api.post(`/assessments/${id}/archive`);
  return res.data.data;
}

export async function addQuestion(assessmentId: string, data: QuestionPayload): Promise<Question> {
  const res = await api.post(`/assessments/${assessmentId}/questions`, data);
  return res.data.data;
}

export async function updateQuestion(
  questionId: string,
  data: Partial<QuestionPayload>
): Promise<Question> {
  const res = await api.patch(`/assessments/questions/${questionId}`, data);
  return res.data.data;
}

export async function deleteQuestion(questionId: string): Promise<{ message: string }> {
  const res = await api.delete(`/assessments/questions/${questionId}`);
  return res.data.data;
}

// ── Student Attempt API Calls ──────────────────────────────────────────────────

export async function startAttempt(assessmentId: string): Promise<StartAttemptResponse> {
  const res = await api.post('/attempts/start', { assessmentId });
  return res.data.data;
}

export async function saveAnswer(attemptId: string, data: SaveAnswerPayload): Promise<any> {
  const res = await api.patch(`/attempts/${attemptId}/answers`, data);
  return res.data.data;
}

export async function submitAttempt(attemptId: string): Promise<SubmitAttemptResponse> {
  const res = await api.post(`/attempts/${attemptId}/submit`);
  return res.data.data;
}

export async function getAttemptHistory(): Promise<AssessmentAttempt[]> {
  const res = await api.get('/attempts/history');
  return res.data.data;
}

export async function getResultDetail(attemptId: string): Promise<AssessmentAttempt> {
  const res = await api.get(`/attempts/${attemptId}/result`);
  return res.data.data;
}
