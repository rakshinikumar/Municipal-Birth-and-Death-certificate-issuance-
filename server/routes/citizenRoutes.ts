import { Router } from 'express';
import {
  submitBirthApplication,
  submitDeathApplication,
  getMyApplications,
  getApplicationById,
  resubmitDocuments,
  getNotifications,
  markNotificationRead,
} from '../controllers/citizenController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

// Citizen application submissions
router.post('/birth-application', requireRoles('CITIZEN'), upload.any(), submitBirthApplication);
router.post('/death-application', requireRoles('CITIZEN'), upload.any(), submitDeathApplication);
router.get('/my-applications', requireRoles('CITIZEN'), getMyApplications);
router.get('/applications/:id', getApplicationById);
router.post('/applications/:id/resubmit', requireRoles('CITIZEN'), upload.any(), resubmitDocuments);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
