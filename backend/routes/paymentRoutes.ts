import { Router } from 'express';
import { paymentsController } from '../controllers/paymentsController.js';

/**
 * Authenticated payment/credit routes. Mounted at /api/payments behind the JWT
 * middleware in server.ts. The Stripe WEBHOOK is NOT here — it's public and
 * needs the raw body, so it's mounted separately in server.ts before json().
 */
const router = Router();
router.get('/packages', paymentsController.packages);
router.get('/balance', paymentsController.balance);
router.post('/create-checkout', paymentsController.createCheckout);
router.get('/verify-session', paymentsController.verifySession);
router.get('/history', paymentsController.history);
router.post('/create-portal-session', paymentsController.createPortalSession);
export default router;
