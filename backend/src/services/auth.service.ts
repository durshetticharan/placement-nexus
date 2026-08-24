import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole, PrismaClient } from '@prisma/client';
import * as userRepo from '../repositories/user.repository';
import * as recruiterRepo from '../repositories/recruiter.repository';
import * as alumniRepo from '../repositories/alumni.repository';
import { generateOtp, generateSecureToken } from '../utils/otp';
import { sendOtpEmail, sendPasswordResetEmail } from './emailService';

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
  const { code: otpCode, expiresAt: otpExpiresAt } = generateOtp();

  await userRepo.createUser({ email, passwordHash, role });

  const user = await userRepo.findUserByEmail(email);
  if (!user) throw new Error('User creation failed.');

  await userRepo.updateUser(user.id, {
    otpCode,
    otpExpiresAt,
    otpPurpose: 'EMAIL_VERIFY',
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

  await sendOtpEmail(email, otpCode, 'Email Verification');

  const pendingApprovalRoles: UserRole[] = ['RECRUITER', 'ALUMNI'];
  const extraNote = pendingApprovalRoles.includes(role)
    ? ' After verifying your email, your account will also require approval from a Placement Officer before you can log in.'
    : '';

  return {
    message: `Registration successful. Please check your email (console) for the OTP.${extraNote}`,
    ...(process.env.NODE_ENV === 'test' && { otpCode }),
  };
}

// ─── Verify OTP ──────────────────────────────────────────────────────────────

export async function verifyOtp(email: string, otpCode: string) {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw Object.assign(new Error('User not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    throw Object.assign(new Error('No pending OTP for this account.'), {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  if (user.otpCode !== otpCode) {
    throw Object.assign(new Error('Invalid OTP code.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }

  if (user.otpExpiresAt < new Date()) {
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  // Two-gate logic:
  // STUDENT and PLACEMENT_OFFICER become ACTIVE immediately after email verification.
  // RECRUITER and ALUMNI must also pass officer approval — they stay PENDING_VERIFICATION
  // until a Placement Officer explicitly approves them (which then sets status=ACTIVE).
  const activateOnOtp = user.role === 'STUDENT' || user.role === 'PLACEMENT_OFFICER';

  await userRepo.updateUser(user.id, {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    status: activateOnOtp ? 'ACTIVE' : 'PENDING_VERIFICATION',
    otpCode: null,
    otpExpiresAt: null,
    otpPurpose: null,
  });

  const message = activateOnOtp
    ? 'Email verified successfully. You can now log in.'
    : 'Email verified successfully. Your account is now pending approval by a Placement Officer.';

  return { message };
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
      : 'Your email has not been verified. Please check your console for the OTP.';
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
    return { message: 'If that email is registered, a reset link has been sent to your console.' };
  }

  const resetToken = generateSecureToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepo.updateUser(user.id, {
    passwordResetToken: resetToken,
    passwordResetTokenExpiry: expiry,
  });

  await sendPasswordResetEmail(email, resetToken);

  return { message: 'If that email is registered, a reset link has been sent to your console.' };
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
