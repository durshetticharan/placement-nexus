import { PrismaClient, ProficiencyLevel, RequirementPriority } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAllCareerPaths(activeOnly = false) {
  return prisma.careerPath.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      skillRequirements: {
        include: {
          skill: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function findCareerPathById(id: string) {
  return prisma.careerPath.findUnique({
    where: { id },
    include: {
      skillRequirements: {
        include: {
          skill: true,
        },
      },
    },
  });
}

export async function findCareerPathByName(name: string) {
  return prisma.careerPath.findUnique({
    where: { name },
  });
}

export async function createCareerPath(data: { name: string; description?: string | null }) {
  return prisma.careerPath.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      isActive: true,
    },
    include: {
      skillRequirements: {
        include: {
          skill: true,
        },
      },
    },
  });
}

export async function updateCareerPath(
  id: string,
  data: { name?: string; description?: string | null; isActive?: boolean },
) {
  return prisma.careerPath.update({
    where: { id },
    data,
    include: {
      skillRequirements: {
        include: {
          skill: true,
        },
      },
    },
  });
}

export async function findSkillRequirement(careerPathId: string, skillId: string) {
  return prisma.careerSkillRequirement.findUnique({
    where: {
      careerPathId_skillId: { careerPathId, skillId },
    },
  });
}

export async function addSkillRequirement(
  careerPathId: string,
  skillId: string,
  requiredLevel: ProficiencyLevel,
  priority: RequirementPriority = 'MEDIUM',
) {
  return prisma.careerSkillRequirement.create({
    data: {
      careerPathId,
      skillId,
      requiredLevel,
      priority,
    },
    include: {
      skill: true,
    },
  });
}

export async function updateSkillRequirement(
  careerPathId: string,
  skillId: string,
  data: { requiredLevel?: ProficiencyLevel; priority?: RequirementPriority },
) {
  return prisma.careerSkillRequirement.update({
    where: {
      careerPathId_skillId: { careerPathId, skillId },
    },
    data,
    include: {
      skill: true,
    },
  });
}

export async function removeSkillRequirement(careerPathId: string, skillId: string) {
  return prisma.careerSkillRequirement.delete({
    where: {
      careerPathId_skillId: { careerPathId, skillId },
    },
  });
}

export async function findSkillById(skillId: string) {
  return prisma.skill.findUnique({
    where: { id: skillId },
  });
}

export async function findAllSkills() {
  return prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });
}
