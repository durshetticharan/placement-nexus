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

export async function getCareerPaths(): Promise<CareerPath[]> {
  const token = localStorage.getItem('token');
  const res = await api.get('/career/paths', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function getCareerPathDetails(id: string): Promise<CareerPath> {
  const token = localStorage.getItem('token');
  const res = await api.get(`/career/paths/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function createCareerPath(data: { name: string; description?: string }): Promise<CareerPath> {
  const token = localStorage.getItem('token');
  const res = await api.post('/career/paths', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function updateCareerPath(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<CareerPath> {
  const token = localStorage.getItem('token');
  const res = await api.patch(`/career/paths/${id}`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function activateCareerPath(id: string): Promise<CareerPath> {
  const token = localStorage.getItem('token');
  const res = await api.post(`/career/paths/${id}/activate`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function deactivateCareerPath(id: string): Promise<CareerPath> {
  const token = localStorage.getItem('token');
  const res = await api.post(`/career/paths/${id}/deactivate`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

// ── Skill Requirements ───────────────────────────────────────────────────────

export async function addSkillRequirement(
  careerPathId: string,
  data: { skillId: string; requiredLevel: string; priority: string },
): Promise<CareerSkillRequirement> {
  const token = localStorage.getItem('token');
  const res = await api.post(`/career/paths/${careerPathId}/skills`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function removeSkillRequirement(careerPathId: string, skillId: string): Promise<void> {
  const token = localStorage.getItem('token');
  await api.delete(`/career/paths/${careerPathId}/skills/${skillId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── Skills Catalog ───────────────────────────────────────────────────────────

export async function getSkillsCatalog(): Promise<Skill[]> {
  const token = localStorage.getItem('token');
  const res = await api.get('/career/skills', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

// ── Student Goals ────────────────────────────────────────────────────────────

export async function getMyCareerGoal(): Promise<{ primaryGoal: StudentCareerGoal | null; allGoals: StudentCareerGoal[] }> {
  const token = localStorage.getItem('token');
  const res = await api.get('/career/me/goal', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}

export async function setMyCareerGoal(careerPathId: string): Promise<StudentCareerGoal> {
  const token = localStorage.getItem('token');
  const res = await api.put(
    '/career/me/goal',
    { careerPathId },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res.data.data;
}

export async function removeMyCareerGoal(careerPathId?: string): Promise<void> {
  const token = localStorage.getItem('token');
  await api.delete('/career/me/goal', {
    params: careerPathId ? { careerPathId } : {},
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── Learning Resources ───────────────────────────────────────────────────────

export async function getLearningResources(skillId?: string): Promise<LearningResource[]> {
  const token = localStorage.getItem('token');
  const res = await api.get('/career/resources', {
    params: skillId ? { skillId } : {},
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  const token = localStorage.getItem('token');
  const res = await api.post('/career/resources', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
}
