import { Router } from 'express';
import { jobSpecController } from '../controllers/jobSpecController.js';
import { candidateController } from '../controllers/candidateController.js';
import { outreachController } from '../controllers/outreachController.js';

// All routes here are already protected by authenticate() mounted in server.ts
const router = Router();

// ── Campaign CRUD ─────────────────────────────────────────────────────────────
router.post('/', jobSpecController.createCampaign);
router.get('/', jobSpecController.listCampaigns);
router.get('/:id', jobSpecController.getCampaign);
router.put('/:id', jobSpecController.updateCampaign);
router.delete('/:id', jobSpecController.deleteCampaign);

// ── Candidates (scoped to campaign) ──────────────────────────────────────────
router.post('/:campaignId/candidates/source', candidateController.sourceCandidates);
router.post('/:campaignId/candidates/from-linkedin', candidateController.addFromLinkedIn);
router.delete('/:campaignId/candidates', candidateController.resetCandidates);
router.get('/:campaignId/candidates', candidateController.listCandidates);
router.get('/:campaignId/candidates/approved', candidateController.getApprovedQueue);
router.get('/:campaignId/candidates/below-threshold', candidateController.getBelowThreshold);
router.get('/:campaignId/candidates/:id', candidateController.getCandidate);

// ── Outreach (scoped to campaign) ─────────────────────────────────────────────
router.post('/:campaignId/outreach/enrich/:candidateId', outreachController.enrichCandidate);
router.post('/:campaignId/outreach/send/:candidateId', outreachController.sendOutreach);
router.post('/:campaignId/outreach/mark-replied/:candidateId', outreachController.markReplied);
router.post('/:campaignId/outreach/generate-message', outreachController.generateMessage);
router.get('/:campaignId/outreach/alerts', outreachController.getAlerts);
router.get('/:campaignId/outreach/activity', outreachController.getActivityLog);

export default router;
