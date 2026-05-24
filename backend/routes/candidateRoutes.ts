import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';
import { validateSourceCandidates } from '../middleware/validator';

const router = Router();

router.post('/source', validateSourceCandidates, candidateController.sourceCandidates);
router.get('/approved-queue', candidateController.getApprovedQueue);
router.get('/', candidateController.listCandidates);
router.get('/:id', candidateController.getCandidate);

export default router;
