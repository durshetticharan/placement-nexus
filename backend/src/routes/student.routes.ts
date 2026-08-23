import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import {
  academicSchema,
  addSkillSchema,
  updateSkillSchema,
  projectSchema,
  updateProjectSchema,
  internshipSchema,
  updateInternshipSchema,
  certificationSchema,
  updateCertificationSchema,
  achievementSchema,
  updateAchievementSchema,
} from '../validation/student.validation';

const router = Router();

// Protect all routes: require student authentication
router.use(requireAuth, requireRole('STUDENT'));

router.get('/me', studentController.getProfile);
router.put('/me/academics', validate(academicSchema), studentController.upsertAcademics);

// Skills
router.post('/me/skills', validate(addSkillSchema), studentController.addSkill);
router.patch('/me/skills/:id', validate(updateSkillSchema), studentController.updateSkill);
router.delete('/me/skills/:id', studentController.removeSkill);

// Projects
router.post('/me/projects', validate(projectSchema), studentController.addProject);
router.patch('/me/projects/:id', validate(updateProjectSchema), studentController.updateProject);
router.delete('/me/projects/:id', studentController.deleteProject);

// Internships
router.post('/me/internships', validate(internshipSchema), studentController.addInternship);
router.patch('/me/internships/:id', validate(updateInternshipSchema), studentController.updateInternship);
router.delete('/me/internships/:id', studentController.deleteInternship);

// Certifications
router.post('/me/certifications', validate(certificationSchema), studentController.addCertification);
router.patch('/me/certifications/:id', validate(updateCertificationSchema), studentController.updateCertification);
router.delete('/me/certifications/:id', studentController.deleteCertification);

// Achievements
router.post('/me/achievements', validate(achievementSchema), studentController.addAchievement);
router.patch('/me/achievements/:id', validate(updateAchievementSchema), studentController.updateAchievement);
router.delete('/me/achievements/:id', studentController.deleteAchievement);

export default router;
