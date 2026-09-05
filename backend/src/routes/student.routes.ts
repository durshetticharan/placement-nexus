import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import * as resumeController from '../controllers/resume.controller';
import * as profController from '../controllers/professionalProfile.controller';
import * as codingController from '../controllers/codingProfile.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import { resumeUpload } from '../config/upload.config';
import * as driveController from '../controllers/drive.controller';
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
  professionalProfileSchema,
  updateProfessionalProfileSchema,
  codingProfileSchema,
  updateCodingProfileSchema,
} from '../validation/student.validation';

const router = Router();

// Protect all routes: require student authentication
router.use(requireAuth, requireRole('STUDENT'));

// Drives & Eligibility
router.get('/drives', driveController.listStudentDrives);
router.get('/drives/:id', driveController.getDriveDetails);
router.get('/drives/:id/eligibility', driveController.getStudentEligibility);

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

// Resumes
router.post('/me/resumes', resumeUpload.single('resume'), resumeController.uploadResume);
router.get('/me/resumes', resumeController.listResumes);
router.patch('/me/resumes/:id/primary', resumeController.setPrimaryResume);
router.delete('/me/resumes/:id', resumeController.deleteResume);

// Professional Profiles
router.post('/me/professional-profiles', validate(professionalProfileSchema), profController.addProfile);
router.get('/me/professional-profiles', profController.listProfiles);
router.patch('/me/professional-profiles/:id', validate(updateProfessionalProfileSchema), profController.updateProfile);
router.delete('/me/professional-profiles/:id', profController.deleteProfile);

// Coding Profiles
router.post('/me/coding-profiles', validate(codingProfileSchema), codingController.addCodingProfile);
router.get('/me/coding-profiles', codingController.listCodingProfiles);
router.patch('/me/coding-profiles/:id', validate(updateCodingProfileSchema), codingController.updateCodingProfile);
router.delete('/me/coding-profiles/:id', codingController.deleteCodingProfile);

export default router;
