import { Router } from 'express';
import { jobSpecController } from '../controllers/jobSpecController';
import { validateAnalyzeJobSpec } from '../middleware/validator';

const router = Router();

router.post('/analyze', validateAnalyzeJobSpec, jobSpecController.analyzeJobSpec);
router.get('/', jobSpecController.listJobSpecs);
router.get('/:id', jobSpecController.getJobSpec);

export default router;
