import api from './api';

export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  website?: string | null;
  industry?: string | null;
  companyType?: string | null;
  description?: string | null;
  headquarters?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companySize?: string | null;
  foundedYear?: number | null;
  logoUrl?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  verification?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    verifiedById?: string | null;
    verifiedAt?: string | null;
    rejectionReason?: string | null;
  } | null;
  _count?: {
    recruiters?: number;
    memberships?: number;
    placementDrives?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruiterProfile {
  id: string;
  userId: string;
  fullName: string;
  designation?: string | null;
  department?: string | null;
  phone?: string | null;
  alternateEmail?: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  user?: {
    id: string;
    email: string;
    status: string;
    emailVerified?: boolean;
    lastLoginAt?: string | null;
  };
  company?: Company;
  memberships?: RecruiterCompanyMembership[];
}

export interface RecruiterCompanyMembership {
  id: string;
  recruiterId: string;
  companyId: string;
  role: 'COMPANY_ADMIN' | 'RECRUITER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  company: Company;
  recruiter?: {
    id: string;
    fullName: string;
    designation?: string | null;
    user?: { id: string; email: string };
  };
}

export const companyService = {
  // ── Recruiter self-service ──────────────────────────────────────────────────
  async getMyProfile(): Promise<RecruiterProfile> {
    const res = await api.get<{ success: boolean; data: RecruiterProfile }>('/recruiters/me');
    return res.data.data;
  },

  async updateMyProfile(data: Partial<RecruiterProfile>): Promise<RecruiterProfile> {
    const res = await api.put<{ success: boolean; data: RecruiterProfile }>('/recruiters/me', data);
    return res.data.data;
  },

  async getMyCompanies(): Promise<RecruiterCompanyMembership[]> {
    const res = await api.get<{ success: boolean; data: RecruiterCompanyMembership[] }>('/recruiters/me/companies');
    return res.data.data;
  },

  async requestCompanyAssociation(data: {
    companyId?: string;
    companyName?: string;
    designation?: string;
    department?: string;
    role?: 'COMPANY_ADMIN' | 'RECRUITER';
  }): Promise<RecruiterCompanyMembership> {
    const res = await api.post<{ success: boolean; data: RecruiterCompanyMembership }>('/recruiters/me/company-requests', data);
    return res.data.data;
  },

  // ── Public / Authenticated Company ──────────────────────────────────────────
  async getCompanies(params?: { search?: string; industry?: string }): Promise<Company[]> {
    const res = await api.get<{ success: boolean; data: Company[] }>('/companies', { params });
    return res.data.data;
  },

  async getCompany(id: string): Promise<Company> {
    const res = await api.get<{ success: boolean; data: Company }>(`/companies/${id}`);
    return res.data.data;
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const res = await api.put<{ success: boolean; data: Company }>(`/companies/${id}`, data);
    return res.data.data;
  },

  // ── Officer Company Management ──────────────────────────────────────────────
  async officerListCompanies(params?: { status?: string; verificationStatus?: string; search?: string }): Promise<Company[]> {
    const res = await api.get<{ success: boolean; data: Company[] }>('/officer/companies', { params });
    return res.data.data;
  },

  async officerGetCompany(id: string): Promise<Company> {
    const res = await api.get<{ success: boolean; data: Company }>(`/officer/companies/${id}`);
    return res.data.data;
  },

  async officerCreateCompany(data: Partial<Company>): Promise<Company> {
    const res = await api.post<{ success: boolean; data: Company }>('/officer/companies', data);
    return res.data.data;
  },

  async officerUpdateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const res = await api.patch<{ success: boolean; data: Company }>(`/officer/companies/${id}`, data);
    return res.data.data;
  },

  async officerApproveCompany(id: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/companies/${id}/approve`);
    return res.data.data;
  },

  async officerRejectCompany(id: string, reason?: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/companies/${id}/reject`, { reason });
    return res.data.data;
  },

  async officerSuspendCompany(id: string, reason?: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/companies/${id}/suspend`, { reason });
    return res.data.data;
  },

  // ── Officer Recruiter Management ────────────────────────────────────────────
  async officerListRecruiters(params?: { verificationStatus?: string; search?: string }): Promise<RecruiterProfile[]> {
    const res = await api.get<{ success: boolean; data: RecruiterProfile[] }>('/officer/recruiters', { params });
    return res.data.data;
  },

  async officerGetRecruiter(id: string): Promise<RecruiterProfile> {
    const res = await api.get<{ success: boolean; data: RecruiterProfile }>(`/officer/recruiters/${id}`);
    return res.data.data;
  },

  async officerApproveRecruiter(id: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/recruiters/${id}/approve`);
    return res.data.data;
  },

  async officerRejectRecruiter(id: string, reason?: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/recruiters/${id}/reject`, { reason });
    return res.data.data;
  },

  async officerSuspendRecruiter(id: string, reason?: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/recruiters/${id}/suspend`, { reason });
    return res.data.data;
  },

  // ── Officer Membership Management ───────────────────────────────────────────
  async officerListMemberships(params?: { status?: string; companyId?: string }): Promise<RecruiterCompanyMembership[]> {
    const res = await api.get<{ success: boolean; data: RecruiterCompanyMembership[] }>('/officer/company-memberships', { params });
    return res.data.data;
  },

  async officerApproveMembership(id: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/company-memberships/${id}/approve`);
    return res.data.data;
  },

  async officerRejectMembership(id: string, reason?: string): Promise<{ message: string }> {
    const res = await api.post<{ success: boolean; data: { message: string } }>(`/officer/company-memberships/${id}/reject`, { reason });
    return res.data.data;
  },

  async officerUpdateMembershipRole(id: string, role: 'COMPANY_ADMIN' | 'RECRUITER'): Promise<RecruiterCompanyMembership> {
    const res = await api.patch<{ success: boolean; data: RecruiterCompanyMembership }>(`/officer/company-memberships/${id}/role`, { role });
    return res.data.data;
  },
};
