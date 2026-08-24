import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import * as careerPathController from '../controllers/careerPath.controller';
import * as careerGoalController from '../controllers/careerGoal.controller';
import * as learningResourceController from '../controllers/learningResource.controller';
import * as skillGapController from '../controllers/skillGap.controller';
import * as readinessController from '../controllers/readiness.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ── Student Career Goals (Student role only) ──────────────────────────────────
router.get('/me/goal', requireRole('STUDENT'), careerGoalController.getMyCareerGoal);
router.put('/me/goal', requireRole('STUDENT'), careerGoalController.setMyCareerGoal);
router.delete('/me/goal', requireRole('STUDENT'), careerGoalController.deleteMyCareerGoal);

// ── Phase 8: Skill Gap Analysis (Student role only) ───────────────────────────
// POST triggers computation (or re-computation); GET reads saved results.
router.post('/me/skill-gap', requireRole('STUDENT'), skillGapController.computeSkillGap);
router.get('/me/skill-gap', requireRole('STUDENT'), skillGapController.getSkillGap);

// ── Phase 9: Placement Readiness (Student role only) ──────────────────────────
router.post('/me/readiness', requireRole('STUDENT'), readinessController.computeReadiness);
router.get('/me/readiness', requireRole('STUDENT'), readinessController.getReadiness);

// ── Skills Catalog (Both Officer and Student) ────────────────────────────────
router.get('/skills', requireRole('PLACEMENT_OFFICER', 'STUDENT'), careerPathController.listSkills);

// ── Career Paths ─────────────────────────────────────────────────────────────
router.get('/paths', requireRole('PLACEMENT_OFFICER', 'STUDENT'), careerPathController.listCareerPaths);
router.get('/paths/:id', requireRole('PLACEMENT_OFFICER', 'STUDENT'), careerPathController.getCareerPath);

// Officer-only Career Path Management
router.post('/paths', requireRole('PLACEMENT_OFFICER'), careerPathController.createCareerPath);
router.patch('/paths/:id', requireRole('PLACEMENT_OFFICER'), careerPathController.updateCareerPath);
router.post('/paths/:id/activate', requireRole('PLACEMENT_OFFICER'), careerPathController.activateCareerPath);
router.post('/paths/:id/deactivate', requireRole('PLACEMENT_OFFICER'), careerPathController.deactivateCareerPath);

// Skill Requirement Management (Officer only)
router.post('/paths/:id/skills', requireRole('PLACEMENT_OFFICER'), careerPathController.addSkillRequirement);
router.patch('/paths/:id/skills/:skillId', requireRole('PLACEMENT_OFFICER'), careerPathController.updateSkillRequirement);
router.delete('/paths/:id/skills/:skillId', requireRole('PLACEMENT_OFFICER'), careerPathController.removeSkillRequirement);

// ── Learning Resources ───────────────────────────────────────────────────────
router.get('/resources', requireRole('PLACEMENT_OFFICER', 'STUDENT'), learningResourceController.listLearningResources);
router.get('/resources/:id', requireRole('PLACEMENT_OFFICER', 'STUDENT'), learningResourceController.getLearningResource);

// Officer-only Learning Resource Management
router.post('/resources', requireRole('PLACEMENT_OFFICER'), learningResourceController.createLearningResource);
router.patch('/resources/:id', requireRole('PLACEMENT_OFFICER'), learningResourceController.updateLearningResource);
router.delete('/resources/:id', requireRole('PLACEMENT_OFFICER'), learningResourceController.deleteLearningResource);

export default router;
