import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Must be a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/\d/, 'Password must contain at least one number.'),
  role: z.enum(['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER', 'ALUMNI'] as const, {
    errorMap: () => ({
      message: 'Role must be one of: STUDENT, RECRUITER, PLACEMENT_OFFICER, ALUMNI.',
    }),
  }),
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
