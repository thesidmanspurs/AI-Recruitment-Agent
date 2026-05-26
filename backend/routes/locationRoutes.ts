import { Router } from 'express';
import { locationController } from '../controllers/locationController.js';

const router = Router();
router.get('/search', locationController.search);
export default router;
