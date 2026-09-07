import api from './api';

export interface Mentor {
  id: string;
  fullName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  currentCompany?: string;
  currentDesignation?: string;
  mentorBio?: string;
  mentorTopics: string[];
  isMentor?: boolean;
  maxMentees?: number;
}

export const getMentorDirectory = async (topic?: string, company?: string) => {
  const res = await api.get('/mentors', { params: { topic, company } });
  return res.data;
};

export const updateMentorProfile = async (data: Partial<Mentor>) => {
  const res = await api.patch('/mentors/me', data);
  return res.data;
};

export const requestMentorship = async (alumniProfileId: string, message?: string) => {
  const res = await api.post('/mentorships', { alumniProfileId, message });
  return res.data;
};

export const updateMentorshipStatus = async (id: string, status: string) => {
  const res = await api.patch(`/mentorships/${id}/status`, { status });
  return res.data;
};

export const getMentorships = async () => {
  const res = await api.get('/mentorships');
  return res.data;
};

export const getMentorshipDetails = async (id: string) => {
  const res = await api.get(`/mentorships/${id}`);
  return res.data;
};

export const addGuidance = async (id: string, content: string) => {
  const res = await api.post(`/mentorships/${id}/guidance`, { content });
  return res.data;
};
