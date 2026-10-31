import { Router } from 'express';
import { getArchiveRecords, getArchiveRecordById } from '../controllers/archiveController.js';

const router = Router();

// Digital Archive query endpoints
router.get('/records', getArchiveRecords);
router.get('/records/:id', getArchiveRecordById);

export default router;
