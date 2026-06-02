import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';

const router = Router();

router.get('/stats', adminController.getStats);
router.get('/hot-campaigns', adminController.getHotCampaigns);
router.get('/activity', adminController.getSystemActivity);
router.get('/funnel', adminController.getPipelineFunnel);
router.get('/platforms', adminController.getPlatformBreakdown);
router.get('/score-distribution', adminController.getScoreDistribution);
router.get('/recent-signups', adminController.getRecentSignups);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.get('/users/:userId', adminController.getUserBehavior);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/role', adminController.setRole);
router.put('/users/:userId/blocked', adminController.setBlocked);
router.put('/users/:userId/password', adminController.resetPassword);
router.get('/settings', adminController.listSettings);
router.put('/settings/:key', adminController.updateSetting);

router.get('/email-requests', adminController.listEmailRequests);
router.post('/email-config', adminController.configureUserEmail);
router.post('/users/:userId/email-test', adminController.testUserEmail);

export default router;
