import { PrismaClient, ProgressStatus } from '@prisma/client';

const prisma = new PrismaClient();


export async function createDrivePreparation(studentUserId: string, placementDriveId: string) {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId }
  });

  if (!student) {
    throw Object.assign(new Error('Student not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  // Prevent duplicates
  const existing = await prisma.drivePreparationPlan.findFirst({
    where: { studentId: student.id, placementDriveId }
  });

  if (existing) return existing;

  return await prisma.drivePreparationPlan.create({
    data: {
      studentId: student.id,
      placementDriveId,
    }
  });
}

export async function addPreparationTask(data: {
  drivePreparationPlanId?: string;
  learningPathId?: string;
  studentUserId: string;
  title: string;
  category?: string;
  driveResourceId?: string;
  driveExperienceId?: string;
  learningResourceId?: string;
}) {
  if (!data.drivePreparationPlanId && !data.learningPathId) {
    throw Object.assign(new Error('Task must belong to a DrivePreparationPlan or LearningPath.'), { code: 'BAD_REQUEST', statusCode: 400 });
  }

  if (data.drivePreparationPlanId && data.learningPathId) {
    throw Object.assign(new Error('Task cannot belong to both a DrivePreparationPlan and a LearningPath simultaneously.'), { code: 'BAD_REQUEST', statusCode: 400 });
  }

  // Check ownership
  if (data.drivePreparationPlanId) {
    const plan = await prisma.drivePreparationPlan.findUnique({
      where: { id: data.drivePreparationPlanId },
      include: { student: true }
    });
    if (!plan || plan.student.userId !== data.studentUserId) {
      throw Object.assign(new Error('Unauthorized or plan not found.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
  } else if (data.learningPathId) {
    const student = await prisma.student.findUnique({ where: { userId: data.studentUserId } });
    const directPlan = await prisma.learningPath.findFirst({
      where: { id: data.learningPathId, studentId: student?.id }
    });
    if (!directPlan) {
      throw Object.assign(new Error('Unauthorized or plan not found.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
  }

  // Validate referenced resource/experience are APPROVED (Phase 15 visibility rule)
  if (data.driveResourceId) {
    const resource = await prisma.driveResource.findUnique({ where: { id: data.driveResourceId }, select: { status: true } });
    if (!resource || resource.status !== 'APPROVED') {
      throw Object.assign(new Error('Referenced resource is not approved. Only APPROVED resources can be attached.'), { code: 'BAD_REQUEST', statusCode: 400 });
    }
  }

  if (data.driveExperienceId) {
    const experience = await prisma.driveExperience.findUnique({ where: { id: data.driveExperienceId }, select: { status: true } });
    if (!experience || experience.status !== 'APPROVED') {
      throw Object.assign(new Error('Referenced experience is not approved. Only APPROVED experiences can be attached.'), { code: 'BAD_REQUEST', statusCode: 400 });
    }
  }

  return await prisma.preparationTask.create({
    data: {
      drivePreparationPlanId: data.drivePreparationPlanId,
      learningPathId: data.learningPathId,
      title: data.title,
      category: data.category,
      driveResourceId: data.driveResourceId,
      driveExperienceId: data.driveExperienceId,
      learningResourceId: data.learningResourceId,
    }
  });
}

export async function updateTaskStatus(taskId: string, status: ProgressStatus, studentUserId: string) {
  const task = await prisma.preparationTask.findUnique({
    where: { id: taskId },
    include: {
      drivePreparationPlan: { include: { student: true } },
      learningPath: true,
    }
  });

  if (!task) {
    throw Object.assign(new Error('Task not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  // IDOR: verify ownership regardless of parent type
  if (task.drivePreparationPlan) {
    if (task.drivePreparationPlan.student.userId !== studentUserId) {
      throw Object.assign(new Error('Unauthorized to modify task.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
  } else if (task.learningPath) {
    // LearningPath has studentId - verify it matches
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student || task.learningPath.studentId !== student.id) {
      throw Object.assign(new Error('Unauthorized to modify task.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
  } else {
    // Orphan task — deny by default
    throw Object.assign(new Error('Task has no valid parent. Access denied.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  const updatedTask = await prisma.preparationTask.update({
    where: { id: taskId },
    data: { status }
  });

  // Recalculate progress deterministically
  if (task.drivePreparationPlanId) {
    const allTasks = await prisma.preparationTask.findMany({
      where: { drivePreparationPlanId: task.drivePreparationPlanId }
    });
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'COMPLETED').length;
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    await prisma.drivePreparationPlan.update({
      where: { id: task.drivePreparationPlanId },
      data: { progressPct }
    });
  }

  return updatedTask;
}

export async function getDrivePreparation(studentUserId: string, placementDriveId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) return null;

  return await prisma.drivePreparationPlan.findFirst({
    where: { studentId: student.id, placementDriveId },
    include: {
      tasks: {
        include: {
          driveResource: { select: { title: true, externalUrl: true } },
          driveExperience: { select: { companyName: true, role: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}
