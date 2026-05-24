import { Router } from 'express';
import { webhookController } from '../controllers/webhookController.js';

/**
 * Public webhook routes — no JWT auth, guarded by per-route shared secrets.
 * Mounted at /api/webhooks in server.ts.
 */
const router = Router();

router.post('/apollo', webhookController.apolloPhoneReveal);

export default router;
