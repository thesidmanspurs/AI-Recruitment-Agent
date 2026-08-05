import { Router } from 'express';
import { rankingController, cvUpload } from '../controllers/rankingController.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * CV Ranking routes — all protected by authenticate() + requireRankingAccess()
 * mounted in server.ts. These routes are completely separate from the
 * Sourcing campaign pipeline.
 */
const router = Router();

// Session lifecycle
router.post('/', rankingController.createSession);
router.get('/', rankingController.listSessions);
router.get('/:id', rankingController.getSession);
router.delete('/:id', rankingController.deleteSession);

// CV upload + ranking (multer applied inline so we can catch multer errors)
router.post(
  '/:id/upload',
  (req, res, next) => {
    cvUpload.array('files')(req, res, err => {
      if (err) return next(createError(err.message, 400));
      next();
    });
  },
  rankingController.uploadCVs,
);

// Saved candidates (persisted top 50%)
router.get('/:id/candidates', rankingController.getSavedCandidates);

export default router;
