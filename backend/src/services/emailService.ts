/**
 * Email Service — Stub / Console Implementation
 *
 * In development: OTP and reset tokens are logged to console for local testing.
 * In production:  Replace this file's body with a real email provider
 *                 (Nodemailer + SMTP, AWS SES, SendGrid, etc.).
 *
 * The interface (function signatures) is stable — only this file changes.
 *
 * ⚠ PRODUCTION NOTE:
 *   OTPs and reset tokens must NOT be logged in production.
 *   Set NODE_ENV=production to suppress sensitive token output.
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
  if (isDevelopment) {
    console.log('\n📧 ─────────────────────────────────────────────');
    console.log(`   To:      ${email}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   OTP:     ${otp}`);
    console.log(`   Expires: 10 minutes from now`);
    console.log('────────────────────────────────────────────────\n');
  } else {
    // Production: integrate a real email provider here.
    // Example (Nodemailer):
    //   await transporter.sendMail({ to: email, subject: `${purpose} OTP`, text: `Your OTP: ${otp}` });
    console.info(`[email-service] OTP email dispatched to ${email} (purpose: ${purpose})`);
    // NOTE: Do NOT log the OTP value itself in production.
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  if (isDevelopment) {
    console.log('\n🔑 ─────────────────────────────────────────────');
    console.log(`   To:          ${email}`);
    console.log(`   Reset Token: ${resetToken}`);
    console.log(`   Expires:     1 hour from now`);
    console.log('────────────────────────────────────────────────\n');
  } else {
    // Production: send email with a reset link, e.g.:
    //   const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    //   await transporter.sendMail({ to: email, subject: 'Password Reset', html: `<a href="${resetLink}">Reset</a>` });
    console.info(`[email-service] Password reset email dispatched to ${email}`);
    // NOTE: Do NOT log the reset token value itself in production.
  }
}
