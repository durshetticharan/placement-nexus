import * as codingRepo from '../repositories/codingProfile.repository';
import * as studentService from './student.service';
import { recalculateAndUpdateProfileCompletion } from './profileCompletion.service';
import {
  fetchPlatformStats,
  recordHistorySnapshot,
  seedInitialTrajectory,
  syncSingleCodingProfile,
} from './codingSync.service';
import { SyncStatus } from '@prisma/client';

function createCustomError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

export async function addCodingProfile(
  userId: string,
  platform: string,
  username: string,
  profileUrl: string,
  statistics?: Record<string, any>,
) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const plat = platform.toUpperCase().trim();

  // Check if profile already exists
  const existing = await codingRepo.findCodingProfileByStudentAndPlatform(studentId, plat);
  if (existing) {
    throw createCustomError(`A coding profile for ${plat} already exists for your account.`, 'CONFLICT', 409);
  }

  // If user didn't supply manual statistics, perform live fetch immediately
  let initialStats = statistics;
  let syncStatus: SyncStatus = statistics ? SyncStatus.MANUAL_ONLY : SyncStatus.NOT_SYNCED;
  let syncError: string | null = null;

  if (!initialStats) {
    try {
      initialStats = await fetchPlatformStats(plat, username);
      syncStatus = SyncStatus.SYNCED;
    } catch (err: any) {
      initialStats = undefined;
      syncStatus = SyncStatus.FAILED;
      // Capture human-readable error for user display (e.g. Cloudflare block)
      syncError = err?.message || 'Live sync failed. Use manual stats override to enter your data.';
    }
  }

  const profile = await codingRepo.addCodingProfileWithError(
    studentId,
    plat,
    username,
    profileUrl,
    initialStats,
    syncStatus,
    syncError,
  );

  // If we have stats, record snapshot and seed trajectory
  if (initialStats && (Number(initialStats.problemsSolved) > 0 || Number(initialStats.rating) > 0)) {
    await recordHistorySnapshot(studentId, profile.id, plat, username, initialStats);
    await seedInitialTrajectory(studentId, profile.id, plat, username, initialStats as any);
  }

  await recalculateAndUpdateProfileCompletion(studentId);
  return profile;
}

export async function listCodingProfiles(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  return codingRepo.listCodingProfiles(studentId);
}

export async function updateCodingProfile(
  userId: string,
  id: string,
  data: Partial<{
    username: string;
    profileUrl: string;
    statistics: Record<string, any>;
  }>,
) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const existing = await codingRepo.findCodingProfileById(id);

  if (!existing || existing.studentId !== studentId) {
    throw createCustomError('Coding profile not found.', 'NOT_FOUND', 404);
  }

  const updated = await codingRepo.updateCodingProfile(id, data);

  if (data.statistics) {
    await recordHistorySnapshot(
      studentId,
      id,
      existing.platform,
      data.username || existing.username,
      data.statistics,
    );
  }

  return updated;
}

export async function deleteCodingProfile(userId: string, id: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const existing = await codingRepo.findCodingProfileById(id);

  if (!existing || existing.studentId !== studentId) {
    throw createCustomError('Coding profile not found.', 'NOT_FOUND', 404);
  }

  await codingRepo.deleteCodingProfile(id);
  await recalculateAndUpdateProfileCompletion(studentId);
  return { message: 'Coding profile deleted successfully.' };
}

export async function syncCodingProfile(userId: string, id: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  return syncSingleCodingProfile(id, studentId);
}

export async function syncAllCodingProfiles(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const profiles = await codingRepo.listCodingProfiles(studentId);

  const results: any[] = [];
  for (const p of profiles) {
    try {
      const res = await syncSingleCodingProfile(p.id, studentId);
      results.push({ id: p.id, platform: p.platform, status: 'SUCCESS', profile: res });
    } catch (err: any) {
      results.push({ id: p.id, platform: p.platform, status: 'FAILED', error: err.message });
    }
  }

  return results;
}

export async function getCodingDashboard(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const profiles = await codingRepo.listCodingProfiles(studentId);
  const history = await codingRepo.getAggregatedCodingHistory(studentId);

  // Compute aggregated totals
  let totalProblemsSolved = 0;
  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;
  let maxRating = 0;
  let maxStreak = 0;
  let totalRepos = 0;
  let totalStars = 0;

  const platformBreakdown: Array<{
    platform: string;
    username: string;
    problemsSolved: number;
    rating?: number;
    streak?: number;
    syncStatus: string;
    lastSyncedAt?: Date | null;
  }> = [];

  for (const p of profiles) {
    const stats = (p.statistics as Record<string, any>) || {};
    const solved = Number(stats.problemsSolved) || 0;
    const easy = Number(stats.easySolved) || 0;
    const med = Number(stats.mediumSolved) || 0;
    const hard = Number(stats.hardSolved) || 0;
    const rating = Number(stats.rating) || 0;
    const streak = Number(stats.streak) || 0;
    const repos = Number(stats.publicRepos) || 0;
    const stars = Number(stats.stars) || 0;

    totalProblemsSolved += solved;
    totalEasy += easy;
    totalMedium += med;
    totalHard += hard;
    if (rating > maxRating) maxRating = rating;
    if (streak > maxStreak) maxStreak = streak;
    totalRepos += repos;
    totalStars += stars;

    platformBreakdown.push({
      platform: p.platform,
      username: p.username,
      problemsSolved: solved,
      rating: rating || undefined,
      streak: streak || undefined,
      syncStatus: p.syncStatus,
      lastSyncedAt: p.lastSyncedAt,
    });
  }

  // Build timeline series grouped by date for charts
  // Map timestamp to date key "YYYY-MM-DD"
  const dateMap = new Map<string, { date: string; solved: number; rating: number; count: number }>();

  // If history exists, group snapshots by day (for problems-solved chart)
  for (const h of history) {
    const dStr = new Date(h.snapshotDate).toISOString().split('T')[0];
    const prev = dateMap.get(dStr) || { date: dStr, solved: 0, rating: 0, count: 0 };
    prev.solved += h.problemsSolved;
    if (h.rating && h.rating > prev.rating) {
      prev.rating = h.rating;
    }
    prev.count += 1;
    dateMap.set(dStr, prev);
  }

  const timeline = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build per-platform rating history for the rating progression chart
  // Each platform gets its own series: [{ date, rating }]
  const ratingByPlatform = new Map<string, Array<{ date: string; rating: number }>>();
  for (const h of history) {
    if (!h.rating) continue;
    const dStr = new Date(h.snapshotDate).toISOString().split('T')[0];
    const plat = h.platform.toUpperCase();
    if (!ratingByPlatform.has(plat)) ratingByPlatform.set(plat, []);
    const series = ratingByPlatform.get(plat)!;
    // Avoid duplicate dates per platform (keep latest)
    const existing = series.find((e) => e.date === dStr);
    if (!existing) {
      series.push({ date: dStr, rating: h.rating });
    } else {
      existing.rating = Math.max(existing.rating, h.rating);
    }
  }

  // Convert to sorted array of series
  const ratingTimeline = Array.from(ratingByPlatform.entries()).map(([platform, points]) => ({
    platform,
    points: points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  }));

  return {
    summary: {
      totalProfiles: profiles.length,
      totalProblemsSolved,
      totalEasy,
      totalMedium,
      totalHard,
      maxRating: maxRating || null,
      maxStreak,
      totalRepos,
      totalStars,
    },
    platformBreakdown,
    profiles,
    timeline,
    ratingTimeline,
    recentHistory: history.slice(-20).reverse(),
  };
}

export async function getCodingHistory(
  userId: string,
  options?: { platform?: string; limit?: number },
) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  return codingRepo.listCodingProfileHistory(studentId, options);
}

export async function seedDemoProfiles(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);

  const demoItems = [
    {
      platform: 'LEETCODE',
      username: 'alex_code',
      profileUrl: 'https://leetcode.com/alex_code',
      stats: {
        problemsSolved: 342,
        easySolved: 140,
        mediumSolved: 162,
        hardSolved: 40,
        rating: 1845,
        globalRank: 18420,
        streak: 21,
        acceptanceRate: 68.4,
      },
    },
    {
      platform: 'CODEFORCES',
      username: 'alex_cf',
      profileUrl: 'https://codeforces.com/profile/alex_cf',
      stats: {
        problemsSolved: 188,
        easySolved: 90,
        mediumSolved: 72,
        hardSolved: 26,
        rating: 1640,
        maxRating: 1710,
        rank: 'expert',
        streak: 8,
      },
    },
    {
      platform: 'GITHUB',
      username: 'alex-dev',
      profileUrl: 'https://github.com/alex-dev',
      stats: {
        problemsSolved: 120,
        easySolved: 80,
        mediumSolved: 30,
        hardSolved: 10,
        publicRepos: 24,
        followers: 48,
        following: 35,
        streak: 14,
      },
    },
  ];

  const createdProfiles = [];
  for (const item of demoItems) {
    const existing = await codingRepo.findCodingProfileByStudentAndPlatform(studentId, item.platform);
    if (!existing) {
      const p = await codingRepo.addCodingProfile(
        studentId,
        item.platform,
        item.username,
        item.profileUrl,
        item.stats,
        SyncStatus.SYNCED,
      );
      await seedInitialTrajectory(studentId, p.id, item.platform, item.username, item.stats as any);
      createdProfiles.push(p);
    }
  }

  await recalculateAndUpdateProfileCompletion(studentId);
  return { message: 'Demo coding profiles and history snapshots seeded successfully.', createdProfiles };
}
