/**
 * skillGap.controller.ts
 *
 * HTTP handlers for Phase 8 Skill Gap Analysis endpoints.
 * Both endpoints are STUDENT-only (enforced at the router level).
 *
 *   POST /career/me/skill-gap  — trigger computation and save
 *   GET  /career/me/skill-gap  — read existing gaps (with resources)
 */

import { Request, Response } from 'express';
import { ServiceError } from '../services/careerPath.service';
import * as skillGapService from '../services/skillGap.service';

// ── POST /career/me/skill-gap ─────────────────────────────────────────────────

/**
 * Triggers (or re-triggers) skill gap computation for the authenticated student.
 *
 * Optional query param: ?careerPathId=<id>
 * If omitted, uses the student's primary career goal.
 */
export async function computeSkillGap(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    // Optional: client can request analysis for a specific path
    const careerPathId = (req.query.careerPathId as string | undefined) || undefined;

    const result = await skillGapService.computeAndSaveGaps(userId, careerPathId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    console.error('[SkillGap] computeSkillGap error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to compute skill gap analysis.' },
    });
  }
}

// ── GET /career/me/skill-gap ──────────────────────────────────────────────────

/**
 * Returns previously computed skill gaps for the authenticated student.
 * Does NOT trigger recomputation — client must POST to refresh.
 *
 * Optional query param: ?careerPathId=<id>
 * If provided, filters gaps to only those relevant to that career path.
 */
export async function getSkillGap(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const careerPathId = (req.query.careerPathId as string | undefined) || undefined;

    const result = await skillGapService.getGapAnalysis(userId, careerPathId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    console.error('[SkillGap] getSkillGap error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve skill gap analysis.' },
    });
  }
}
