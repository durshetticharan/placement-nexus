import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole, PrismaClient } from '@prisma/client';
import * as userRepo from '../repositories/user.repository';
import * as recruiterRepo from '../repositories/recruiter.repository';
import * as alumniRepo from '../repositories/alumni.repository';
import { generateSecureToken } from '../utils/otp';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

// ─── Register ────────────────────────────────────────────────────────────────

export interface StudentProfileData {
  fullName: string;
  rollNumber: string;
}

export interface RecruiterProfileData {
  fullName: string;
  designation?: string;
  companyName: string;
}

export interface AlumniProfileData {
  fullName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  collegeName: string;
}

export async function register(
  email: string,
  password: string,
  role: UserRole,
  profileData?: Partial<StudentProfileData & RecruiterProfileData & AlumniProfileData>,
) {
  const existing = await userRepo.findUserByEmail(email);
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists.'), {
      code: 'CONFLICT',
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await userRepo.createUser({ email, passwordHash, role });

  const user = await userRepo.findUserByEmail(email);
  if (!user) throw new Error('User creation failed.');

  // Generate a secure random verification token (raw never stored)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHmac('sha256', getEnv('EMAIL_VERIFICATION_SECRET'))
    .update(rawToken)
    .digest('hex');
  const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await userRepo.updateUser(user.id, {
    otpCode: tokenHash,
    otpExpiresAt: tokenExpiry,
    otpPurpose: 'EMAIL_VERIFY',
    otpAttempts: 0,
  });

  // ── Role-specific profile creation ────────────────────────────────────────
  if (role === 'STUDENT' && profileData?.fullName && profileData?.rollNumber) {
    try {
      await prisma.student.create({
        data: {
          userId: user.id,
          fullName: profileData.fullName,
          rollNumber: profileData.rollNumber,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002' && err.meta?.target?.includes('rollNumber')) {
        throw Object.assign(new Error('A student with this roll number already exists.'), {
          code: 'CONFLICT',
          statusCode: 409,
        });
      }
      throw err;
    }
  }

  if (role === 'RECRUITER' && profileData?.fullName && profileData?.companyName) {
    const company = await recruiterRepo.findOrCreateCompany(profileData.companyName);
    await recruiterRepo.createRecruiter({
      userId: user.id,
      companyId: company.id,
      fullName: profileData.fullName,
      designation: profileData.designation,
    });
  }

  if (
    role === 'ALUMNI' &&
    profileData?.fullName &&
    profileData?.degree &&
    profileData?.branch &&
    profileData?.graduationYear !== undefined &&
    profileData?.collegeName
  ) {
    await alumniRepo.createAlumniProfileWithVerification({
      userId: user.id,
      fullName: profileData.fullName,
      degree: profileData.degree,
      branch: profileData.branch,
      graduationYear: profileData.graduationYear,
      collegeName: profileData.collegeName,
    });
  }

  // Build verification URL — raw token is only ever in the email, never stored
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`;

  await sendVerificationEmail(email, verificationUrl);

  const pendingApprovalRoles: UserRole[] = ['RECRUITER', 'ALUMNI'];
  const extraNote = pendingApprovalRoles.includes(role)
    ? ' After verifying your email, your account will also require approval from a Placement Officer before you can log in.'
    : '';

  return {
    message: `Registration submitted successfully. Please check your email and click the verification link to verify your account.${extraNote}`,
  };
}

// ─── Verify Email Token ───────────────────────────────────────────────────────

export async function verifyEmailToken(rawToken: string) {
  if (!rawToken || rawToken.length < 10) {
    throw Object.assign(new Error('Invalid verification link.'), {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  // Hash the incoming raw token to compare against stored hash
  const tokenHash = crypto
    .createHmac('sha256', getEnv('EMAIL_VERIFICATION_SECRET'))
    .update(rawToken)
    .digest('hex');

  const user = await userRepo.findUserByVerificationTokenHash(tokenHash);
  if (!user) {
    throw Object.assign(
      new Error('This verification link is invalid or has expired. Please request a new one.'),
      { code: 'VALIDATION_ERROR', statusCode: 400 }
    );
  }

  if (user.emailVerified) {
    throw Object.assign(new Error('Your email is already verified.'), {
      code: 'ALREADY_VERIFIED',
      statusCode: 400,
    });
  }

  // Two-gate logic:
  // STUDENT and PLACEMENT_OFFICER become ACTIVE immediately after email verification.
  // RECRUITER and ALUMNI must also pass officer approval — they stay PENDING_VERIFICATION
  // until a Placement Officer explicitly approves them (which then sets status=ACTIVE).
  const activateOnVerify = user.role === 'STUDENT' || user.role === 'PLACEMENT_OFFICER';

  await userRepo.updateUser(user.id, {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    status: activateOnVerify ? 'ACTIVE' : 'PENDING_VERIFICATION',
    // Clear verification token fields — token is now single-use
    otpCode: null,
    otpExpiresAt: null,
    otpPurpose: null,
    otpAttempts: 0,
  });

  const message = activateOnVerify
    ? 'Email verified successfully. You can now log in.'
    : 'Email verified successfully. Your account is now pending approval by a Placement Officer.';

  return { message };
}

// ─── Resend Verification Email ────────────────────────────────────────────────

export async function resendVerification(email: string) {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    // Return safe generic message — do not leak whether email is registered
    return { message: 'If this email is registered and unverified, a new verification link has been sent.' };
  }

  if (user.emailVerified) {
    throw Object.assign(new Error('Email is already verified.'), {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  // Generate new token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHmac('sha256', getEnv('EMAIL_VERIFICATION_SECRET'))
    .update(rawToken)
    .digest('hex');
  const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Atomic rate limiting: only update if the current token is null or was generated > 60s ago
  // (i.e. its expiry is at most 29 minutes from now, meaning it was created >= 60s ago).
  const updateResult = await prisma.user.updateMany({
    where: {
      id: user.id,
      OR: [
        { otpExpiresAt: null },
        { otpExpiresAt: { lte: new Date(Date.now() + 29 * 60 * 1000) } },
      ],
    },
    data: {
      otpCode: tokenHash,
      otpExpiresAt: tokenExpiry,
      otpPurpose: 'EMAIL_VERIFY',
      otpAttempts: 0,
    },
  });

  if (updateResult.count === 0) {
    throw Object.assign(new Error('Please wait 60 seconds before requesting a new verification email.'), {
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`;

  await sendVerificationEmail(email, verificationUrl);

  return {
    message: 'A new verification link has been sent to your email. Please check your inbox.',
  };
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  if (user.status === 'PENDING_VERIFICATION') {
    // Distinguish between "haven't verified email" vs "waiting for officer approval"
    const awaitingOfficer =
      user.emailVerified && (user.role === 'RECRUITER' || user.role === 'ALUMNI');
    const msg = awaitingOfficer
      ? 'Your account is pending approval by a Placement Officer. You will be able to log in once approved.'
      : 'Please verify your email before logging in. Check your inbox for the verification code.';
    throw Object.assign(new Error(msg), { code: 'UNAUTHORIZED', statusCode: 401 });
  }

  if (user.status !== 'ACTIVE') {
    throw Object.assign(new Error('Your account is not active. Please contact support.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw Object.assign(new Error('Invalid email or password.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    getEnv('JWT_ACCESS_SECRET'),
    { expiresIn: getEnv('JWT_ACCESS_EXPIRY') as any }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, jti: crypto.randomUUID() },
    getEnv('JWT_REFRESH_SECRET'),
    { expiresIn: getEnv('JWT_REFRESH_EXPIRY') as any }
  );

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await userRepo.updateUser(user.id, {
    refreshTokenHash,
    refreshTokenExpiry,
    lastLoginAt: new Date(),
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

// ─── Refresh Token ───────────────────────────────────────────────────────────

export async function refreshToken(oldRefreshToken: string) {
  let payload: { userId: string };
  try {
    payload = jwt.verify(oldRefreshToken, getEnv('JWT_REFRESH_SECRET')) as { userId: string };
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  const user = await userRepo.findUserById(payload.userId);
  if (!user || !user.refreshTokenHash) {
    throw Object.assign(new Error('Session not found. Please log in again.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
    throw Object.assign(new Error('Refresh token has expired. Please log in again.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  const incomingHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
  if (incomingHash !== user.refreshTokenHash) {
    // Possible token reuse — revoke all sessions
    await userRepo.updateUser(user.id, { refreshTokenHash: null, refreshTokenExpiry: null });
    throw Object.assign(new Error('Refresh token reuse detected. All sessions revoked.'), {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  // Rotate tokens
  const newAccessToken = jwt.sign(
    { userId: user.id, role: user.role },
    getEnv('JWT_ACCESS_SECRET'),
    { expiresIn: getEnv('JWT_ACCESS_EXPIRY') as any }
  );

  const newRefreshToken = jwt.sign(
    { userId: user.id, jti: crypto.randomUUID() },
    getEnv('JWT_REFRESH_SECRET'),
    { expiresIn: getEnv('JWT_REFRESH_EXPIRY') as any }
  );

  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await userRepo.updateUser(user.id, {
    refreshTokenHash: newHash,
    refreshTokenExpiry: newExpiry,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(userId: string) {
  await userRepo.updateUser(userId, { refreshTokenHash: null, refreshTokenExpiry: null });
  return { message: 'Logged out successfully.' };
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

export async function forgotPassword(email: string) {
  const user = await userRepo.findUserByEmail(email);
  // Always return success to avoid user enumeration
  if (!user) {
    return { message: 'If that email is registered, a reset link has been sent to your inbox.' };
  }

  const resetToken = generateSecureToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepo.updateUser(user.id, {
    passwordResetToken: resetToken,
    passwordResetTokenExpiry: expiry,
  });

  await sendPasswordResetEmail(email, resetToken);

  return { message: 'If that email is registered, a reset link has been sent to your inbox.' };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(resetToken: string, newPassword: string) {
  const user = await userRepo.findUserByResetToken(resetToken);
  if (!user) {
    throw Object.assign(new Error('Invalid or expired password reset token.'), {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await userRepo.updateUser(user.id, {
    passwordHash,
    passwordResetToken: null,
    passwordResetTokenExpiry: null,
    // Invalidate all sessions
    refreshTokenHash: null,
    refreshTokenExpiry: null,
  });

  return { message: 'Password reset successfully. Please log in with your new password.' };
}
