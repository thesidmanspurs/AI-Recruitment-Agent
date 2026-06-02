import { Router } from 'express';
import { emailSettingsController } from '../controllers/emailSettingsController.js';

const router = Router();
router.get('/', emailSettingsController.get);
router.put('/', emailSettingsController.update);
router.post('/test', emailSettingsController.test);
router.delete('/', emailSettingsController.clear);
export default router;
