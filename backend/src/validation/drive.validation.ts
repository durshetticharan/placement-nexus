import { z } from 'zod';

const preprocessNumber = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
};

const dateField = z.string().refine(val => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});

const baseDriveSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title is too long'),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(100, 'Job title is too long'),
  description: z.string().trim().min(1, 'Description is required').max(5000, 'Description is too long'),
  employmentType: z.string().trim().min(1, 'Employment type is required'),
  jobType: z.string().trim().min(1, 'Job type is required'),
  location: z.string().trim().min(1, 'Location is required'),
  workMode: z.string().trim().min(1, 'Work mode is required'),
  
  salaryMin: z.preprocess(preprocessNumber, z.number().min(0, 'Salary must be positive').optional().nullable()),
  salaryMax: z.preprocess(preprocessNumber, z.number().min(0, 'Salary must be positive').optional().nullable()),
  salaryCurrency: z.string().trim().min(1).default('INR'),
  salaryPeriod: z.string().trim().min(1).default('YEARLY'),
  
  openingCount: z.preprocess(preprocessNumber, z.number().int().min(1, 'Openings must be at least 1').optional().nullable()),
  graduationYear: z.preprocess(preprocessNumber, z.number().int().min(1900).max(2100).optional().nullable()),
  
  applicationStartAt: dateField,
  applicationEndAt: dateField,
  driveDate: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
    dateField.optional().nullable()
  ),
  
  selectionProcess: z.string().trim().max(2000, 'Selection process too long').optional().nullable(),
});

export const createDriveSchema = baseDriveSchema.refine(data => {
  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    return false;
  }
  return true;
}, {
  message: 'Minimum salary cannot be greater than maximum salary',
  path: ['salaryMax'],
}).refine(data => {
  const start = new Date(data.applicationStartAt).getTime();
  const end = new Date(data.applicationEndAt).getTime();
  return start < end;
}, {
  message: 'Application end date must be after start date',
  path: ['applicationEndAt'],
});

export const updateDriveSchema = baseDriveSchema.partial();

export const driveRequirementSchema = z.object({
  minCgpa: z.preprocess(preprocessNumber, z.number().min(0).max(10).optional().nullable()),
  maxCgpa: z.preprocess(preprocessNumber, z.number().min(0).max(10).optional().nullable()),
  allowedBranches: z.array(z.string()).default([]),
  allowedDegrees: z.array(z.string()).default([]),
  maxActiveBacklogs: z.preprocess(preprocessNumber, z.number().int().min(0).optional().nullable()),
  maxHistoryBacklogs: z.preprocess(preprocessNumber, z.number().int().min(0).optional().nullable()),
  minGraduationYear: z.preprocess(preprocessNumber, z.number().int().min(1900).max(2100).optional().nullable()),
  maxGraduationYear: z.preprocess(preprocessNumber, z.number().int().min(1900).max(2100).optional().nullable()),
  requireInternship: z.boolean().default(false),
  requiredSkills: z.array(z.string()).default([]), // array of skill IDs
  preferredSkills: z.array(z.string()).default([]), // array of skill IDs
}).refine(data => {
  if (data.minCgpa && data.maxCgpa && data.minCgpa > data.maxCgpa) return false;
  return true;
}, {
  message: 'Minimum CGPA cannot be greater than maximum CGPA',
  path: ['maxCgpa'],
}).refine(data => {
  if (data.minGraduationYear && data.maxGraduationYear && data.minGraduationYear > data.maxGraduationYear) return false;
  return true;
}, {
  message: 'Minimum graduation year cannot be greater than maximum graduation year',
  path: ['maxGraduationYear'],
});

export const reviewActionSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});
