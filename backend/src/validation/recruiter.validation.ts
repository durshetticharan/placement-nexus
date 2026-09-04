import { z } from 'zod';

export const updateRecruiterProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name cannot be empty.').max(100, 'Full name too long.').optional(),
  designation: z.string().trim().max(100, 'Designation too long.').optional().nullable(),
  department: z.string().trim().max(100, 'Department too long.').optional().nullable(),
  phone: z.string().trim().max(30, 'Phone number too long.').optional().nullable(),
  alternateEmail: z.string().trim().email('Must be a valid email address.').optional().nullable().or(z.literal('')),
});
