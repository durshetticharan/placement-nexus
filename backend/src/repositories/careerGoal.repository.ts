import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    select: { id: true, fullName: true },
  });
}

export async function getStudentCareerGoals(studentId: string) {
  return prisma.studentCareerGoal.findMany({
    where: { studentId },
    include: {
      careerPath: {
        include: {
          skillRequirements: {
            include: {
              skill: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPrimaryStudentCareerGoal(studentId: string) {
  return prisma.studentCareerGoal.findFirst({
    where: { studentId, isPrimary: true },
    include: {
      careerPath: {
        include: {
          skillRequirements: {
            include: {
              skill: true,
            },
          },
        },
      },
    },
  });
}

export async function setStudentCareerGoal(studentId: string, careerPathId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Reset any existing primary goal for this student
    await tx.studentCareerGoal.updateMany({
      where: { studentId, isPrimary: true },
      data: { isPrimary: false },
    });

    // 2. Upsert the goal as primary
    const goal = await tx.studentCareerGoal.upsert({
      where: {
        studentId_careerPathId: { studentId, careerPathId },
      },
      create: {
        studentId,
        careerPathId,
        isPrimary: true,
      },
      update: {
        isPrimary: true,
      },
      include: {
        careerPath: {
          include: {
            skillRequirements: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
    });

    return goal;
  });
}

export async function removeStudentCareerGoal(studentId: string, careerPathId?: string) {
  if (careerPathId) {
    return prisma.studentCareerGoal.deleteMany({
      where: { studentId, careerPathId },
    });
  }
  return prisma.studentCareerGoal.deleteMany({
    where: { studentId },
  });
}
