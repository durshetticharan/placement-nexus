import * as learningResourceRepo from '../repositories/learningResource.repository';
import { ServiceError } from './careerPath.service';

export async function getAllLearningResources(skillId?: string) {
  return learningResourceRepo.findAllLearningResources(skillId);
}

export async function getLearningResourceById(id: string) {
  const resource = await learningResourceRepo.findLearningResourceById(id);
  if (!resource) {
    throw new ServiceError(404, 'NOT_FOUND', 'Learning resource not found.');
  }
  return resource;
}

export async function createLearningResource(data: {
  title: string;
  description?: string | null;
  resourceType: string;
  url: string;
  provider?: string | null;
  associatedSkillIds?: string[];
}) {
  return learningResourceRepo.createLearningResource(data);
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
  const existing = await learningResourceRepo.findLearningResourceById(id);
  if (!existing) {
    throw new ServiceError(404, 'NOT_FOUND', 'Learning resource not found.');
  }
  return learningResourceRepo.updateLearningResource(id, data);
}

export async function deleteLearningResource(id: string) {
  const existing = await learningResourceRepo.findLearningResourceById(id);
  if (!existing) {
    throw new ServiceError(404, 'NOT_FOUND', 'Learning resource not found.');
  }
  return learningResourceRepo.deleteLearningResource(id);
}
