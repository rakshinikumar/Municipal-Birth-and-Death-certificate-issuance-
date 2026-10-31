import { Router } from 'express';
import {
  getAdminDashboardStats,
  getAllUsers,
  createHospitalAccount,
  createOfficerAccount,
  toggleHospitalAuthorization,
  assignApplicationToOfficer,
  getAuditLogs,
} from '../controllers/adminController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/users', getAllUsers);
router.post('/hospitals', createHospitalAccount);
router.post('/officers', createOfficerAccount);
router.patch('/hospitals/:hospitalId/toggle-auth', toggleHospitalAuthorization);
router.post('/applications/:applicationId/assign', assignApplicationToOfficer);
router.get('/audit-logs', getAuditLogs);

export default router;
