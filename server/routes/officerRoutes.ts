import { Router } from 'express';
import {
  getOfficerDashboardQueues,
  verifyApplication,
  requestAdditionalDocuments,
  rejectApplication,
  approveApplication,
} from '../controllers/officerController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('OFFICER', 'ADMIN'));

router.get('/queues', getOfficerDashboardQueues);
router.post('/applications/:id/verify', verifyApplication);
router.post('/applications/:id/request-documents', requestAdditionalDocuments);
router.post('/applications/:id/reject', rejectApplication);
router.post('/applications/:id/approve', approveApplication);

export default router;
