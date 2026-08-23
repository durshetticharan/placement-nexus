import api from './api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface AcademicData {
  id?: string;
  degree: string;
  branch: string;
  collegeName: string;
  graduationYear: number;
  cgpa: number;
  backlogs: number;
  tenthPercentage?: number | null;
  twelfthPercentage?: number | null;
}

export interface SkillItem {
  id: string;
  studentId: string;
  skillId: string;
  selfRating: ProficiencyLevel;
  evidenceScore?: number | null;
  skill: {
    id: string;
    name: string;
    category?: string | null;
  };
}

export interface ProjectItem {
  id: string;
  studentId: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string | null;
  liveUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface InternshipItem {
  id: string;
  studentId: string;
  companyName: string;
  role: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isOngoing: boolean;
  certificateUrl?: string | null;
}

export interface CertificationItem {
  id: string;
  studentId: string;
  title: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialUrl?: string | null;
  fileUrl?: string | null;
}

export interface AchievementItem {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  date?: string | null;
  proofUrl?: string | null;
}

export interface ResumeItem {
  id: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface ProfessionalProfileItem {
  id: string;
  studentId: string;
  platform: string;
  profileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodingProfileItem {
  id: string;
  studentId: string;
  platform: string;
  username: string;
  profileUrl: string;
  statistics?: Record<string, any> | null;
  syncStatus: string;
  lastSyncedAt?: string | null;
  syncError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  rollNumber: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  profilePhotoUrl?: string | null;
  profileCompletionPct: number;
  placementStatus: string;
  createdAt: string;
  updatedAt: string;
  academics?: AcademicData | null;
  skills: SkillItem[];
  projects: ProjectItem[];
  internships: InternshipItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  resumes?: ResumeItem[];
  professionalProfiles?: ProfessionalProfileItem[];
  codingProfiles?: CodingProfileItem[];
}

// ── API Methods ───────────────────────────────────────────────────────────────

export async function getProfile(): Promise<StudentProfile> {
  const res = await api.get('/students/me');
  return res.data.data;
}

export async function updateAcademics(data: Omit<AcademicData, 'id'>): Promise<AcademicData> {
  const res = await api.put('/students/me/academics', data);
  return res.data.data;
}

// ── Skills ────────────────────────────────────────────────────────────────────

export async function addSkill(data: { name: string; category?: string; selfRating: ProficiencyLevel }): Promise<SkillItem> {
  const res = await api.post('/students/me/skills', data);
  return res.data.data;
}

export async function updateSkill(id: string, data: { selfRating: ProficiencyLevel }): Promise<SkillItem> {
  const res = await api.patch(`/students/me/skills/${id}`, data);
  return res.data.data;
}

export async function deleteSkill(id: string): Promise<void> {
  await api.delete(`/students/me/skills/${id}`);
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function addProject(data: {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ProjectItem> {
  const res = await api.post('/students/me/projects', data);
  return res.data.data;
}

export async function updateProject(id: string, data: Partial<{
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
}>): Promise<ProjectItem> {
  const res = await api.patch(`/students/me/projects/${id}`, data);
  return res.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/students/me/projects/${id}`);
}

// ── Internships ──────────────────────────────────────────────────────────────

export async function addInternship(data: {
  companyName: string;
  role: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  certificateUrl?: string;
}): Promise<InternshipItem> {
  const res = await api.post('/students/me/internships', data);
  return res.data.data;
}

export async function updateInternship(id: string, data: Partial<{
  companyName: string;
  role: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  certificateUrl?: string;
}>): Promise<InternshipItem> {
  const res = await api.patch(`/students/me/internships/${id}`, data);
  return res.data.data;
}

export async function deleteInternship(id: string): Promise<void> {
  await api.delete(`/students/me/internships/${id}`);
}

// ── Certifications ───────────────────────────────────────────────────────────

export async function addCertification(data: {
  title: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  fileUrl?: string;
}): Promise<CertificationItem> {
  const res = await api.post('/students/me/certifications', data);
  return res.data.data;
}

export async function updateCertification(id: string, data: Partial<{
  title: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  fileUrl?: string;
}>): Promise<CertificationItem> {
  const res = await api.patch(`/students/me/certifications/${id}`, data);
  return res.data.data;
}

export async function deleteCertification(id: string): Promise<void> {
  await api.delete(`/students/me/certifications/${id}`);
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function addAchievement(data: {
  title: string;
  description?: string;
  category?: string;
  date?: string;
  proofUrl?: string;
}): Promise<AchievementItem> {
  const res = await api.post('/students/me/achievements', data);
  return res.data.data;
}

export async function updateAchievement(id: string, data: Partial<{
  title: string;
  description?: string;
  category?: string;
  date?: string;
  proofUrl?: string;
}>): Promise<AchievementItem> {
  const res = await api.patch(`/students/me/achievements/${id}`, data);
  return res.data.data;
}

export async function deleteAchievement(id: string): Promise<void> {
  await api.delete(`/students/me/achievements/${id}`);
}

// ── Resumes ───────────────────────────────────────────────────────────────────

export async function uploadResume(file: File): Promise<ResumeItem> {
  const formData = new FormData();
  formData.append('resume', file);
  const res = await api.post('/students/me/resumes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data;
}

export async function listResumes(): Promise<ResumeItem[]> {
  const res = await api.get('/students/me/resumes');
  return res.data.data;
}

export async function setPrimaryResume(id: string): Promise<ResumeItem> {
  const res = await api.patch(`/students/me/resumes/${id}/primary`);
  return res.data.data;
}

export async function deleteResume(id: string): Promise<void> {
  await api.delete(`/students/me/resumes/${id}`);
}

// ── Professional Profiles ─────────────────────────────────────────────────────

export async function addProfessionalProfile(data: { platform: string; profileUrl: string }): Promise<ProfessionalProfileItem> {
  const res = await api.post('/students/me/professional-profiles', data);
  return res.data.data;
}

export async function listProfessionalProfiles(): Promise<ProfessionalProfileItem[]> {
  const res = await api.get('/students/me/professional-profiles');
  return res.data.data;
}

export async function updateProfessionalProfile(id: string, data: { profileUrl: string }): Promise<ProfessionalProfileItem> {
  const res = await api.patch(`/students/me/professional-profiles/${id}`, data);
  return res.data.data;
}

export async function deleteProfessionalProfile(id: string): Promise<void> {
  await api.delete(`/students/me/professional-profiles/${id}`);
}

// ── Coding Profiles ───────────────────────────────────────────────────────────

export async function addCodingProfile(data: {
  platform: string;
  username: string;
  profileUrl: string;
  statistics?: Record<string, any>;
}): Promise<CodingProfileItem> {
  const res = await api.post('/students/me/coding-profiles', data);
  return res.data.data;
}

export async function listCodingProfiles(): Promise<CodingProfileItem[]> {
  const res = await api.get('/students/me/coding-profiles');
  return res.data.data;
}

export async function updateCodingProfile(
  id: string,
  data: Partial<{ username: string; profileUrl: string; statistics: Record<string, any> }>
): Promise<CodingProfileItem> {
  const res = await api.patch(`/students/me/coding-profiles/${id}`, data);
  return res.data.data;
}

export async function deleteCodingProfile(id: string): Promise<void> {
  await api.delete(`/students/me/coding-profiles/${id}`);
}
