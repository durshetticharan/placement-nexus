import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import * as userRepo from '../repositories/user.repository';
import { generateOtp, generateSecureToken } from '../utils/otp';
import { sendOtpEmail, sendPasswordResetEmail } from './emailService';

const SALT_ROUNDS = 10;

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(email: string, password: string, role: UserRole) {
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

  await sendOtpEmail(email, otpCode, 'Email Verification');

  return { message: 'Registration successful. Please check your email (console) for the OTP.' };
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

  await userRepo.updateUser(user.id, {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    status: 'ACTIVE',
    otpCode: null,
    otpExpiresAt: null,
    otpPurpose: null,
  });

  return { message: 'Email verified successfully. You can now log in.' };
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
    throw Object.assign(
      new Error('Your email has not been verified. Please check your console for the OTP.'),
      { code: 'UNAUTHORIZED', statusCode: 401 }
    );
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
