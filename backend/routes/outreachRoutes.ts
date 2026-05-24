import { Router } from 'express';
import { outreachController } from '../controllers/outreachController';
import { validateEnrichment, validateGenerateMessage } from '../middleware/validator';

const router = Router();

router.post('/enrich', validateEnrichment, outreachController.enrichCandidate);
router.post('/send', outreachController.sendOutreach);
router.post('/generate-message', validateGenerateMessage, outreachController.generateMessage);
router.get('/alerts', outreachController.getAlerts);
router.get('/activity', outreachController.getActivityLog);

export default router;
