import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { encryptSecret, isEncryptionAvailable } from '../utils/crypto.js';
import { emailService, EmailNotConfiguredError } from '../services/outreach/emailService.js';

/**
 * Per-user outreach email configuration endpoints.
 *
 * GET  /api/email-settings        — masked view of the current config
 * PUT  /api/email-settings        — save provider + from-address + credential
 * POST /api/email-settings/test   — send a test email; on success marks verified
 * DELETE /api/email-settings      — clear config (stops the user sending)
 *
 * Credentials are encrypted (AES-256-GCM) before persistence and NEVER
 * returned to the client — the GET only reports whether each credential is
 * present plus the from-address/name and verification timestamp.
 */
export const emailSettingsController = {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const u = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          emailProvider: true,
          emailFromAddress: true,
          emailFromName: true,
          gmailAppPasswordEnc: true,
          resendApiKeyEnc: true,
          emailVerifiedAt: true,
        },
      });
      if (!u) return next(createError('User not found.', 404));
      res.json({
        success: true,
        settings: {
          provider: u.emailProvider,
          fromAddress: u.emailFromAddress,
          fromName: u.emailFromName,
          gmailConfigured: !!u.gmailAppPasswordEnc,
          resendConfigured: !!u.resendApiKeyEnc,
          verifiedAt: u.emailVerifiedAt,
          canSend: !!(u.emailProvider && u.emailVerifiedAt),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isEncryptionAvailable()) {
        return next(createError('Server encryption is not configured (ENCRYPTION_KEY missing).', 500));
      }
      const { provider, fromAddress, fromName, gmailAppPassword, resendApiKey } = req.body as {
        provider?: 'GMAIL' | 'RESEND';
        fromAddress?: string;
        fromName?: string;
        gmailAppPassword?: string;
        resendApiKey?: string;
      };

      // Resend is admin-configured only — users can't self-set a Resend key.
      // They submit a request (see submitResendRequest) and an admin sets it up.
      if (provider === 'RESEND') {
        return next(
          createError(
            'Resend is configured by an admin. Submit a Resend setup request instead.',
            400
          )
        );
      }
      if (provider !== 'GMAIL') {
        return next(createError('provider must be GMAIL.', 400));
      }
      if (!fromAddress || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromAddress.trim())) {
        return next(createError('A valid fromAddress email is required.', 400));
      }

      // Changing config invalidates prior verification — the user must
      // re-run the test send before they can send outreach again.
      const data: Record<string, unknown> = {
        emailProvider: provider,
        emailFromAddress: fromAddress.trim(),
        emailFromName: fromName?.trim() || null,
        emailVerifiedAt: null,
      };

      if (provider === 'GMAIL') {
        if (gmailAppPassword && gmailAppPassword.trim()) {
          // Gmail app passwords are shown with spaces; strip them.
          data.gmailAppPasswordEnc = encryptSecret(gmailAppPassword.replace(/\s+/g, ''));
        } else {
          // Allow updating from-name without resending the password, but
          // only if one already exists.
          const existing = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { gmailAppPasswordEnc: true },
          });
          if (!existing?.gmailAppPasswordEnc) {
            return next(createError('gmailAppPassword is required for Gmail setup.', 400));
          }
        }
      } else {
        if (resendApiKey && resendApiKey.trim()) {
          data.resendApiKeyEnc = encryptSecret(resendApiKey.trim());
        } else {
          const existing = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { resendApiKeyEnc: true },
          });
          if (!existing?.resendApiKeyEnc) {
            return next(createError('resendApiKey is required for Resend setup.', 400));
          }
        }
      }

      await prisma.user.update({ where: { id: req.user!.id }, data });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async test(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const u = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { email: true, emailFromAddress: true },
      });
      // Send the test to the user's own login email by default, or to the
      // from-address they configured.
      const to = (req.body?.to as string) || u?.emailFromAddress || u?.email;
      if (!to) return next(createError('No destination address available for the test.', 400));

      try {
        const r = await emailService.testSendForUser(req.user!.id, to);
        // Mark verified on success.
        await prisma.user.update({
          where: { id: req.user!.id },
          data: { emailVerifiedAt: new Date() },
        });
        res.json({ success: true, messageId: r.messageId, sentTo: to });
      } catch (err) {
        if (err instanceof EmailNotConfiguredError) {
          return next(createError(err.message, 400));
        }
        // Surface the provider's real error (bad app password, unverified
        // Resend domain, etc.) so the user can fix it.
        return next(
          createError(
            `Test send failed: ${err instanceof Error ? err.message : String(err)}`,
            502
          )
        );
      }
    } catch (err) {
      next(err);
    }
  },

  async clear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          emailProvider: null,
          emailFromAddress: null,
          emailFromName: null,
          gmailAppPasswordEnc: null,
          resendApiKeyEnc: null,
          emailVerifiedAt: null,
        },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // ── Resend setup requests (user submits, admin fulfils) ────────────────
  async submitResendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contactName, whatsapp, emailAccount, domain } = req.body as {
        contactName?: string;
        whatsapp?: string;
        emailAccount?: string;
        domain?: string;
      };
      if (!contactName?.trim() || !whatsapp?.trim() || !emailAccount?.trim() || !domain?.trim()) {
        return next(createError('contactName, whatsapp, emailAccount and domain are all required.', 400));
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailAccount.trim())) {
        return next(createError('emailAccount must be a valid email.', 400));
      }
      // One open request per user — replace any existing PENDING one.
      await prisma.emailRequest.deleteMany({
        where: { userId: req.user!.id, status: 'PENDING' },
      });
      const reqRow = await prisma.emailRequest.create({
        data: {
          userId: req.user!.id,
          contactName: contactName.trim(),
          whatsapp: whatsapp.trim(),
          emailAccount: emailAccount.trim(),
          domain: domain.trim(),
        },
      });
      res.status(201).json({ success: true, request: { id: reqRow.id, status: reqRow.status } });
    } catch (err) {
      next(err);
    }
  },

  // Returns the user's latest Resend request (if any) so the UI can show
  // "pending" / "configured" state.
  async myResendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await prisma.emailRequest.findFirst({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, emailAccount: true, domain: true, createdAt: true, handledAt: true, adminNote: true },
      });
      res.json({ success: true, request: r });
    } catch (err) {
      next(err);
    }
  },
};
