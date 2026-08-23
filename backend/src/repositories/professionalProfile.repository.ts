import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function addProfile(studentId: string, platform: string, profileUrl: string) {
  return prisma.professionalProfile.create({
    data: {
      studentId,
      platform,
      profileUrl,
    },
  });
}

export async function listProfiles(studentId: string) {
  return prisma.professionalProfile.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findProfileById(id: string) {
  return prisma.professionalProfile.findUnique({
    where: { id },
  });
}

export async function updateProfile(id: string, profileUrl: string) {
  return prisma.professionalProfile.update({
    where: { id },
    data: { profileUrl },
  });
}

export async function deleteProfile(id: string) {
  return prisma.professionalProfile.delete({
    where: { id },
  });
}
