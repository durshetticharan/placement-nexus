import nodemailer from 'nodemailer';

// IMPORTANT: Do NOT create the transporter at module load time.
// Environment variables (SMTP_*) are read when the module loads,
// which may happen before dotenv has injected them.
// Use a lazy factory to guarantee credentials are read at send-time.
function createTransporter() {
  const missingVars: string[] = [];
  if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
  if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
  if (!process.env.SMTP_PASSWORD) missingVars.push('SMTP_PASSWORD');

  if (missingVars.length > 0) {
    throw Object.assign(
      new Error(`Email service is not configured. Missing environment variables: ${missingVars.join(', ')}`),
      { code: 'EMAIL_MISCONFIGURED', statusCode: 500 }
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const getMailFrom = () => process.env.MAIL_FROM || '"Placement Nexus" <no-reply@placementnexus.com>';

// ─── Send Email Verification Link ────────────────────────────────────────────

export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
  const mailOptions = {
    from: getMailFrom(),
    to: email,
    subject: 'Verify your Placement Nexus account',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Placement Nexus</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Your Career, Powered by Intelligence</p>
        </div>
        <div style="padding: 40px 32px; background: white;">
          <h2 style="color: #1e293b; font-size: 22px; margin: 0 0 16px; font-weight: 600;">Verify your email address</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Thank you for registering with Placement Nexus. Please click the button below to verify your email address and activate your account.
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
            This verification link will expire in <strong>30 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 0 0 32px;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
              Verify My Email
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            If the button does not work, copy and paste this link into your browser:<br/>
            <span style="color: #4f46e5; word-break: break-all;">${verificationUrl}</span>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            If you did not create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 20px 32px; background: #f8fafc; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; 2025 Placement Nexus. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    if (error.code === 'EMAIL_MISCONFIGURED') throw error;
    throw Object.assign(new Error('Unable to send verification email. Please try again.'), {
      code: 'EMAIL_DELIVERY_FAILED',
      statusCode: 500,
    });
  }
}

// ─── Send Password Reset Email ────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: getMailFrom(),
    to: email,
    subject: 'Placement Nexus Password Reset',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Placement Nexus</h1>
        </div>
        <div style="padding: 40px 32px; background: white;">
          <h2 style="color: #1e293b; font-size: 22px; margin: 0 0 16px; font-weight: 600;">Reset your password</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            You requested a password reset for your Placement Nexus account. Click the button below to set a new password.
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
            This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin: 0 0 32px;">
            <a href="${resetLink}" 
               style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
              Reset Password
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 20px 32px; background: #f8fafc; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; 2025 Placement Nexus. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    if (error.code === 'EMAIL_MISCONFIGURED') throw error;
    throw Object.assign(new Error('Unable to send password reset email. Please try again.'), {
      code: 'EMAIL_DELIVERY_FAILED',
      statusCode: 500,
    });
  }
}
