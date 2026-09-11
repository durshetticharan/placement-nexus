import api from './api';

export interface BuiltResume {
  id: string;
  studentId: string;
  template: string;
  personalInfo: any;
  careerObjective: string;
  sectionConfig: any;
  educations: any[];
  skills: any[];
  projects: any[];
  experiences: any[];
  certifications: any[];
  achievements: any[];
  languages: any[];
}

export const resumeBuilderService = {
  getResume: async (): Promise<BuiltResume> => {
    const response = await api.get('/student/resume-builder');
    return response.data.data;
  },

  upsertResume: async (payload: Partial<BuiltResume>): Promise<BuiltResume> => {
    const response = await api.put('/student/resume-builder', payload);
    return response.data.data;
  },
};
