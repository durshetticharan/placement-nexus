import { z } from 'zod';
import { CompanyRole, CompanyStatus } from '@prisma/client';

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required.').max(150, 'Company name too long.'),
  legalName: z.string().trim().max(200, 'Legal name too long.').optional().nullable(),
  website: z.string().trim().url('Must be a valid website URL (e.g. https://company.com).').optional().nullable().or(z.literal('')),
  industry: z.string().trim().max(100, 'Industry name too long.').optional().nullable(),
  companyType: z.string().trim().max(100, 'Company type too long.').optional().nullable(),
  description: z.string().trim().max(2000, 'Description too long.').optional().nullable(),
  headquarters: z.string().trim().max(150, 'Headquarters too long.').optional().nullable(),
  country: z.string().trim().max(100, 'Country too long.').optional().nullable(),
  state: z.string().trim().max(100, 'State too long.').optional().nullable(),
  city: z.string().trim().max(100, 'City too long.').optional().nullable(),
  contactEmail: z.string().trim().email('Must be a valid contact email.').optional().nullable().or(z.literal('')),
  contactPhone: z.string().trim().max(30, 'Phone number too long.').optional().nullable(),
  companySize: z.string().trim().max(50, 'Company size too long.').optional().nullable(),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  logoUrl: z.string().trim().url('Logo URL must be a valid URL.').optional().nullable().or(z.literal('')),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  status: z.nativeEnum(CompanyStatus).optional(),
});

export const requestCompanyAssociationSchema = z.object({
  companyId: z.string().optional(),
  companyName: z.string().trim().min(1).optional(),
  designation: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  role: z.nativeEnum(CompanyRole).default('RECRUITER'),
}).refine(data => !!data.companyId || !!data.companyName, {
  message: 'Either companyId or companyName must be provided.',
  path: ['companyId'],
});

export const updateMembershipRoleSchema = z.object({
  role: z.nativeEnum(CompanyRole, {
    message: 'Role must be COMPANY_ADMIN or RECRUITER.',
  }),
});

export const reviewActionSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
