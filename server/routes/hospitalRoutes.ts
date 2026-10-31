import { Router } from 'express';
import {
  getHospitalDashboard,
  submitHospitalReport,
  getHospitalReports,
  respondToVerificationRequest,
} from '../controllers/hospitalController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('HOSPITAL', 'ADMIN'));

router.get('/dashboard', getHospitalDashboard);
router.post('/reports', upload.single('document'), submitHospitalReport);
router.get('/reports', getHospitalReports);
router.patch('/reports/:reportId/verify', respondToVerificationRequest);

export default router;
