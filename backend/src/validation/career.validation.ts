import { z } from 'zod';
import { ProficiencyLevel, RequirementPriority } from '@prisma/client';

export const createCareerPathSchema = z.object({
  name: z.string().trim().min(1, 'Career path name is required.').max(100, 'Name too long.'),
  description: z.string().trim().max(1000, 'Description too long.').optional().nullable(),
});

export const updateCareerPathSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty.').max(100, 'Name too long.').optional(),
  description: z.string().trim().max(1000, 'Description too long.').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const addSkillRequirementSchema = z.object({
  skillId: z.string().min(1, 'skillId is required.'),
  requiredLevel: z.nativeEnum(ProficiencyLevel, {
    message: 'requiredLevel must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT.',
  }),
  priority: z.nativeEnum(RequirementPriority, {
    message: 'priority must be one of: LOW, MEDIUM, HIGH, CRITICAL.',
  }).default('MEDIUM'),
});

export const updateSkillRequirementSchema = z.object({
  requiredLevel: z.nativeEnum(ProficiencyLevel, {
    message: 'requiredLevel must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT.',
  }).optional(),
  priority: z.nativeEnum(RequirementPriority, {
    message: 'priority must be one of: LOW, MEDIUM, HIGH, CRITICAL.',
  }).optional(),
});

export const setCareerGoalSchema = z.object({
  careerPathId: z.string().min(1, 'careerPathId is required.'),
});

export const createLearningResourceSchema = z.object({
  title: z.string().trim().min(1, 'Resource title is required.').max(200, 'Title too long.'),
  description: z.string().trim().max(1000, 'Description too long.').optional().nullable(),
  resourceType: z.string().trim().min(1, 'resourceType is required.').max(50, 'Type too long.'),
  url: z.string().trim().url('Must be a valid URL (e.g. https://example.com).'),
  provider: z.string().trim().max(100, 'Provider name too long.').optional().nullable(),
  associatedSkillIds: z.array(z.string()).optional(),
});

export const updateLearningResourceSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty.').max(200, 'Title too long.').optional(),
  description: z.string().trim().max(1000, 'Description too long.').optional().nullable(),
  resourceType: z.string().trim().min(1, 'resourceType cannot be empty.').max(50, 'Type too long.').optional(),
  url: z.string().trim().url('Must be a valid URL.').optional(),
  provider: z.string().trim().max(100, 'Provider name too long.').optional().nullable(),
  associatedSkillIds: z.array(z.string()).optional(),
});
