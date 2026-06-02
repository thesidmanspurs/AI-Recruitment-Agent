import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { decryptSecret } from '../../utils/crypto.js';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
}

export class EmailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailNotConfiguredError';
  }
}

/**
 * Per-user outreach email. There is NO shared mailbox — every recruiter
 * sends from their own Gmail (App Password / SMTP) or Resend (API + verified
 * domain). Outreach is blocked until the user has verified their config via
 * a successful test send.
 *
 * Credentials are decrypted from the User row at send time and never cached
 * in plaintext beyond the lifetime of the call.
 */

type UserEmailConfig = {
  emailProvider: 'GMAIL' | 'RESEND' | null;
  emailFromAddress: string | null;
  emailFromName: string | null;
  gmailAppPasswordEnc: string | null;
  resendApiKeyEnc: string | null;
};

function fromHeader(cfg: UserEmailConfig): string {
  const addr = cfg.emailFromAddress ?? '';
  return cfg.emailFromName ? `${cfg.emailFromName} <${addr}>` : addr;
}

async function sendViaGmail(cfg: UserEmailConfig, params: SendEmailParams): Promise<SendResult> {
  if (!cfg.gmailAppPasswordEnc || !cfg.emailFromAddress) {
    throw new EmailNotConfiguredError('Gmail is selected but not fully configured.');
  }
  const pass = decryptSecret(cfg.gmailAppPasswordEnc);
  // A fresh transport per send keeps user creds isolated (no shared pool).
  const transport = nodemailer.createTransport({
    host: env.GMAIL_SMTP_HOST,
    port: env.GMAIL_SMTP_PORT,
    secure: true, // 465 = implicit TLS
    auth: { user: cfg.emailFromAddress, pass },
  });
  const info = await transport.sendMail({
    from: fromHeader(cfg),
    to: params.to,
    subject: params.subject,
    text: params.body,
  });
  return { success: true, messageId: info.messageId };
}

async function sendViaResend(cfg: UserEmailConfig, params: SendEmailParams): Promise<SendResult> {
  if (!cfg.resendApiKeyEnc || !cfg.emailFromAddress) {
    throw new EmailNotConfiguredError('Resend is selected but not fully configured.');
  }
  const apiKey = decryptSecret(cfg.resendApiKeyEnc);
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: fromHeader(cfg),
    to: params.to,
    subject: params.subject,
    text: params.body,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message ?? JSON.stringify(error)}`);
  }
  return { success: true, messageId: data?.id };
}

export const emailService = {
  /** Whether a given user can send outreach (config present + verified). */
  async canUserSend(userId: string): Promise<boolean> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailProvider: true, emailVerifiedAt: true },
    });
    return !!(u?.emailProvider && u.emailVerifiedAt);
  },

  /**
   * Send using a user's configured provider. Throws EmailNotConfiguredError
   * if the user hasn't set up + verified an email — callers surface this as
   * a 400 so the recruiter is told to configure their email first.
   */
  async sendForUser(userId: string, params: SendEmailParams): Promise<SendResult> {
    const cfg = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailProvider: true,
        emailFromAddress: true,
        emailFromName: true,
        gmailAppPasswordEnc: true,
        resendApiKeyEnc: true,
        emailVerifiedAt: true,
      },
    });
    if (!cfg || !cfg.emailProvider) {
      throw new EmailNotConfiguredError(
        'You have not configured your outreach email yet. Open Email Settings to set up Gmail or Resend.'
      );
    }
    if (!cfg.emailVerifiedAt) {
      throw new EmailNotConfiguredError(
        'Your email is configured but not yet verified. Send a test email from Email Settings first.'
      );
    }
    return cfg.emailProvider === 'RESEND'
      ? sendViaResend(cfg, params)
      : sendViaGmail(cfg, params);
  },

  /**
   * Test send used by the verify flow — same as sendForUser but works with
   * a not-yet-verified config (the whole point is to verify it). Accepts the
   * raw (already-decrypted-on-input is not needed; we re-read from DB) config.
   */
  async testSendForUser(userId: string, to: string): Promise<SendResult> {
    const cfg = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailProvider: true,
        emailFromAddress: true,
        emailFromName: true,
        gmailAppPasswordEnc: true,
        resendApiKeyEnc: true,
      },
    });
    if (!cfg || !cfg.emailProvider) {
      throw new EmailNotConfiguredError('No email provider configured to test.');
    }
    const params: SendEmailParams = {
      to,
      subject: 'ARIES — test email ✓',
      body:
        'This is a test from ARIES confirming your outreach email is configured correctly.\n\n' +
        'If you received this, you can now send candidate outreach from your own address.\n\n' +
        '— ARIES',
    };
    return cfg.emailProvider === 'RESEND'
      ? sendViaResend(cfg, params)
      : sendViaGmail(cfg, params);
  },
};
