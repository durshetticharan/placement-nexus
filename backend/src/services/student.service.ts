import { ProficiencyLevel, PrismaClient } from '@prisma/client';
import * as studentRepo from '../repositories/student.repository';
import { recalculateAndUpdateProfileCompletion } from './profileCompletion.service';

const prisma = new PrismaClient();

function createCustomError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

async function lazyCreateStudentProfileIfMissing(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.role === 'STUDENT') {
    console.warn(`[LAZY_REPAIR] Auto-creating missing Student profile for pre-existing user ${userId}`);
    const rollNumber = 'PENDING_' + userId.slice(-8);
    try {
      await prisma.student.create({
        data: {
          userId: user.id,
          fullName: 'Unnamed Student',
          rollNumber,
        },
      });
    } catch {
      await prisma.student.create({
        data: {
          userId: user.id,
          fullName: 'Unnamed Student',
          rollNumber: rollNumber + '_' + Date.now().toString().slice(-4),
        },
      });
    }
    return studentRepo.findStudentByUserId(userId);
  }
  return null;
}

export async function getStudentProfile(userId: string) {
  let student = await studentRepo.findStudentByUserId(userId);
  if (!student) {
    student = await lazyCreateStudentProfileIfMissing(userId);
  }
  if (!student) {
    throw createCustomError('Student profile not found.', 'NOT_FOUND', 404);
  }
  return student;
}

export async function getStudentIdByUserId(userId: string): Promise<string> {
  let studentId = await studentRepo.findStudentIdByUserId(userId);
  if (!studentId) {
    const student = await lazyCreateStudentProfileIfMissing(userId);
    if (student) {
      studentId = student.id;
    }
  }
  if (!studentId) {
    throw createCustomError('Student profile not found for this user.', 'NOT_FOUND', 404);
  }
  return studentId;
}

// ── Academics ─────────────────────────────────────────────────────────────────

export async function upsertAcademic(
  userId: string,
  data: {
    degree: string;
    branch: string;
    collegeName: string;
    graduationYear: number;
    cgpa: number;
    backlogs: number;
    tenthPercentage?: number;
    twelfthPercentage?: number;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const result = await studentRepo.createOrUpdateAcademic(studentId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return result;
}

// ── Skills ────────────────────────────────────────────────────────────────────

export async function addSkill(
  userId: string,
  data: { name: string; category?: string; selfRating: ProficiencyLevel },
) {
  const studentId = await getStudentIdByUserId(userId);
  const skill = await studentRepo.findOrCreateSkill(data.name, data.category);
  const studentSkill = await studentRepo.addSkill(studentId, skill.id, data.selfRating);
  await recalculateAndUpdateProfileCompletion(studentId);
  return studentSkill;
}

export async function updateSkill(
  userId: string,
  studentSkillId: string,
  data: { selfRating?: ProficiencyLevel },
) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findStudentSkillById(studentSkillId);
  if (!existing) {
    throw createCustomError('Skill record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to modify this skill.', 'FORBIDDEN', 403);
  }

  const updated = await studentRepo.updateSkill(studentSkillId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return updated;
}

export async function removeSkill(userId: string, studentSkillId: string) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findStudentSkillById(studentSkillId);
  if (!existing) {
    throw createCustomError('Skill record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to remove this skill.', 'FORBIDDEN', 403);
  }

  const result = await studentRepo.removeSkill(studentSkillId);
  await recalculateAndUpdateProfileCompletion(studentId);
  return result;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function addProject(
  userId: string,
  data: {
    title: string;
    description: string;
    techStack: string[];
    repoUrl?: string;
    liveUrl?: string;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const project = await studentRepo.addProject(studentId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return project;
}

export async function updateProject(
  userId: string,
  projectId: string,
  data: {
    title?: string;
    description?: string;
    techStack?: string[];
    repoUrl?: string | null;
    liveUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findProjectById(projectId);
  if (!existing) {
    throw createCustomError('Project not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to modify this project.', 'FORBIDDEN', 403);
  }

  const updated = await studentRepo.updateProject(projectId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return updated;
}

export async function deleteProject(userId: string, projectId: string) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findProjectById(projectId);
  if (!existing) {
    throw createCustomError('Project not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to delete this project.', 'FORBIDDEN', 403);
  }

  const deleted = await studentRepo.deleteProject(projectId);
  await recalculateAndUpdateProfileCompletion(studentId);
  return deleted;
}

// ── Internships ──────────────────────────────────────────────────────────────

export async function addInternship(
  userId: string,
  data: {
    companyName: string;
    role: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    isOngoing?: boolean;
    certificateUrl?: string;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const internship = await studentRepo.addInternship(studentId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return internship;
}

export async function updateInternship(
  userId: string,
  internshipId: string,
  data: {
    companyName?: string;
    role?: string;
    description?: string | null;
    startDate?: Date;
    endDate?: Date | null;
    isOngoing?: boolean;
    certificateUrl?: string | null;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findInternshipById(internshipId);
  if (!existing) {
    throw createCustomError('Internship record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to modify this internship.', 'FORBIDDEN', 403);
  }

  const updated = await studentRepo.updateInternship(internshipId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return updated;
}

export async function deleteInternship(userId: string, internshipId: string) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findInternshipById(internshipId);
  if (!existing) {
    throw createCustomError('Internship record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to delete this internship.', 'FORBIDDEN', 403);
  }

  const deleted = await studentRepo.deleteInternship(internshipId);
  await recalculateAndUpdateProfileCompletion(studentId);
  return deleted;
}

// ── Certifications ───────────────────────────────────────────────────────────

export async function addCertification(
  userId: string,
  data: {
    title: string;
    issuingOrg: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialUrl?: string;
    fileUrl?: string;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const cert = await studentRepo.addCertification(studentId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return cert;
}

export async function updateCertification(
  userId: string,
  certId: string,
  data: {
    title?: string;
    issuingOrg?: string;
    issueDate?: Date;
    expiryDate?: Date | null;
    credentialUrl?: string | null;
    fileUrl?: string | null;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findCertificationById(certId);
  if (!existing) {
    throw createCustomError('Certification record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to modify this certification.', 'FORBIDDEN', 403);
  }

  const updated = await studentRepo.updateCertification(certId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return updated;
}

export async function deleteCertification(userId: string, certId: string) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findCertificationById(certId);
  if (!existing) {
    throw createCustomError('Certification record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to delete this certification.', 'FORBIDDEN', 403);
  }

  const deleted = await studentRepo.deleteCertification(certId);
  await recalculateAndUpdateProfileCompletion(studentId);
  return deleted;
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function addAchievement(
  userId: string,
  data: {
    title: string;
    description?: string;
    category?: string;
    date?: Date;
    proofUrl?: string;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const ach = await studentRepo.addAchievement(studentId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return ach;
}

export async function updateAchievement(
  userId: string,
  achievementId: string,
  data: {
    title?: string;
    description?: string | null;
    category?: string | null;
    date?: Date | null;
    proofUrl?: string | null;
  },
) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findAchievementById(achievementId);
  if (!existing) {
    throw createCustomError('Achievement record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to modify this achievement.', 'FORBIDDEN', 403);
  }

  const updated = await studentRepo.updateAchievement(achievementId, data);
  await recalculateAndUpdateProfileCompletion(studentId);
  return updated;
}

export async function deleteAchievement(userId: string, achievementId: string) {
  const studentId = await getStudentIdByUserId(userId);
  const existing = await studentRepo.findAchievementById(achievementId);
  if (!existing) {
    throw createCustomError('Achievement record not found.', 'NOT_FOUND', 404);
  }
  if (existing.studentId !== studentId) {
    throw createCustomError('You do not have permission to delete this achievement.', 'FORBIDDEN', 403);
  }

  const deleted = await studentRepo.deleteAchievement(achievementId);
  await recalculateAndUpdateProfileCompletion(studentId);
  return deleted;
}
