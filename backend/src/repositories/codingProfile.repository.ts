import { PrismaClient, SyncStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function addCodingProfile(
  studentId: string,
  platform: string,
  username: string,
  profileUrl: string,
  statistics?: Record<string, any>,
  syncStatus: SyncStatus = SyncStatus.NOT_SYNCED,
) {
  return prisma.codingProfile.create({
    data: {
      studentId,
      platform,
      username,
      profileUrl,
      statistics: statistics ?? undefined,
      syncStatus,
    },
  });
}

export async function addCodingProfileWithError(
  studentId: string,
  platform: string,
  username: string,
  profileUrl: string,
  statistics?: Record<string, any>,
  syncStatus: SyncStatus = SyncStatus.NOT_SYNCED,
  syncError?: string | null,
) {
  return prisma.codingProfile.create({
    data: {
      studentId,
      platform,
      username,
      profileUrl,
      statistics: statistics ?? undefined,
      syncStatus,
      syncError: syncError ?? null,
    },
  });
}

export async function listCodingProfiles(studentId: string) {
  return prisma.codingProfile.findMany({
    where: { studentId },
    include: {
      history: {
        orderBy: { snapshotDate: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findCodingProfileById(id: string) {
  return prisma.codingProfile.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { snapshotDate: 'desc' },
        take: 15,
      },
    },
  });
}

export async function findCodingProfileByStudentAndPlatform(studentId: string, platform: string) {
  return prisma.codingProfile.findUnique({
    where: {
      studentId_platform: {
        studentId,
        platform: platform.toUpperCase(),
      },
    },
  });
}

export async function updateCodingProfile(
  id: string,
  data: Partial<{
    username: string;
    profileUrl: string;
    statistics: Record<string, any>;
    syncStatus: SyncStatus;
    lastSyncedAt: Date;
    syncError: string | null;
  }>,
) {
  return prisma.codingProfile.update({
    where: { id },
    data: {
      ...(data.username && { username: data.username }),
      ...(data.profileUrl && { profileUrl: data.profileUrl }),
      ...(data.statistics !== undefined && { statistics: data.statistics }),
      ...(data.syncStatus && { syncStatus: data.syncStatus }),
      ...(data.lastSyncedAt !== undefined && { lastSyncedAt: data.lastSyncedAt }),
      ...(data.syncError !== undefined && { syncError: data.syncError }),
    },
  });
}

export async function deleteCodingProfile(id: string) {
  return prisma.codingProfile.delete({
    where: { id },
  });
}

export async function listCodingProfileHistory(
  studentId: string,
  options?: { platform?: string; limit?: number },
) {
  const where: any = { studentId };
  if (options?.platform) {
    where.platform = options.platform.toUpperCase();
  }

  return prisma.codingProfileHistory.findMany({
    where,
    orderBy: { snapshotDate: 'desc' },
    take: options?.limit || 100,
  });
}

export async function getAggregatedCodingHistory(studentId: string) {
  return prisma.codingProfileHistory.findMany({
    where: { studentId },
    orderBy: { snapshotDate: 'asc' },
  });
}
