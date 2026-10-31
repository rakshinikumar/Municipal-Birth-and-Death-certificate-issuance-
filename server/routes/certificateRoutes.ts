import { Router } from 'express';
import { verifyCertificate, downloadCertificate } from '../controllers/certificateController.js';

const router = Router();

// Public QR Code and Registration Number Verification
router.get('/verify/:regNumber', verifyCertificate);

// Certificate PDF Download
router.get('/download/:id', downloadCertificate);

export default router;
