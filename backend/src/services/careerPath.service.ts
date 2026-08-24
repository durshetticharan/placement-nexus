import { ProficiencyLevel, RequirementPriority } from '@prisma/client';
import * as careerPathRepo from '../repositories/careerPath.repository';

export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function getAllCareerPaths(activeOnly = false) {
  return careerPathRepo.findAllCareerPaths(activeOnly);
}

export async function getCareerPathById(id: string, activeOnly = false) {
  const path = await careerPathRepo.findCareerPathById(id);
  if (!path) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found.');
  }
  if (activeOnly && !path.isActive) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found or inactive.');
  }
  return path;
}

export async function createCareerPath(data: { name: string; description?: string | null }) {
  const existing = await careerPathRepo.findCareerPathByName(data.name);
  if (existing) {
    throw new ServiceError(409, 'DUPLICATE_NAME', 'A career path with this name already exists.');
  }
  return careerPathRepo.createCareerPath(data);
}

export async function updateCareerPath(
  id: string,
  data: { name?: string; description?: string | null; isActive?: boolean },
) {
  const path = await careerPathRepo.findCareerPathById(id);
  if (!path) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found.');
  }

  if (data.name && data.name !== path.name) {
    const existing = await careerPathRepo.findCareerPathByName(data.name);
    if (existing && existing.id !== id) {
      throw new ServiceError(409, 'DUPLICATE_NAME', 'A career path with this name already exists.');
    }
  }

  return careerPathRepo.updateCareerPath(id, data);
}

export async function setCareerPathStatus(id: string, isActive: boolean) {
  const path = await careerPathRepo.findCareerPathById(id);
  if (!path) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found.');
  }
  if (path.isActive === isActive) {
    throw new ServiceError(400, 'BAD_REQUEST', `Career path is already ${isActive ? 'active' : 'inactive'}.`);
  }
  return careerPathRepo.updateCareerPath(id, { isActive });
}

export async function addSkillRequirement(
  careerPathId: string,
  skillId: string,
  requiredLevel: ProficiencyLevel,
  priority: RequirementPriority = 'MEDIUM',
) {
  const path = await careerPathRepo.findCareerPathById(careerPathId);
  if (!path) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found.');
  }

  const skill = await careerPathRepo.findSkillById(skillId);
  if (!skill) {
    throw new ServiceError(404, 'NOT_FOUND', 'Skill not found in catalog.');
  }

  const existingReq = await careerPathRepo.findSkillRequirement(careerPathId, skillId);
  if (existingReq) {
    throw new ServiceError(409, 'DUPLICATE_MAPPING', 'This skill is already required for this career path.');
  }

  return careerPathRepo.addSkillRequirement(careerPathId, skillId, requiredLevel, priority);
}

export async function updateSkillRequirement(
  careerPathId: string,
  skillId: string,
  data: { requiredLevel?: ProficiencyLevel; priority?: RequirementPriority },
) {
  const existingReq = await careerPathRepo.findSkillRequirement(careerPathId, skillId);
  if (!existingReq) {
    throw new ServiceError(404, 'NOT_FOUND', 'Skill requirement not found for this career path.');
  }

  return careerPathRepo.updateSkillRequirement(careerPathId, skillId, data);
}

export async function removeSkillRequirement(careerPathId: string, skillId: string) {
  const existingReq = await careerPathRepo.findSkillRequirement(careerPathId, skillId);
  if (!existingReq) {
    throw new ServiceError(404, 'NOT_FOUND', 'Skill requirement not found for this career path.');
  }

  return careerPathRepo.removeSkillRequirement(careerPathId, skillId);
}

export async function getAllSkills() {
  return careerPathRepo.findAllSkills();
}
