import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { googleAuthController } from '../controllers/googleAuthController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
// Google OAuth — kicks off the consent redirect. The callback lives at the
// top-level /api/callback (see server.ts) to match the OAuth client config.
router.get('/google', googleAuthController.start);
router.get('/me', authenticate, authController.me);
router.patch('/profile', authenticate, authController.updateProfile);

export default router;
