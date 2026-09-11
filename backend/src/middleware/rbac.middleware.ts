import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Role-Based Access Control ────────────────────────────────────────────────

/**
 * Middleware factory. Runs AFTER requireAuth (req.user is already set).
 * Returns 403 FORBIDDEN if the authenticated user's role is not in allowedRoles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        },
      });
      return;
    }

    next();
  };
}

// ─── Recruiter Verification Gate ─────────────────────────────────────────────

/**
 * Guards recruiter-only routes. Even if the JWT is valid, a RECRUITER whose
 * verificationStatus is PENDING or REJECTED is blocked with 403.
 * Place this AFTER requireAuth + requireRole('RECRUITER').
 */
export async function requireVerifiedRecruiter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    const recruiter = await prisma.recruiter.findUnique({
      where: { userId: req.user.userId },
      select: { verificationStatus: true },
    });

    if (!recruiter || recruiter.verificationStatus !== 'APPROVED') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Your recruiter profile has not been approved by a Placement Officer. Please wait for verification.',
        },
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Verification check failed.' },
    });
  }
}

// ─── Alumni Verification Gate ─────────────────────────────────────────────────

/**
 * Guards alumni-only routes. Even if the JWT is valid, an ALUMNI whose
 * AlumniVerification status is PENDING or REJECTED is blocked with 403.
 * Place this AFTER requireAuth + requireRole('ALUMNI').
 */
export async function requireVerifiedAlumni(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    const profile = await prisma.alumniProfile.findUnique({
      where: { userId: req.user.userId },
      select: { verification: { select: { status: true } } },
    });

    if (!profile || !profile.verification || profile.verification.status !== 'APPROVED') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Your alumni profile has not been approved by a Placement Officer. Please wait for verification.',
        },
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Verification check failed.' },
    });
  }
}
