import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  /** True when SMTP isn't configured — the email was logged, not sent. */
  simulated: boolean;
}

/**
 * Email transport for Phase 5 outreach.
 *
 * If SMTP credentials are present we open a single persistent Nodemailer
 * connection (`createTransport` is reused across calls — Nodemailer pools).
 * Without creds we run in simulation mode: log the would-be email and return
 * `{ success: true, simulated: true }`. The controller treats either as a
 * successful dispatch from the campaign's perspective — the difference only
 * matters for the audit trail / banner.
 */

let _transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (_transport) return _transport;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  _transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // SSL/TLS on 465; STARTTLS on 587 / 25
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return _transport;
}

export const emailService = {
  isAvailable(): boolean {
    return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  },

  async sendEmail(params: SendEmailParams): Promise<SendResult> {
    const transport = getTransport();
    if (!transport) {
      console.warn(`[Email simulated] -> ${params.to} | ${params.subject}`);
      return { success: true, simulated: true };
    }

    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to: params.to,
      subject: params.subject,
      text: params.body,
      replyTo: params.replyTo,
    });

    return { success: true, simulated: false, messageId: info.messageId };
  },
};
