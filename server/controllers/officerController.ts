import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma/client.js';
import { generateCertificatePDF } from '../services/pdfService.js';
import { sendNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

export const getOfficerDashboardQueues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, queue, type, search, page = '1', limit = '15' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * pageSize;

    // Build filter based on requested queue
    const where: any = {};

    if (queue === 'hospital-matched') {
      where.status = 'HOSPITAL_MATCHED';
    } else if (queue === 'manual-verification') {
      where.status = { in: ['HOSPITAL_NOT_MATCHED', 'MANUAL_VERIFICATION'] };
    } else if (queue === 'pending') {
      where.status = { in: ['SUBMITTED', 'UNDER_REVIEW'] };
    } else if (queue === 'docs-requested') {
      where.status = 'DOCUMENTS_REQUESTED';
    } else if (queue === 'resubmitted') {
      where.status = 'RESUBMITTED';
    } else if (queue === 'duplicates') {
      // Applications with potential duplicate records detected
      where.duplicateRecords = { some: {} };
    } else if (queue === 'approved') {
      where.status = 'APPROVED';
    } else if (queue === 'rejected') {
      where.status = 'REJECTED';
    } else if (status) {
      where.status = status as string;
    }

    if (type && (type === 'BIRTH' || type === 'DEATH')) {
      where.applicationType = type;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { applicationNumber: { contains: search } },
        { birthDetails: { childName: { contains: search } } },
        { deathDetails: { deceasedName: { contains: search } } },
        { citizen: { user: { name: { contains: search } } } },
      ];
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          citizen: { include: { user: { select: { name: true, email: true, phone: true } } } },
          birthDetails: true,
          deathDetails: true,
          hospitalMatchedRecord: { include: { hospital: true } },
          documents: { include: { ocrResult: true } },
          duplicateRecords: true,
          certificate: true,
          documentRequests: { orderBy: { requestDate: 'desc' }, take: 1 },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    // Statistics for all queues
    const [
      hospitalMatchedCount,
      manualVerificationCount,
      pendingCount,
      docsRequestedCount,
      resubmittedCount,
      duplicatesCount,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      prisma.application.count({ where: { status: 'HOSPITAL_MATCHED' } }),
      prisma.application.count({ where: { status: { in: ['HOSPITAL_NOT_MATCHED', 'MANUAL_VERIFICATION'] } } }),
      prisma.application.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.application.count({ where: { status: 'DOCUMENTS_REQUESTED' } }),
      prisma.application.count({ where: { status: 'RESUBMITTED' } }),
      prisma.application.count({ where: { duplicateRecords: { some: {} } } }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({
      success: true,
      queues: {
        hospitalMatchedCount,
        manualVerificationCount,
        pendingCount,
        docsRequestedCount,
        resubmittedCount,
        duplicatesCount,
        approvedCount,
        rejectedCount,
      },
      pagination: {
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      applications,
    });
  } catch (error: any) {
    console.error('Officer queues error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks, verificationType = 'DOCUMENTARY', outcome = 'VERIFIED_OK' } = req.body;
    const user = req.user!;
    const officer = await prisma.officer.findUnique({ where: { userId: user.id } });

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Record verification record
    await prisma.verificationRecord.create({
      data: {
        applicationId: id,
        officerId: officer?.id || null,
        verificationType,
        remarks: remarks || 'Officer verified evidentiary documents and database matching logs.',
        outcome,
      },
    });

    // Update status to UNDER_REVIEW
    await prisma.application.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW',
        assignedOfficerId: officer?.id || null,
        officerRemarks: remarks,
        statusHistory: {
          create: {
            previousStatus: application.status,
            newStatus: 'UNDER_REVIEW',
            changedById: user.id,
            changeReason: 'Officer Verification Initiated',
            remarks: remarks || `Verification conducted by Officer ${officer?.officerCode || user.name}.`,
          },
        },
      },
    });

    await logAudit({
      userId: user.id,
      action: 'OFFICER_VERIFICATION_LOGGED',
      entityType: 'Application',
      entityId: id,
      details: { verificationType, outcome, remarks },
    });

    res.json({ success: true, message: 'Verification record saved. Application marked Under Review.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestAdditionalDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { requestedDocuments, remarks } = req.body;
    const user = req.user!;
    const officer = await prisma.officer.findUnique({ where: { userId: user.id } });

    if (!requestedDocuments || !remarks) {
      res.status(400).json({ success: false, message: 'Please specify the missing document names and remarks.' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { citizen: { include: { user: true } } },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Create document request
    await prisma.additionalDocumentRequest.create({
      data: {
        applicationId: id,
        officerId: officer?.id || '',
        requestedDocuments,
        remarks,
        status: 'PENDING',
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id },
      data: {
        status: 'DOCUMENTS_REQUESTED',
        officerRemarks: `Additional documents requested: ${requestedDocuments}. Remarks: ${remarks}`,
        statusHistory: {
          create: {
            previousStatus: application.status,
            newStatus: 'DOCUMENTS_REQUESTED',
            changedById: user.id,
            changeReason: 'Additional Documents Required',
            remarks: `Missing: ${requestedDocuments}. ${remarks}`,
          },
        },
      },
    });

    // Notify citizen
    await sendNotification({
      userId: application.citizen.userId,
      title: 'Action Required: Additional Documents Requested',
      message: `The Municipal Officer reviewing your application ${application.applicationNumber} has requested: ${requestedDocuments}. Remarks: ${remarks}`,
      type: 'DOCUMENT_REQUEST',
      link: `/applications/${application.id}`,
      userEmail: application.citizen.user.email,
    });

    await logAudit({
      userId: user.id,
      action: 'OFFICER_DOCUMENTS_REQUESTED',
      entityType: 'Application',
      entityId: id,
      details: { requestedDocuments, remarks },
    });

    res.json({ success: true, message: 'Additional documents requested. Citizen has been notified.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const user = req.user!;
    const officer = await prisma.officer.findUnique({ where: { userId: user.id } });

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      res.status(400).json({ success: false, message: 'A comprehensive rejection reason is mandatory (min 5 characters).' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { citizen: { include: { user: true } } },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Update application to REJECTED
    await prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedDate: new Date(),
        rejectionReason,
        assignedOfficerId: officer?.id || null,
        statusHistory: {
          create: {
            previousStatus: application.status,
            newStatus: 'REJECTED',
            changedById: user.id,
            changeReason: 'Municipal Officer Rejection',
            remarks: rejectionReason,
          },
        },
      },
    });

    // Notify citizen
    await sendNotification({
      userId: application.citizen.userId,
      title: 'Application Rejected',
      message: `Your application ${application.applicationNumber} was not approved by the Municipal Registrar. Reason: ${rejectionReason}`,
      type: 'REJECTION',
      link: `/applications/${application.id}`,
      userEmail: application.citizen.user.email,
    });

    await logAudit({
      userId: user.id,
      action: 'OFFICER_APPLICATION_REJECTED',
      entityType: 'Application',
      entityId: id,
      details: { officerId: officer?.id, rejectionReason },
    });

    res.json({ success: true, message: 'Application rejected and citizen notified. Certificate generation disabled.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const user = req.user!;
    const officer = await prisma.officer.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        citizen: { include: { user: true } },
        birthDetails: true,
        deathDetails: true,
        hospitalMatchedRecord: { include: { hospital: true } },
        certificate: true,
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    if (application.status === 'APPROVED' && application.certificate) {
      res.status(400).json({ success: false, message: 'Application is already approved and certificate generated.' });
      return;
    }

    const isBirth = application.applicationType === 'BIRTH';
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const regPrefix = isBirth ? 'MC-BRT' : 'MC-DTH';
    const registrationNumber = `${regPrefix}-${year}-${randomSuffix}`;
    const certificateNumber = `CERT-VITAL-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

    const subjectName = isBirth
      ? application.birthDetails?.childName || 'Recorded Child'
      : application.deathDetails?.deceasedName || 'Recorded Deceased';

    const eventDate = isBirth
      ? application.birthDetails?.dateOfBirth || new Date()
      : application.deathDetails?.dateOfDeath || new Date();

    const placeOfEvent = isBirth
      ? application.birthDetails?.placeOfBirth || 'Elmwood Municipal Limits'
      : application.deathDetails?.placeOfDeath || 'Elmwood Municipal Limits';

    const gender = isBirth
      ? application.birthDetails?.gender || 'Not specified'
      : application.deathDetails?.gender || 'Not specified';

    // 1. Generate Official PDF and QR Code
    const pdfResult = await generateCertificatePDF({
      certificateType: application.applicationType as 'BIRTH' | 'DEATH',
      registrationNumber,
      certificateNumber,
      issueDate: new Date(),
      subjectName,
      eventDate,
      timeOfEvent: isBirth ? application.birthDetails?.timeOfBirth || undefined : application.deathDetails?.timeOfDeath || undefined,
      gender,
      placeOfEvent,
      hospitalName: isBirth ? application.birthDetails?.hospitalName || undefined : application.deathDetails?.hospitalName || undefined,
      fatherName: isBirth ? application.birthDetails?.fatherName || undefined : application.deathDetails?.fatherOrSpouseName || undefined,
      motherName: isBirth ? application.birthDetails?.motherName || undefined : application.deathDetails?.motherName || undefined,
      spouseName: !isBirth ? application.deathDetails?.spouseName || undefined : undefined,
      causeOfDeath: !isBirth ? application.deathDetails?.causeOfDeath || undefined : undefined,
      permanentAddress: isBirth ? application.birthDetails?.permanentAddress : application.deathDetails?.permanentAddress,
      registrarName: user.name || 'Hon. Arthur Vance, IAS',
      registrarDesignation: officer?.designation || 'Executive Municipal Registrar & Commissioner',
    });

    // 2. Save Certificate in DB & Digital Archive entry
    const certificate = await prisma.certificate.create({
      data: {
        registrationNumber,
        certificateNumber,
        applicationId: application.id,
        certificateType: application.applicationType,
        issueDate: new Date(),
        issuingAuthority: 'Department of Vital Statistics, Metropolitan Municipal Corporation',
        registrarName: user.name || 'Chief Registrar',
        registrarDesignation: officer?.designation || 'Executive Municipal Registrar',
        pdfPath: pdfResult.relativeUrl,
        qrCodeData: pdfResult.qrCodeData,
        digitalSignatureHash: pdfResult.digitalSignatureHash,
        valid: true,
        digitalArchiveEntry: {
          create: {
            registrationNumber,
            certificateType: application.applicationType,
            subjectName,
            eventDate,
            gender,
            placeOfEvent,
            parentOrSpouseName: isBirth
              ? application.birthDetails?.fatherName || application.birthDetails?.motherName || 'Verified'
              : application.deathDetails?.spouseName || application.deathDetails?.fatherOrSpouseName || 'Verified',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        digitalArchiveEntry: true,
      },
    });

    // 3. Update Application Status to APPROVED
    await prisma.application.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        assignedOfficerId: officer?.id || null,
        officerRemarks: remarks || 'Officially verified and approved by Municipal Registrar.',
        statusHistory: {
          create: {
            previousStatus: application.status,
            newStatus: 'APPROVED',
            changedById: user.id,
            changeReason: 'Authorized Municipal Approval & Certificate Issuance',
            remarks: `Registration No: ${registrationNumber}. Approved by ${user.name}.`,
          },
        },
      },
    });

    // 4. Notify Citizen
    await sendNotification({
      userId: application.citizen.userId,
      title: 'Certificate Approved & Issued!',
      message: `Your ${application.applicationType.toLowerCase()} certificate application (${application.applicationNumber}) has been approved! Official Registration No: ${registrationNumber}. Your verified digital certificate is now available for download.`,
      type: 'APPROVAL',
      link: `/applications/${application.id}`,
      userEmail: application.citizen.user.email,
    });

    // 5. Audit Log
    await logAudit({
      userId: user.id,
      action: 'APPLICATION_APPROVED_CERTIFICATE_ISSUED',
      entityType: 'Certificate',
      entityId: certificate.id,
      details: {
        applicationId: application.id,
        registrationNumber,
        certificateNumber,
        subjectName,
      },
    });

    res.json({
      success: true,
      message: 'Application approved successfully! Official certificate PDF and QR code generated and archived.',
      certificate,
      registrationNumber,
    });
  } catch (error: any) {
    console.error('Approve application error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error approving application.' });
  }
};
