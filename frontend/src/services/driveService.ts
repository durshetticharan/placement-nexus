import api from './api';

export interface DriveRequirement {
  minCgpa?: number;
  maxCgpa?: number;
  allowedBranches: string[];
  allowedDegrees: string[];
  maxActiveBacklogs?: number;
  maxHistoryBacklogs?: number;
  minGraduationYear?: number;
  maxGraduationYear?: number;
  requireInternship: boolean;
  requiredSkills: any[];
  preferredSkills: any[];
}

export interface PlacementDrive {
  id: string;
  title: string;
  jobTitle: string;
  description: string;
  employmentType: string;
  jobType: string;
  location: string;
  workMode: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  openingCount?: number;
  graduationYear?: number;
  applicationStartAt: string;
  applicationEndAt: string;
  driveDate?: string;
  selectionProcess?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';
  company: any;
  requirements?: DriveRequirement;
}

export const recruiterDriveApi = {
  list: async () => {
    const res = await api.get('/recruiters/drives');
    return res.data.data as PlacementDrive[];
  },
  get: async (id: string) => {
    const res = await api.get(`/recruiters/drives/${id}`);
    return res.data.data as PlacementDrive;
  },
  create: async (data: any) => {
    const res = await api.post('/recruiters/drives', data);
    return res.data.data as PlacementDrive;
  },
  update: async (id: string, data: any) => {
    const res = await api.put(`/recruiters/drives/${id}`, data);
    return res.data.data;
  },
  updateRequirements: async (id: string, data: any) => {
    const res = await api.put(`/recruiters/drives/${id}/requirements`, data);
    return res.data.data;
  },
  submit: async (id: string) => {
    const res = await api.post(`/recruiters/drives/${id}/submit`);
    return res.data.data;
  },
  close: async (id: string) => {
    const res = await api.post(`/recruiters/drives/${id}/close`);
    return res.data.data;
  },
  cancel: async (id: string) => {
    const res = await api.post(`/recruiters/drives/${id}/cancel`);
    return res.data.data;
  },
};

export const officerDriveApi = {
  list: async () => {
    const res = await api.get('/officer/drives');
    return res.data.data as PlacementDrive[];
  },
  get: async (id: string) => {
    const res = await api.get(`/officer/drives/${id}`);
    return res.data.data as PlacementDrive;
  },
  approve: async (id: string) => {
    const res = await api.post(`/officer/drives/${id}/approve`);
    return res.data.data;
  },
  publish: async (id: string) => {
    const res = await api.post(`/officer/drives/${id}/publish`);
    return res.data.data;
  },
  reject: async (id: string, reason: string) => {
    const res = await api.post(`/officer/drives/${id}/reject`, { reason });
    return res.data.data;
  },
  close: async (id: string) => {
    const res = await api.post(`/officer/drives/${id}/close`);
    return res.data.data;
  },
  cancel: async (id: string) => {
    const res = await api.post(`/officer/drives/${id}/cancel`);
    return res.data.data;
  },
  complete: async (id: string) => {
    const res = await api.post(`/officer/drives/${id}/complete`);
    return res.data.data;
  },
};

export const studentDriveApi = {
  list: async () => {
    const res = await api.get('/students/drives');
    return res.data.data as PlacementDrive[];
  },
  get: async (id: string) => {
    const res = await api.get(`/students/drives/${id}`);
    return res.data.data as PlacementDrive;
  },
  checkEligibility: async (id: string) => {
    const res = await api.get(`/students/drives/${id}/eligibility`);
    return res.data.data;
  }
};
