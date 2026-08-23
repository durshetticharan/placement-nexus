import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  // secure: true  // Uncomment in production (HTTPS only)
};

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const {
      email,
      password,
      role,
      // Student fields
      fullName,
      rollNumber,
      // Recruiter fields
      designation,
      companyName,
      // Alumni fields
      degree,
      branch,
      graduationYear,
      collegeName,
    } = req.body;

    const result = await authService.register(email, password, role, {
      fullName,
      rollNumber,
      designation,
      companyName,
      degree,
      branch,
      graduationYear,
      collegeName,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otpCode } = req.body;
    const result = await authService.verifyOtp(email, otpCode);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(email, password);

    // Set refresh token in httpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      data: { accessToken, user },
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!oldRefreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token found in cookie.' },
      });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(oldRefreshToken);

    // Rotate the cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ success: true, data: { accessToken } });
  } catch (err: any) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await authService.logout(userId);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await authService.resetPassword(resetToken, newPassword);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export function getMe(req: Request, res: Response): void {
  res.json({ success: true, data: req.user });
}
