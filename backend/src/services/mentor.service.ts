import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateMentorProfile(userId: string, data: {
  isMentor: boolean;
  mentorBio?: string;
  mentorTopics?: string[];
  maxMentees?: number;
}) {
  const alumni = await prisma.alumniProfile.findUnique({
    where: { userId },
    include: { verification: true },
  });

  if (!alumni) {
    throw Object.assign(new Error('Alumni profile not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  if (alumni.verification?.status !== 'APPROVED') {
    throw Object.assign(new Error('Alumni profile must be verified to become a mentor.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  return await prisma.alumniProfile.update({
    where: { id: alumni.id },
    data: {
      isMentor: data.isMentor,
      mentorBio: data.mentorBio,
      mentorTopics: data.mentorTopics || [],
      maxMentees: data.maxMentees ?? 3,
    },
    select: {
      id: true,
      isMentor: true,
      mentorBio: true,
      mentorTopics: true,
      maxMentees: true,
    }
  });
}

export async function getMentorDirectory(filters: { topic?: string; company?: string }) {
  const whereClause: any = {
    isMentor: true,
    verification: { status: 'APPROVED' },
  };

  if (filters.topic) {
    whereClause.mentorTopics = { has: filters.topic };
  }
  
  if (filters.company) {
    whereClause.currentCompany = { contains: filters.company, mode: 'insensitive' };
  }

  const mentors = await prisma.alumniProfile.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      degree: true,
      branch: true,
      graduationYear: true,
      currentCompany: true,
      currentDesignation: true,
      mentorBio: true,
      mentorTopics: true,
      maxMentees: true,
      _count: {
        select: {
          mentorshipRequests: {
            where: { status: 'ACCEPTED' }
          }
        }
      }
    }
  });

  // Filter out mentors who are at capacity
  return mentors.filter(m => m._count.mentorshipRequests < m.maxMentees).map(m => {
    const { _count, ...rest } = m;
    return rest;
  });
}
