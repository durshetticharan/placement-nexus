import api from './api';

export interface Skill {
  id: string;
  name: string;
  category?: string | null;
}

export interface CareerSkillRequirement {
  id: string;
  careerPathId: string;
  skillId: string;
  skill: Skill;
  requiredLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CareerPath {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  skillRequirements: CareerSkillRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentCareerGoal {
  id: string;
  studentId: string;
  careerPathId: string;
  careerPath: CareerPath;
  isPrimary: boolean;
  createdAt: string;
}

export interface LearningResourceSkill {
  id: string;
  skillId: string;
  skill: Skill;
}

export interface LearningResource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: string;
  url: string;
  provider?: string | null;
  skills: LearningResourceSkill[];
  createdAt: string;
  updatedAt: string;
}

// ── Career Paths ─────────────────────────────────────────────────────────────
// NOTE: Authorization header is injected automatically by the Axios interceptor
// in AuthContext.tsx — do NOT pass manual headers here.

export async function getCareerPaths(): Promise<CareerPath[]> {
  const res = await api.get('/career/paths');
  return res.data.data;
}

export async function getCareerPathDetails(id: string): Promise<CareerPath> {
  const res = await api.get(`/career/paths/${id}`);
  return res.data.data;
}

export async function createCareerPath(data: { name: string; description?: string }): Promise<CareerPath> {
  const res = await api.post('/career/paths', data);
  return res.data.data;
}

export async function updateCareerPath(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<CareerPath> {
  const res = await api.patch(`/career/paths/${id}`, data);
  return res.data.data;
}

export async function activateCareerPath(id: string): Promise<CareerPath> {
  const res = await api.post(`/career/paths/${id}/activate`, {});
  return res.data.data;
}

export async function deactivateCareerPath(id: string): Promise<CareerPath> {
  const res = await api.post(`/career/paths/${id}/deactivate`, {});
  return res.data.data;
}

// ── Skill Requirements ───────────────────────────────────────────────────────

export async function addSkillRequirement(
  careerPathId: string,
  data: { skillId: string; requiredLevel: string; priority: string },
): Promise<CareerSkillRequirement> {
  const res = await api.post(`/career/paths/${careerPathId}/skills`, data);
  return res.data.data;
}

export async function removeSkillRequirement(careerPathId: string, skillId: string): Promise<void> {
  await api.delete(`/career/paths/${careerPathId}/skills/${skillId}`);
}

// ── Skills Catalog ───────────────────────────────────────────────────────────

export async function getSkillsCatalog(): Promise<Skill[]> {
  const res = await api.get('/career/skills');
  return res.data.data;
}

// ── Student Goals ────────────────────────────────────────────────────────────

export async function getMyCareerGoal(): Promise<{ primaryGoal: StudentCareerGoal | null; allGoals: StudentCareerGoal[] }> {
  const res = await api.get('/career/me/goal');
  return res.data.data;
}

export async function setMyCareerGoal(careerPathId: string): Promise<StudentCareerGoal> {
  const res = await api.put('/career/me/goal', { careerPathId });
  return res.data.data;
}

export async function removeMyCareerGoal(careerPathId?: string): Promise<void> {
  await api.delete('/career/me/goal', {
    params: careerPathId ? { careerPathId } : {},
  });
}

// ── Learning Resources ───────────────────────────────────────────────────────

export async function getLearningResources(skillId?: string): Promise<LearningResource[]> {
  const res = await api.get('/career/resources', {
    params: skillId ? { skillId } : {},
  });
  return res.data.data;
}

export async function createLearningResource(data: {
  title: string;
  description?: string;
  resourceType: string;
  url: string;
  provider?: string;
  associatedSkillIds?: string[];
}): Promise<LearningResource> {
  const res = await api.post('/career/resources', data);
  return res.data.data;
}
