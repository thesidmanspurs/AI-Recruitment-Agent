import { Router } from 'express';
import { usageController } from '../controllers/usageController.js';

const router = Router();
router.get('/me', usageController.me);
export default router;
