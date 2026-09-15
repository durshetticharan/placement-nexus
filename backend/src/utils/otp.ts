import crypto from 'crypto';

export function generateOtp(): { code: string; expiresAt: Date } {
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  return { code, expiresAt };
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
