/**
 * ats.controller.ts
 *
 * Thin HTTP handler for the ATS resume-analysis endpoint.
 *
 * Responsibilities:
 *  1. Auth + input validation
 *  2. PDF text extraction via the AI service
 *  3. Request deduplication & caching
 *  4. Delegates all business logic to ats.service
 *  5. Returns the JSON response
 *
 * No scoring math, no skill normalization — that lives in ats.service.ts.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as atsService from '../services/ats.service';
import { extractTextFromPdf } from '../utils/pdfExtractor';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_INTERNAL_KEY = process.env.AI_INTERNAL_KEY || '';

// ── Caching & Deduplication ──────────────────────────────────────────────────

const atsCache = new Map<string, any>();
const inFlightRequests = new Map<string, Promise<any>>();

// ── Controller ───────────────────────────────────────────────────────────────

export const analyzeResume = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // ── 1. Auth & Validation ─────────────────────────────────────────────
    if (!req.user || req.user.role !== 'STUDENT') {
      const err: any = new Error('Unauthorized');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const { jobDescription, resumeText: rawResumeText, resume_text } = req.body;
    if (!jobDescription || jobDescription.trim().length === 0) {
      const err: any = new Error('Job description is required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const mode = process.env.ATS_EXTRACTION_MODE || 'deterministic';
    const version = process.env.ATS_EXTRACTION_VERSION || 'v1';

    let resumeText = (rawResumeText || resume_text || '').trim();

    // ── 2. PDF Text Extraction (if file uploaded) ────────────────────────
    if (req.file && req.file.buffer) {
      // 2a. Primary: In-process direct PDF extraction (fast, deterministic, independent of AI service)
      try {
        const extraction = await extractTextFromPdf(req.file.buffer);
        if (extraction.success && extraction.text.trim().length >= 10) {
          resumeText = extraction.text;
        }
      } catch (inProcessErr) {
        console.warn('In-process PDF extraction notice:', inProcessErr);
      }

      // 2b. Secondary fallback: Attempt AI service /ai/resume/extract-text if in-process didn't produce text
      if (!resumeText || resumeText.length < 10) {
        try {
          const form = new FormData();
          const fileBlob = new Blob([new Uint8Array(req.file.buffer)], {
            type: 'application/pdf',
          });
          form.append('file', fileBlob, req.file.originalname || 'resume.pdf');

          const extractRes = await fetch(`${AI_SERVICE_URL}/ai/resume/extract-text`, {
            method: 'POST',
            headers: { 'X-Internal-Key': AI_INTERNAL_KEY },
            body: form,
            signal: AbortSignal.timeout(10000),
          });

          if (extractRes.ok) {
            const extractData: any = await extractRes.json();
            if (extractData?.text && extractData.text.trim().length > 0) {
              resumeText = extractData.text;
            }
          }
        } catch (_aiErr) {
          // AI service unavailable or timed out — fallback continues
        }
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      const err: any = new Error('Unable to extract readable text from this PDF. Please ensure your PDF contains selectable text (not scanned images).');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // ── 3. Cache Check ───────────────────────────────────────────────────
    const normalizedResume = resumeText.trim().toLowerCase();
    const normalizedJd = jobDescription.trim().toLowerCase();
    const cacheKeyRaw = `${normalizedResume}|${normalizedJd}|${version}|${mode}`;
    const cacheKey = crypto
      .createHash('sha256')
      .update(cacheKeyRaw)
      .digest('hex');

    if (atsCache.has(cacheKey)) {
      res.status(200).json({ success: true, data: atsCache.get(cacheKey) });
      return;
    }

    if (inFlightRequests.has(cacheKey)) {
      const data = await inFlightRequests.get(cacheKey);
      res.status(200).json({ success: true, data });
      return;
    }

    // ── 4. Analyze (delegated to service) ────────────────────────────────
    const userId =
      (req.user as any).userId || (req.user as any).id || 'unknown';

    const analysisPromise = atsService.analyzeResume(
      resumeText,
      jobDescription,
      userId,
      mode,
      version,
    );

    inFlightRequests.set(cacheKey, analysisPromise);
    const data = await analysisPromise;
    inFlightRequests.delete(cacheKey);
    atsCache.set(cacheKey, data);

    // ── 5. Response ──────────────────────────────────────────────────────
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
