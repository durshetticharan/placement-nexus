import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  validate,
  registerSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/auth.validation';

const router = Router();

// Public routes
router.post('/register',               validate(registerSchema),            authController.register);
router.get('/verify-email',                                                  authController.verifyEmail);
router.post('/resend-verification',    validate(resendVerificationSchema),   authController.resendVerification);
router.post('/login',                  validate(loginSchema),               authController.login);
router.post('/refresh-token',                                                authController.refreshTokenHandler);
router.post('/forgot-password',        validate(forgotPasswordSchema),      authController.forgotPassword);
router.post('/reset-password',         validate(resetPasswordSchema),       authController.resetPassword);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/me',      requireAuth, authController.getMe);

export default router;
