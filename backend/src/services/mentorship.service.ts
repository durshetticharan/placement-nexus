import { MentorshipStatus, PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();


export async function requestMentorship(studentId: string, alumniProfileId: string, message?: string) {
  return await prisma.$transaction(async (tx) => {
    // Prevent duplicates
    const existing = await tx.mentorshipRequest.findFirst({
      where: {
        studentId,
        alumniProfileId,
        status: { in: ['REQUESTED', 'ACCEPTED'] }
      }
    });

    if (existing) {
      throw Object.assign(new Error('Mentorship request already exists or is active.'), { code: 'CONFLICT', statusCode: 409 });
    }

    // Check capacity atomically within the transaction
    const alumni = await tx.alumniProfile.findUnique({
      where: { id: alumniProfileId },
      select: { maxMentees: true, isMentor: true, _count: { select: { mentorshipRequests: { where: { status: 'ACCEPTED' } } } } }
    });

    if (!alumni || !alumni.isMentor) {
      throw Object.assign(new Error('Alumni is not an active mentor.'), { code: 'BAD_REQUEST', statusCode: 400 });
    }

    if (alumni._count.mentorshipRequests >= alumni.maxMentees) {
      throw Object.assign(new Error('Mentor is currently at full capacity.'), { code: 'BAD_REQUEST', statusCode: 400 });
    }

    const request = await tx.mentorshipRequest.create({
      data: {
        studentId,
        alumniProfileId,
        message,
        status: 'REQUESTED'
      },
      include: {
        alumniProfile: true,
        student: { select: { fullName: true } }
      }
    });

    // Notify Alumni
    await NotificationService.sendNotification({
      userId: request.alumniProfile.userId,
      type: 'MENTORSHIP_UPDATE',
      title: 'New Mentorship Request',
      message: `${request.student.fullName} has requested your mentorship.`,
      metadata: { requestId: request.id }
    });

    return request;
  });
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: MentorshipStatus,
  actorId: string,
  actorRole: string
) {
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, alumniProfile: { include: { _count: { select: { mentorshipRequests: { where: { status: 'ACCEPTED' } } } } } } }
  });

  if (!request) {
    throw Object.assign(new Error('Mentorship request not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  // Permissions
  const isStudentOwner = request.student.userId === actorId && actorRole === 'STUDENT';
  const isAlumniOwner = request.alumniProfile.userId === actorId && actorRole === 'ALUMNI';
  const isOfficer = actorRole === 'PLACEMENT_OFFICER';

  if (!isStudentOwner && !isAlumniOwner && !isOfficer) {
    throw Object.assign(new Error('Unauthorized to modify this request.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
    if (!isAlumniOwner && !isOfficer) {
      throw Object.assign(new Error('Only mentor can accept or decline.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
    
    // Check capacity before accepting
    if (newStatus === 'ACCEPTED' && request.alumniProfile._count.mentorshipRequests >= request.alumniProfile.maxMentees) {
      throw Object.assign(new Error('Cannot accept. Mentor is at full capacity.'), { code: 'BAD_REQUEST', statusCode: 400 });
    }
  }

  if (newStatus === 'CANCELLED' && !isStudentOwner) {
    throw Object.assign(new Error('Only student can cancel.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  const updated = await prisma.mentorshipRequest.update({
    where: { id: requestId },
    data: { status: newStatus },
    include: { student: { select: { userId: true, fullName: true } }, alumniProfile: { select: { userId: true, fullName: true } } }
  });

  // Notify the other party
  if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
    await NotificationService.sendNotification({
      userId: updated.student.userId,
      type: 'MENTORSHIP_UPDATE',
      title: `Mentorship Request ${newStatus}`,
      message: `${updated.alumniProfile.fullName} has ${newStatus.toLowerCase()} your mentorship request.`,
      metadata: { requestId: updated.id }
    });
  } else if (newStatus === 'CANCELLED') {
    await NotificationService.sendNotification({
      userId: updated.alumniProfile.userId,
      type: 'MENTORSHIP_UPDATE',
      title: 'Mentorship Request Cancelled',
      message: `${updated.student.fullName} cancelled their mentorship request.`,
      metadata: { requestId: updated.id }
    });
  }

  return updated;
}

export async function addGuidance(requestId: string, content: string, actorId: string, actorRole: string) {
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, alumniProfile: true }
  });

  if (!request) {
    throw Object.assign(new Error('Mentorship request not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  if (request.status !== 'ACCEPTED') {
    throw Object.assign(new Error('Can only add guidance to active mentorships.'), { code: 'BAD_REQUEST', statusCode: 400 });
  }

  const isStudentOwner = request.student.userId === actorId && actorRole === 'STUDENT';
  const isAlumniOwner = request.alumniProfile.userId === actorId && actorRole === 'ALUMNI';

  if (!isStudentOwner && !isAlumniOwner) {
    throw Object.assign(new Error('Unauthorized to add guidance.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  return await prisma.mentorGuidance.create({
    data: {
      mentorshipRequestId: requestId,
      authorId: actorId,
      content
    }
  });
}

export async function getMentorshipDetails(requestId: string, actorId: string) {
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: {
      student: { select: { userId: true, fullName: true, rollNumber: true, academics: { select: { branch: true } } } },
      alumniProfile: { select: { userId: true, fullName: true, currentCompany: true, currentRole: true } },
      guidances: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!request) {
    throw Object.assign(new Error('Mentorship not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  if (request.student.userId !== actorId && request.alumniProfile.userId !== actorId) {
    throw Object.assign(new Error('Unauthorized to view this mentorship.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  return request;
}

export async function listStudentMentorships(studentUserId: string) {
  return await prisma.mentorshipRequest.findMany({
    where: { student: { userId: studentUserId } },
    include: {
      alumniProfile: { select: { fullName: true, currentCompany: true, currentRole: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function listMentorMentees(alumniUserId: string) {
  return await prisma.mentorshipRequest.findMany({
    where: { alumniProfile: { userId: alumniUserId } },
    include: {
      student: { select: { fullName: true, academics: { select: { branch: true, graduationYear: true } } } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}
