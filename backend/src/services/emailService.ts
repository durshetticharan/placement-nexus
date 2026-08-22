/**
 * Email Service — Stub Implementation
 *
 * Currently logs emails to console. To switch to a real provider
 * (Nodemailer, SendGrid, AWS SES, etc.), only this file needs to change.
 * The interface remains the same for all callers.
 */

export async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
  console.log('\n📧 ─────────────────────────────────────────────');
  console.log(`   To:      ${email}`);
  console.log(`   Purpose: ${purpose}`);
  console.log(`   OTP:     ${otp}`);
  console.log(`   Expires: 10 minutes from now`);
  console.log('────────────────────────────────────────────────\n');
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  console.log('\n🔑 ─────────────────────────────────────────────');
  console.log(`   To:          ${email}`);
  console.log(`   Reset Token: ${resetToken}`);
  console.log(`   Expires:     1 hour from now`);
  console.log('────────────────────────────────────────────────\n');
}
