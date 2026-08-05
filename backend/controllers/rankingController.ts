import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createError } from '../middleware/errorHandler.js';
import { rankingSessionService } from '../services/ranking/rankingSessionService.js';

// ─── Multer config (memory only, CV files) ────────────────────────────────────
// Files are kept in-memory just long enough to extract text and never written
// to disk. 10 MB per file, max 50 files per batch.
export const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 50 },
  fileFilter(_req, file, cb) {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      return cb(new Error(`"${file.originalname}" is not a PDF or DOCX file.`));
    }
    cb(null, true);
  },
});

export const rankingController = {
  /**
   * POST /api/ranking/sessions
   * Create a new ranking session (sets up the JD context for this batch run).
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, jobTitle, rawJobText } = req.body as {
        name?: string;
        jobTitle?: string;
        rawJobText?: string;
      };
      if (!name?.trim()) return next(createError('name is required.', 400));
      if (!jobTitle?.trim()) return next(createError('jobTitle is required.', 400));
      if (!rawJobText?.trim() || rawJobText.trim().length < 50)
        return next(createError('rawJobText must be at least 50 characters.', 400));

      const session = await rankingSessionService.createSession(
        req.user!.id,
        name.trim(),
        jobTitle.trim(),
        rawJobText.trim(),
      );
      res.status(201).json({ success: true, session });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/ranking/sessions
   * List all ranking sessions for the authenticated user.
   */
  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await rankingSessionService.listSessions(req.user!.id);
      res.json({ success: true, sessions });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/ranking/sessions/:id
   * Get a session with its full candidate list.
   */
  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await rankingSessionService.getSession(
        req.params.id,
        req.user!.id,
      );
      if (!session) return next(createError('Session not found.', 404));
      res.json({ success: true, session });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/ranking/sessions/:id
   * Delete a session and all its ranked candidates.
   */
  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await rankingSessionService.deleteSession(
        req.params.id,
        req.user!.id,
      );
      if (!deleted) return next(createError('Session not found.', 404));
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/ranking/sessions/:id/upload
   * Upload a batch of CV files, process them, and return ranked results.
   *
   * Multer is applied as inline middleware in the route definition so the
   * controller can handle multer errors cleanly via errorHandler.
   */
  async uploadCVs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return next(createError('At least one PDF or DOCX file is required.', 400));
      }

      const result = await rankingSessionService.processBatch(
        req.params.id,
        req.user!.id,
        files.map(f => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          buffer: f.buffer,
          size: f.size,
        })),
      );

      res.json({
        success: true,
        session: result.session,
        candidates: result.candidates,
        errors: result.errors,
        summary: {
          submitted: files.length,
          successful: result.candidates.length,
          failed: result.errors.length,
          saved: result.candidates.filter(c => c.isSaved).length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/ranking/sessions/:id/candidates
   * Get only the persisted (top 50%) candidates for a session.
   */
  async getSavedCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidates = await rankingSessionService.getSavedCandidates(
        req.params.id,
        req.user!.id,
      );
      if (candidates === null) return next(createError('Session not found.', 404));
      res.json({ success: true, candidates });
    } catch (err) {
      next(err);
    }
  },
};
