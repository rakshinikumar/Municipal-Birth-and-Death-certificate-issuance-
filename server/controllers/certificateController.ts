import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client.js';

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { regNumber } = req.params;

    if (!regNumber) {
      res.status(400).json({ success: false, message: 'Registration number is required for verification.' });
      return;
    }

    const certificate = await prisma.certificate.findUnique({
      where: { registrationNumber: regNumber },
      include: {
        application: {
          include: {
            birthDetails: true,
            deathDetails: true,
          },
        },
        digitalArchiveEntry: true,
      },
    });

    if (!certificate || !certificate.valid) {
      res.status(404).json({
        success: false,
        valid: false,
        message: 'No active or valid municipal record found for this registration number.',
      });
      return;
    }

    // Sanitize personal information as specified in Section 13
    const isBirth = certificate.certificateType === 'BIRTH';
    const fullName = isBirth
      ? certificate.application.birthDetails?.childName || ''
      : certificate.application.deathDetails?.deceasedName || '';

    const nameParts = fullName.split(' ');
    const maskedName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts.slice(1).map(p => p[0] + '***').join(' ')}`
      : fullName;

    res.json({
      success: true,
      valid: true,
      verificationData: {
        registrationNumber: certificate.registrationNumber,
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.certificateType,
        subjectMaskedName: maskedName,
        eventDate: isBirth ? certificate.application.birthDetails?.dateOfBirth : certificate.application.deathDetails?.dateOfDeath,
        issuingAuthority: certificate.issuingAuthority,
        registrarDesignation: certificate.registrarDesignation,
        issueDate: certificate.issueDate,
        digitalSignatureHash: certificate.digitalSignatureHash,
        status: certificate.digitalArchiveEntry?.status || 'ACTIVE',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      res.status(404).json({ success: false, message: 'Certificate record not found.' });
      return;
    }

    // Ensure path exists
    let absPath = certificate.pdfPath;
    if (absPath.startsWith('/uploads/')) {
      absPath = path.resolve(process.cwd(), '.' + absPath);
    }

    if (!fs.existsSync(absPath)) {
      res.status(404).json({ success: false, message: 'Certificate PDF document file not found on server.' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateType}_Certificate_${certificate.registrationNumber}.pdf"`);
    fs.createReadStream(absPath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
