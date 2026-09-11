import { PrismaClient } from '@prisma/client';
import * as studentService from './student.service';

const prisma = new PrismaClient();

function createCustomError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

export async function getResume(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      academics: true,
      skills: { include: { skill: true } },
      projects: true,
      internships: true,
      certifications: true,
      achievements: true,
      codingProfiles: true,
    }
  });

  if (!student) {
    throw createCustomError('Student profile not found.', 'NOT_FOUND', 404);
  }

  const studentId = student.id;

  let resume = await prisma.builtResume.findUnique({
    where: { studentId },
    include: {
      educations: { orderBy: { orderIndex: 'asc' } },
      skills: { orderBy: { orderIndex: 'asc' } },
      projects: { orderBy: { orderIndex: 'asc' } },
      experiences: { orderBy: { orderIndex: 'asc' } },
      certifications: { orderBy: { orderIndex: 'asc' } },
      achievements: { orderBy: { orderIndex: 'asc' } },
      languages: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!resume) {
    // Create an empty resume if none exists for this student yet
    resume = await prisma.builtResume.create({
      data: {
        studentId,
        template: 'PROFESSIONAL_ATS',
        sectionConfig: {
          showPersonal: true,
          showObjective: true,
          showEducation: true,
          showSkills: true,
          showProjects: true,
          showExperience: true,
          showCertifications: true,
          showAchievements: true,
          showLanguages: true,
        },
      },
      include: {
        educations: true,
        skills: true,
        projects: true,
        experiences: true,
        certifications: true,
        achievements: true,
        languages: true,
      },
    });
  }

  return { resume, profile: student };
}

export async function upsertResume(userId: string, payload: any) {
  const studentId = await studentService.getStudentIdByUserId(userId);

  // Ensure resume exists
  let resume = await prisma.builtResume.findUnique({
    where: { studentId },
  });

  if (!resume) {
    resume = await prisma.builtResume.create({
      data: { studentId },
    });
  }

  const resumeId = resume.id;

  // Use a transaction to safely delete nested items and recreate them
  // This avoids issues with ID mismatches from the frontend and correctly persists the exact current state.
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all existing nested entries for this resume
    await tx.resumeEducation.deleteMany({ where: { resumeId } });
    await tx.resumeSkill.deleteMany({ where: { resumeId } });
    await tx.resumeProject.deleteMany({ where: { resumeId } });
    await tx.resumeExperience.deleteMany({ where: { resumeId } });
    await tx.resumeCertification.deleteMany({ where: { resumeId } });
    await tx.resumeAchievement.deleteMany({ where: { resumeId } });
    await tx.resumeLanguage.deleteMany({ where: { resumeId } });

    // 2. Re-create them with the new data
    // Map data to omit `id` and include `resumeId` context implicitly via nested create
    const mapItems = (items: any[]) => items?.map((item, idx) => {
      const { id: _id, resumeId: _resumeId, ...rest } = item;
      return { ...rest, orderIndex: idx };
    }) || [];

    return await tx.builtResume.update({
      where: { id: resumeId },
      data: {
        personalInfo: payload.personalInfo,
        careerObjective: payload.careerObjective,
        template: payload.template,
        sectionConfig: payload.sectionConfig,
        educations: { create: mapItems(payload.educations) },
        skills: { create: mapItems(payload.skills) },
        projects: { create: mapItems(payload.projects) },
        experiences: { create: mapItems(payload.experiences) },
        certifications: { create: mapItems(payload.certifications) },
        achievements: { create: mapItems(payload.achievements) },
        languages: { create: mapItems(payload.languages) },
      },
      include: {
        educations: { orderBy: { orderIndex: 'asc' } },
        skills: { orderBy: { orderIndex: 'asc' } },
        projects: { orderBy: { orderIndex: 'asc' } },
        experiences: { orderBy: { orderIndex: 'asc' } },
        certifications: { orderBy: { orderIndex: 'asc' } },
        achievements: { orderBy: { orderIndex: 'asc' } },
        languages: { orderBy: { orderIndex: 'asc' } },
      },
    });
  });
}
