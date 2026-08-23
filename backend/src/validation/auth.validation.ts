import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Must be a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/\d/, 'Password must contain at least one number.'),
    role: z.enum(['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER', 'ALUMNI'], {
      error: 'Role must be one of: STUDENT, RECRUITER, PLACEMENT_OFFICER, ALUMNI.',
    }),
    // ── Student fields ──────────────────────────────────────────────────────
    rollNumber: z.string().min(1, 'Roll number must not be empty.').optional(),
    // ── Recruiter fields ────────────────────────────────────────────────────
    fullName: z.string().min(1, 'Full name must not be empty.').optional(),
    designation: z.string().optional(),
    companyName: z.string().min(1, 'Company name must not be empty.').optional(),
    // ── Alumni fields ───────────────────────────────────────────────────────
    degree: z.string().min(1, 'Degree must not be empty.').optional(),
    branch: z.string().min(1, 'Branch must not be empty.').optional(),
    graduationYear: z.number().int().min(1990).max(2100).optional(),
    collegeName: z.string().min(1, 'College name must not be empty.').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'STUDENT') {
      if (!data.fullName) {
        ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'fullName is required for student registration.' });
      }
      if (!data.rollNumber) {
        ctx.addIssue({ code: 'custom', path: ['rollNumber'], message: 'rollNumber is required for student registration.' });
      }
    }
    if (data.role === 'RECRUITER') {
      if (!data.fullName) {
        ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'fullName is required for recruiter registration.' });
      }
      if (!data.companyName) {
        ctx.addIssue({ code: 'custom', path: ['companyName'], message: 'companyName is required for recruiter registration.' });
      }
    }
    if (data.role === 'ALUMNI') {
      if (!data.fullName) {
        ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'fullName is required for alumni registration.' });
      }
      if (!data.degree) {
        ctx.addIssue({ code: 'custom', path: ['degree'], message: 'degree is required for alumni registration.' });
      }
      if (!data.branch) {
        ctx.addIssue({ code: 'custom', path: ['branch'], message: 'branch is required for alumni registration.' });
      }
      if (data.graduationYear === undefined) {
        ctx.addIssue({ code: 'custom', path: ['graduationYear'], message: 'graduationYear is required for alumni registration.' });
      }
      if (!data.collegeName) {
        ctx.addIssue({ code: 'custom', path: ['collegeName'], message: 'collegeName is required for alumni registration.' });
      }
    }
  });

export const verifyOtpSchema = z.object({
  email: z.string().email('Must be a valid email address.'),
  otpCode: z
    .string()
    .length(6, 'OTP must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'OTP must contain only digits.'),
});

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email address.'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required.'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/\d/, 'Password must contain at least one number.'),
});

// Middleware factory — validates req.body against a Zod schema
import { Request, Response, NextFunction } from 'express';

export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        issue: e.message,
      }));
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
