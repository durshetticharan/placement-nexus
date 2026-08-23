import { PrismaClient, ProficiencyLevel } from '@prisma/client';

const prisma = new PrismaClient();

export async function findStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      academics: true,
      skills: {
        include: {
          skill: true,
        },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
      },
      internships: {
        orderBy: { createdAt: 'desc' },
      },
      certifications: {
        orderBy: { createdAt: 'desc' },
      },
      achievements: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function findStudentIdByUserId(userId: string): Promise<string | null> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  return student ? student.id : null;
}

export async function createOrUpdateAcademic(studentId: string, data: {
  degree: string;
  branch: string;
  collegeName: string;
  graduationYear: number;
  cgpa: number;
  backlogs: number;
  tenthPercentage?: number;
  twelfthPercentage?: number;
}) {
  return prisma.studentAcademic.upsert({
    where: { studentId },
    create: {
      studentId,
      degree: data.degree,
      branch: data.branch,
      collegeName: data.collegeName,
      graduationYear: data.graduationYear,
      cgpa: data.cgpa,
      backlogs: data.backlogs,
      tenthPercentage: data.tenthPercentage,
      twelfthPercentage: data.twelfthPercentage,
    },
    update: {
      degree: data.degree,
      branch: data.branch,
      collegeName: data.collegeName,
      graduationYear: data.graduationYear,
      cgpa: data.cgpa,
      backlogs: data.backlogs,
      tenthPercentage: data.tenthPercentage,
      twelfthPercentage: data.twelfthPercentage,
    },
  });
}

export async function findOrCreateSkill(name: string, category?: string) {
  const trimmedName = name.trim();
  const existing = await prisma.skill.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.skill.create({
    data: {
      name: trimmedName,
      category: category ? category.trim() : null,
    },
  });
}

export async function addSkill(studentId: string, skillId: string, selfRating: ProficiencyLevel) {
  return prisma.studentSkill.upsert({
    where: {
      studentId_skillId: {
        studentId,
        skillId,
      },
    },
    create: {
      studentId,
      skillId,
      selfRating,
    },
    update: {
      selfRating,
    },
    include: {
      skill: true,
    },
  });
}

export async function findStudentSkillById(id: string) {
  return prisma.studentSkill.findUnique({
    where: { id },
  });
}

export async function updateSkill(id: string, data: { selfRating?: ProficiencyLevel }) {
  return prisma.studentSkill.update({
    where: { id },
    data,
    include: {
      skill: true,
    },
  });
}

export async function removeSkill(id: string) {
  return prisma.studentSkill.delete({
    where: { id },
  });
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function findProjectById(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

export async function addProject(studentId: string, data: {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return prisma.project.create({
    data: {
      studentId,
      ...data,
    },
  });
}

export async function updateProject(id: string, data: {
  title?: string;
  description?: string;
  techStack?: string[];
  repoUrl?: string | null;
  liveUrl?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

// ── Internships ──────────────────────────────────────────────────────────────

export async function findInternshipById(id: string) {
  return prisma.internship.findUnique({ where: { id } });
}

export async function addInternship(studentId: string, data: {
  companyName: string;
  role: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isOngoing?: boolean;
  certificateUrl?: string;
}) {
  return prisma.internship.create({
    data: {
      studentId,
      ...data,
    },
  });
}

export async function updateInternship(id: string, data: {
  companyName?: string;
  role?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  isOngoing?: boolean;
  certificateUrl?: string | null;
}) {
  return prisma.internship.update({
    where: { id },
    data,
  });
}

export async function deleteInternship(id: string) {
  return prisma.internship.delete({ where: { id } });
}

// ── Certifications ───────────────────────────────────────────────────────────

export async function findCertificationById(id: string) {
  return prisma.certification.findUnique({ where: { id } });
}

export async function addCertification(studentId: string, data: {
  title: string;
  issuingOrg: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialUrl?: string;
  fileUrl?: string;
}) {
  return prisma.certification.create({
    data: {
      studentId,
      ...data,
    },
  });
}

export async function updateCertification(id: string, data: {
  title?: string;
  issuingOrg?: string;
  issueDate?: Date;
  expiryDate?: Date | null;
  credentialUrl?: string | null;
  fileUrl?: string | null;
}) {
  return prisma.certification.update({
    where: { id },
    data,
  });
}

export async function deleteCertification(id: string) {
  return prisma.certification.delete({ where: { id } });
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function findAchievementById(id: string) {
  return prisma.achievement.findUnique({ where: { id } });
}

export async function addAchievement(studentId: string, data: {
  title: string;
  description?: string;
  category?: string;
  date?: Date;
  proofUrl?: string;
}) {
  return prisma.achievement.create({
    data: {
      studentId,
      ...data,
    },
  });
}

export async function updateAchievement(id: string, data: {
  title?: string;
  description?: string | null;
  category?: string | null;
  date?: Date | null;
  proofUrl?: string | null;
}) {
  return prisma.achievement.update({
    where: { id },
    data,
  });
}

export async function deleteAchievement(id: string) {
  return prisma.achievement.delete({ where: { id } });
}
