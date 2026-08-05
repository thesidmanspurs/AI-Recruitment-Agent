import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { createError } from '../../middleware/errorHandler.js';

export const passwordResetService = {
  /**
   * Send a password reset link to the user's email via SMTP.
   */
  async forgotPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Always report success to prevent user enumeration attacks
    if (!user) return;

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${token}`;

    const cleanPass = (env.SMTP_PASS || '').replace(/\s+/g, '');
    const isGmail = (env.SMTP_HOST || '').includes('gmail') || (env.SMTP_USER || '').endsWith('@gmail.com');

    // Send email using SMTP config from .env (auto-format Gmail App Password)
    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: env.SMTP_USER,
              pass: cleanPass,
            },
          }
        : {
            host: env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(env.SMTP_PORT) || 587,
            secure: Number(env.SMTP_PORT) === 465,
            auth: {
              user: env.SMTP_USER,
              pass: cleanPass,
            },
          }
    );

    const mailOptions = {
      from: `"TalentScanr Support" <${env.SMTP_FROM || env.SMTP_USER}>`,
      to: cleanEmail,
      subject: 'Reset your TalentScanr Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #111827; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.5;">Hello ${user.name || 'there'},</p>
          <p style="color: #4b5563; line-height: 1.5;">We received a request to reset your password for your TalentScanr account. Click the button below to reset it. This link is valid for 1 hour.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">TalentScanr AI Recruitment Platform</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[PasswordReset] Reset email sent successfully to ${cleanEmail}`);
    } catch (err: any) {
      console.error('[PasswordReset] Failed to send email:', err?.message || err);
      throw createError(`Failed to send password reset email: ${err?.message || 'SMTP Error'}`, 500);
    }
  },

  /**
   * Verify token and update user password.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token?.trim() || !newPassword || newPassword.length < 8) {
      throw createError('Valid token and password of at least 8 characters are required.', 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token.trim(),
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw createError('Password reset token is invalid or has expired.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    console.log(`[PasswordReset] ✅ Password updated for user ${user.email}`);
  },
};
