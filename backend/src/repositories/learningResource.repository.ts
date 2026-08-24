import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAllLearningResources(skillId?: string) {
  return prisma.learningResource.findMany({
    where: skillId
      ? {
          skills: {
            some: { skillId },
          },
        }
      : undefined,
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findLearningResourceById(id: string) {
  return prisma.learningResource.findUnique({
    where: { id },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });
}

export async function createLearningResource(data: {
  title: string;
  description?: string | null;
  resourceType: string;
  url: string;
  provider?: string | null;
  associatedSkillIds?: string[];
}) {
  const { associatedSkillIds, ...resourceData } = data;

  return prisma.learningResource.create({
    data: {
      ...resourceData,
      description: resourceData.description ?? null,
      provider: resourceData.provider ?? null,
      skills: associatedSkillIds && associatedSkillIds.length > 0
        ? {
            create: associatedSkillIds.map((skillId) => ({ skillId })),
          }
        : undefined,
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });
}

export async function updateLearningResource(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    resourceType?: string;
    url?: string;
    provider?: string | null;
    associatedSkillIds?: string[];
  },
) {
  const { associatedSkillIds, ...resourceData } = data;

  return prisma.$transaction(async (tx) => {
    if (associatedSkillIds !== undefined) {
      // Remove old skill associations
      await tx.learningResourceSkill.deleteMany({
        where: { learningResourceId: id },
      });
    }

    return tx.learningResource.update({
      where: { id },
      data: {
        ...resourceData,
        skills: associatedSkillIds && associatedSkillIds.length > 0
          ? {
              create: associatedSkillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });
  });
}

export async function deleteLearningResource(id: string) {
  return prisma.learningResource.delete({
    where: { id },
  });
}
