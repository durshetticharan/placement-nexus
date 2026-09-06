import api from './api';
import type { PlacementDrive } from './driveService';

export type ApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'ASSESSMENT_STAGE' | 'INTERVIEW_STAGE' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';
export type InterviewOutcome = 'PENDING' | 'PASSED' | 'FAILED';
export type InterviewType = 'HR' | 'TECHNICAL' | 'MANAGERIAL' | 'ASSIGNMENT';
export type SelectionDecision = 'SELECTED' | 'REJECTED';

export interface Interview {
  id: string;
  roundNumber: number;
  type: InterviewType;
  scheduledAt: string;
  meetingLink?: string;
  location?: string;
  outcome: InterviewOutcome;
  score?: number;
  feedback?: string;
}

export interface Selection {
  id: string;
  decision: SelectionDecision;
  finalPackage?: number;
  notes?: string;
}

export interface Application {
  id: string;
  studentId: string;
  placementDriveId: string;
  status: ApplicationStatus;
  appliedAt: string;
  student?: any; // For recruiter view
  placementDrive?: PlacementDrive;
  interviews?: Interview[];
  selection?: Selection;
}

export const applicationApi = {
  // Student Context
  apply: async (driveId: string) => {
    const res = await api.post(`/students/me/applications/${driveId}`);
    return res.data.data as Application;
  },
  withdraw: async (id: string) => {
    const res = await api.delete(`/students/me/applications/${id}`);
    return res.data.data;
  },
  getMyApplications: async () => {
    const res = await api.get('/students/me/applications');
    return res.data.data as Application[];
  },
  getMyInterviews: async () => {
    const res = await api.get('/students/me/interviews');
    return res.data.data as Interview[];
  },

  // Recruiter Context
  getDriveApplications: async (driveId: string) => {
    const res = await api.get(`/recruiters/me/drives/${driveId}/applications`);
    return res.data.data as Application[];
  },
  updateStatus: async (applicationId: string, status: ApplicationStatus) => {
    const res = await api.patch(`/recruiters/me/applications/${applicationId}/status`, { status });
    return res.data.data as Application;
  },
  scheduleInterview: async (applicationId: string, data: any) => {
    const res = await api.post(`/recruiters/me/applications/${applicationId}/interviews`, data);
    return res.data.data as Interview;
  },
  updateInterviewOutcome: async (interviewId: string, data: any) => {
    const res = await api.patch(`/recruiters/me/interviews/${interviewId}`, data);
    return res.data.data as Interview;
  },
  recordSelection: async (applicationId: string, data: any) => {
    const res = await api.post(`/recruiters/me/applications/${applicationId}/selection`, data);
    return res.data.data as Selection;
  },

  // Officer Context
  getOfficerDriveApplications: async (driveId: string) => {
    const res = await api.get(`/officer/drives/${driveId}/applications`);
    return res.data.data as Application[];
  }
};
