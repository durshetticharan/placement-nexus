import { PrismaClient, SyncStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function addCodingProfile(
  studentId: string,
  platform: string,
  username: string,
  profileUrl: string,
  statistics?: Record<string, any>,
) {
  return prisma.codingProfile.create({
    data: {
      studentId,
      platform,
      username,
      profileUrl,
      statistics: statistics ?? undefined,
      syncStatus: SyncStatus.MANUAL_ONLY,
    },
  });
}

export async function listCodingProfiles(studentId: string) {
  return prisma.codingProfile.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findCodingProfileById(id: string) {
  return prisma.codingProfile.findUnique({
    where: { id },
  });
}

export async function updateCodingProfile(
  id: string,
  data: Partial<{
    username: string;
    profileUrl: string;
    statistics: Record<string, any>;
  }>,
) {
  return prisma.codingProfile.update({
    where: { id },
    data: {
      ...(data.username && { username: data.username }),
      ...(data.profileUrl && { profileUrl: data.profileUrl }),
      ...(data.statistics !== undefined && { statistics: data.statistics }),
    },
  });
}

export async function deleteCodingProfile(id: string) {
  return prisma.codingProfile.delete({
    where: { id },
  });
}
