/**
 * AI Service Client
 * Calls the internal FastAPI AI service from the Express backend.
 * The Express backend is the ONLY caller — frontend never reaches the AI service directly.
 * All AI keys and the internal service key are server-side env vars only.
 */
import * as http from 'http';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_INTERNAL_KEY = process.env.AI_INTERNAL_KEY || '';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_SECONDS || '45', 10) * 1000;

interface AIClientOptions {
  method?: string;
  path: string;
  body?: unknown;
}

async function aiRequest<T>(opts: AIClientOptions): Promise<T> {
  const { method = 'POST', path, body } = opts;
  const payload = body ? JSON.stringify(body) : '';

  return new Promise<T>((resolve, reject) => {
    const url = new URL(path, AI_SERVICE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 8000,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-Internal-Key': AI_INTERNAL_KEY,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(Object.assign(new Error(parsed.detail || 'AI service error'), {
                code: 'AI_SERVICE_ERROR',
                statusCode: res.statusCode,
              }));
            } else {
              resolve(parsed as T);
            }
          } catch {
            reject(Object.assign(new Error('AI service returned invalid JSON'), {
              code: 'AI_INVALID_RESPONSE',
              statusCode: 502,
            }));
          }
        });
      }
    );

    req.setTimeout(AI_TIMEOUT_MS, () => {
      req.destroy();
      reject(Object.assign(new Error('AI service request timed out'), {
        code: 'AI_TIMEOUT',
        statusCode: 504,
      }));
    });

    req.on('error', (err) => {
      reject(Object.assign(new Error(`AI service unreachable: ${err.message}`), {
        code: 'AI_UNAVAILABLE',
        statusCode: 503,
      }));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

export async function checkAIHealth(): Promise<{ status: string; provider: string }> {
  return aiRequest({ method: 'GET', path: '/health' });
}

export interface AIResumeResponse {
  atsScore?: number;
  ats_score?: number;
  extractedSkills?: string[];
  extracted_skills?: string[];
  missingSections?: string[];
  missing_sections?: string[];
  improvements?: string[];
  [key: string]: any;
}

export async function analyzeResume(payload: {
  resume_text: string;
  student_id: string;
  job_description?: string;
}): Promise<AIResumeResponse> {
  return aiRequest<AIResumeResponse>({ path: '/ai/resume/analyze', body: payload });
}

export interface AICareerResponse {
  [key: string]: any;
}

export async function getCareerGuidance(payload: {
  student_id: string;
  current_skills: string[];
  career_goal?: string;
  skill_gaps: string[];
  readiness_score?: number;
  cgpa?: number;
  graduation_year?: number;
  placement_status?: string;
}): Promise<AICareerResponse> {
  return aiRequest<AICareerResponse>({ path: '/ai/career/guidance', body: payload });
}

export interface AIInterviewQuestionsResponse {
  questions?: any[];
  promptVersion?: string;
  [key: string]: any;
}

export async function generateInterviewQuestions(payload: {
  role: string;
  required_skills: string[];
  interview_type: string;
  count: number;
  drive_context?: string;
}): Promise<AIInterviewQuestionsResponse> {
  return aiRequest<AIInterviewQuestionsResponse>({ path: '/ai/interview/questions', body: payload });
}

export interface AIInterviewEvaluateResponse {
  [key: string]: any;
}

export async function evaluateInterviewAnswer(payload: {
  question: string;
  answer: string;
  role: string;
  topic?: string;
}): Promise<AIInterviewEvaluateResponse> {
  return aiRequest<AIInterviewEvaluateResponse>({ path: '/ai/interview/evaluate', body: payload });
}

export interface AIDrivePrepResponse {
  [key: string]: any;
}

export async function getDrivePreparationAdvice(payload: {
  student_id: string;
  drive_role: string;
  drive_description?: string;
  required_skills: string[];
  preferred_skills: string[];
  student_skills: string[];
  skill_gaps: string[];
  readiness_score?: number;
  preparation_progress?: number;
}): Promise<AIDrivePrepResponse> {
  return aiRequest<AIDrivePrepResponse>({ path: '/ai/drive/preparation', body: payload });
}
