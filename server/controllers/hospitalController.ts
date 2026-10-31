import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma/client.js';
import { logAudit } from '../services/auditService.js';

export const getHospitalDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const hospital = await prisma.hospital.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    if (!hospital) {
      res.status(403).json({ success: false, message: 'Hospital profile not found.' });
      return;
    }

    const totalReports = await prisma.hospitalReport.count({ where: { hospitalId: hospital.id } });
    const birthReports = await prisma.hospitalReport.count({ where: { hospitalId: hospital.id, reportType: 'BIRTH' } });
    const deathReports = await prisma.hospitalReport.count({ where: { hospitalId: hospital.id, reportType: 'DEATH' } });
    const pendingConfirmations = await prisma.hospitalReport.count({
      where: { hospitalId: hospital.id, status: 'PENDING_CONFIRMATION' },
    });

    // Recent reports
    const recentReports = await prisma.hospitalReport.findMany({
      where: { hospitalId: hospital.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      hospital,
      stats: {
        totalReports,
        birthReports,
        deathReports,
        pendingConfirmations,
      },
      recentReports,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitHospitalReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const hospital = await prisma.hospital.findUnique({ where: { userId: user.id } });
    if (!hospital) {
      res.status(403).json({ success: false, message: 'Unauthorized hospital account.' });
      return;
    }

    const {
      reportType,
      hospitalRegistrationNo,
      childOrDeceasedName,
      eventDate,
      gender,
      placeOfEvent,
      fatherName,
      motherName,
      spouseName,
      causeOfDeath,
      informantName,
      doctorName,
      medicalSummary,
    } = req.body;

    const file = req.file as Express.Multer.File | undefined;

    if (!reportType || !hospitalRegistrationNo || !childOrDeceasedName || !eventDate) {
      res.status(400).json({ success: false, message: 'Missing required report fields.' });
      return;
    }

    const existingReport = await prisma.hospitalReport.findUnique({
      where: { hospitalRegistrationNo },
    });
    if (existingReport) {
      res.status(400).json({ success: false, message: 'A report with this Hospital Registration Number already exists.' });
      return;
    }

    const report = await prisma.hospitalReport.create({
      data: {
        reportType,
        hospitalId: hospital.id,
        hospitalRegistrationNo,
        childOrDeceasedName,
        eventDate: new Date(eventDate),
        gender,
        placeOfEvent: placeOfEvent || hospital.hospitalName,
        fatherName: fatherName || null,
        motherName: motherName || null,
        spouseName: spouseName || null,
        causeOfDeath: causeOfDeath || null,
        informantName: informantName || null,
        doctorName: doctorName || null,
        medicalSummary: medicalSummary || null,
        documentUrl: file ? `/uploads/${file.filename}` : null,
        status: 'SUBMITTED',
      },
    });

    await logAudit({
      userId: user.id,
      action: 'HOSPITAL_REPORT_SUBMISSION',
      entityType: 'HospitalReport',
      entityId: report.id,
      details: { reportType, hospitalRegistrationNo, hospitalName: hospital.hospitalName },
    });

    res.status(201).json({
      success: true,
      message: 'Official hospital record recorded successfully in the municipal database.',
      report,
    });
  } catch (error: any) {
    console.error('Hospital report submission error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error recording hospital report.' });
  }
};

export const getHospitalReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const hospital = await prisma.hospital.findUnique({ where: { userId: user.id } });
    if (!hospital) {
      res.status(403).json({ success: false, message: 'Unauthorized hospital account.' });
      return;
    }

    const { type, search } = req.query;
    const where: any = { hospitalId: hospital.id };
    if (type && (type === 'BIRTH' || type === 'DEATH')) {
      where.reportType = type;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { childOrDeceasedName: { contains: search } },
        { hospitalRegistrationNo: { contains: search } },
        { doctorName: { contains: search } },
      ];
    }

    const reports = await prisma.hospitalReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToVerificationRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const { confirmationStatus, remarks } = req.body;
    const user = req.user!;

    const report = await prisma.hospitalReport.update({
      where: { id: reportId },
      data: {
        status: confirmationStatus || 'VERIFIED',
        medicalSummary: remarks ? `${remarks}` : undefined,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'HOSPITAL_VERIFICATION_RESPONSE',
      entityType: 'HospitalReport',
      entityId: report.id,
      details: { confirmationStatus, remarks },
    });

    res.json({ success: true, message: 'Verification response dispatched to Municipal Corporation.', report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
