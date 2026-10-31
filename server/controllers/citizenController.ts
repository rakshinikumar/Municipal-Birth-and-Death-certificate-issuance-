import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma/client.js';
import { matchApplicationWithHospital } from '../services/hospitalMatchingService.js';
import { checkDuplicateRecords } from '../services/duplicateDetectionService.js';
import { validateApplicationData } from '../services/validationService.js';
import { processDocumentWithOcr } from '../services/ocrService.js';
import { sendNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

function generateApplicationNumber(type: 'BIRTH' | 'DEATH'): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `APP-${type === 'BIRTH' ? 'BRT' : 'DTH'}-${year}-${randomSuffix}`;
}

export const submitBirthApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const citizen = await prisma.citizen.findUnique({ where: { userId: user.id } });
    if (!citizen) {
      res.status(403).json({ success: false, message: 'Citizen profile not registered.' });
      return;
    }

    const {
      childName,
      dateOfBirth,
      timeOfBirth,
      gender,
      weightAtBirth,
      placeOfBirth,
      hospitalName,
      hospitalRegNo,
      fatherName,
      fatherAadharOrNationalId,
      fatherOccupation,
      fatherNationality,
      motherName,
      motherAadharOrNationalId,
      motherOccupation,
      motherNationality,
      permanentAddress,
      presentAddressAtBirth,
      priority,
    } = req.body;

    const files = (req.files as Express.Multer.File[]) || [];
    const applicationNumber = generateApplicationNumber('BIRTH');

    // 1. Validation check
    const validation = validateApplicationData(
      'BIRTH',
      {
        childName,
        dateOfBirth,
        gender,
        placeOfBirth,
        fatherName,
        motherName,
      },
      files.length
    );

    // 2. Perform automated hospital database matching
    const matchingResult = await matchApplicationWithHospital({
      applicationType: 'BIRTH',
      name: childName,
      date: new Date(dateOfBirth),
      gender,
      hospitalName,
      hospitalRegNo,
      placeOfEvent: placeOfBirth,
      fatherName,
      motherName,
    });

    const initialStatus = matchingResult.status; // 'HOSPITAL_MATCHED' or 'HOSPITAL_NOT_MATCHED'

    // 3. Create Application & Details in DB
    const application = await prisma.application.create({
      data: {
        applicationNumber,
        applicationType: 'BIRTH',
        citizenId: citizen.id,
        status: initialStatus,
        priority: priority || 'NORMAL',
        hospitalMatchedRecordId: matchingResult.matchedHospitalReport?.id || null,
        matchedDetails: JSON.stringify(matchingResult),
        birthDetails: {
          create: {
            childName: childName || 'Recorded Child',
            dateOfBirth: dateOfBirth && !isNaN(new Date(dateOfBirth).getTime()) ? new Date(dateOfBirth) : new Date(),
            timeOfBirth: timeOfBirth || null,
            gender: gender || 'Female',
            weightAtBirth: weightAtBirth || null,
            placeOfBirth: placeOfBirth || 'Elmwood Municipal Limits',
            hospitalName: hospitalName || null,
            hospitalRegNo: hospitalRegNo || null,
            fatherName: fatherName || 'Recorded in Registry',
            fatherAadharOrNationalId: fatherAadharOrNationalId || null,
            fatherOccupation: fatherOccupation || null,
            fatherNationality: fatherNationality || 'Citizen',
            motherName: motherName || 'Recorded in Registry',
            motherAadharOrNationalId: motherAadharOrNationalId || null,
            motherOccupation: motherOccupation || null,
            motherNationality: motherNationality || 'Citizen',
            permanentAddress: permanentAddress || 'Elmwood Municipal Limits',
            presentAddressAtBirth: presentAddressAtBirth || permanentAddress || 'Elmwood Municipal Limits',
          },
        },
        validationResults: {
          create: {
            isValid: validation.isValid,
            validationScore: validation.score,
            checksJson: JSON.stringify(validation.checks),
            issuesSummary: validation.summary,
          },
        },
        statusHistory: {
          create: [
            {
              previousStatus: null,
              newStatus: 'SUBMITTED',
              changedById: user.id,
              changeReason: 'Initial Citizen Submission',
              remarks: 'Application submitted via citizen digital portal.',
            },
            {
              previousStatus: 'SUBMITTED',
              newStatus: initialStatus,
              changedById: user.id,
              changeReason: 'Automated Hospital Registry Matching Engine',
              remarks: matchingResult.summary,
            },
          ],
        },
      },
      include: {
        birthDetails: true,
      },
    });

    // 4. Save documents and run OCR
    if (files.length > 0) {
      for (const file of files) {
        const docRecord = await prisma.document.create({
          data: {
            applicationId: application.id,
            documentType: file.fieldname || 'HOSPITAL_DISCHARGE_CERTIFICATE',
            fileName: file.originalname,
            filePath: `/uploads/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        });

        // Run OCR on the uploaded document
        const ocr = await processDocumentWithOcr(file.path, file.mimetype, {
          name: childName,
          date: dateOfBirth,
          gender,
          hospitalName,
          hospitalRegNo,
        });

        await prisma.ocrResult.create({
          data: {
            documentId: docRecord.id,
            extractedText: ocr.rawText,
            parsedFieldsJson: JSON.stringify(ocr.identifiedFields),
            confidenceScore: ocr.confidence,
            matchingStatus: ocr.matchingStatus,
            discrepancyNotes: ocr.discrepancies.join('; ') || null,
          },
        });
      }
    }

    // 5. Check for duplicate records in archive
    await checkDuplicateRecords({
      applicationId: application.id,
      applicationType: 'BIRTH',
      name: childName,
      eventDate: new Date(dateOfBirth),
      gender,
      parentOrSpouseName: fatherName,
      motherName,
    });

    // 6. Log audit & send notification
    await logAudit({
      userId: user.id,
      action: 'APPLICATION_SUBMIT_BIRTH',
      entityType: 'Application',
      entityId: application.id,
      details: { applicationNumber, status: initialStatus, matchingScore: matchingResult.matchScore },
    });

    await sendNotification({
      userId: user.id,
      title: 'Birth Application Received',
      message: `Your application ${applicationNumber} has been recorded. Matching Status: ${initialStatus === 'HOSPITAL_MATCHED' ? 'Hospital Record Matched' : 'Awaiting Manual Verification'}.`,
      type: 'APPLICATION_STATUS',
      link: `/applications/${application.id}`,
      userEmail: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Birth certificate application submitted successfully.',
      applicationNumber,
      status: initialStatus,
      applicationId: application.id,
      matchingResult,
      validation,
    });
  } catch (error: any) {
    console.error('Submit birth application error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error processing birth application.' });
  }
};

export const submitDeathApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const citizen = await prisma.citizen.findUnique({ where: { userId: user.id } });
    if (!citizen) {
      res.status(403).json({ success: false, message: 'Citizen profile not registered.' });
      return;
    }

    const {
      deceasedName,
      dateOfDeath,
      timeOfDeath,
      gender,
      age,
      placeOfDeath,
      hospitalName,
      hospitalRegNo,
      causeOfDeath,
      medicalAttendant,
      fatherOrSpouseName,
      spouseName,
      motherName,
      informantName,
      informantRelation,
      permanentAddress,
      priority,
    } = req.body;

    const files = (req.files as Express.Multer.File[]) || [];
    const applicationNumber = generateApplicationNumber('DEATH');

    // 1. Validation check
    const validation = validateApplicationData(
      'DEATH',
      {
        deceasedName,
        dateOfDeath,
        gender,
        placeOfDeath,
        causeOfDeath,
        informantName,
      },
      files.length
    );

    // 2. Perform automated hospital database matching
    const matchingResult = await matchApplicationWithHospital({
      applicationType: 'DEATH',
      name: deceasedName,
      date: new Date(dateOfDeath),
      gender,
      hospitalName,
      hospitalRegNo,
      placeOfEvent: placeOfDeath,
      fatherName: fatherOrSpouseName,
      spouseName,
    });

    const initialStatus = matchingResult.status;

    // 3. Create Application & Details in DB
    const application = await prisma.application.create({
      data: {
        applicationNumber,
        applicationType: 'DEATH',
        citizenId: citizen.id,
        status: initialStatus,
        priority: priority || 'NORMAL',
        hospitalMatchedRecordId: matchingResult.matchedHospitalReport?.id || null,
        matchedDetails: JSON.stringify(matchingResult),
        deathDetails: {
          create: {
            deceasedName: deceasedName || 'Recorded Deceased',
            dateOfDeath: dateOfDeath && !isNaN(new Date(dateOfDeath).getTime()) ? new Date(dateOfDeath) : new Date(),
            timeOfDeath: timeOfDeath || null,
            gender: gender || 'Female',
            age: age ? String(age) : 'N/A',
            placeOfDeath: placeOfDeath || 'Elmwood Municipal Limits',
            hospitalName: hospitalName || null,
            hospitalRegNo: hospitalRegNo || null,
            causeOfDeath: causeOfDeath || 'Medical Cause Recorded',
            medicalAttendant: medicalAttendant || null,
            fatherOrSpouseName: fatherOrSpouseName || null,
            spouseName: spouseName || null,
            motherName: motherName || null,
            informantName: informantName || user.name,
            informantRelation: informantRelation || 'Relative',
            permanentAddress: permanentAddress || 'Elmwood Municipal Limits',
          },
        },
        validationResults: {
          create: {
            isValid: validation.isValid,
            validationScore: validation.score,
            checksJson: JSON.stringify(validation.checks),
            issuesSummary: validation.summary,
          },
        },
        statusHistory: {
          create: [
            {
              previousStatus: null,
              newStatus: 'SUBMITTED',
              changedById: user.id,
              changeReason: 'Initial Citizen Submission',
              remarks: 'Death registration application submitted by designated informant.',
            },
            {
              previousStatus: 'SUBMITTED',
              newStatus: initialStatus,
              changedById: user.id,
              changeReason: 'Automated Hospital Registry Matching Engine',
              remarks: matchingResult.summary,
            },
          ],
        },
      },
      include: {
        deathDetails: true,
      },
    });

    // 4. Save documents and run OCR
    if (files.length > 0) {
      for (const file of files) {
        const docRecord = await prisma.document.create({
          data: {
            applicationId: application.id,
            documentType: file.fieldname || 'MEDICAL_CAUSE_OF_DEATH',
            fileName: file.originalname,
            filePath: `/uploads/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        });

        const ocr = await processDocumentWithOcr(file.path, file.mimetype, {
          name: deceasedName,
          date: dateOfDeath,
          gender,
          hospitalName,
          hospitalRegNo,
        });

        await prisma.ocrResult.create({
          data: {
            documentId: docRecord.id,
            extractedText: ocr.rawText,
            parsedFieldsJson: JSON.stringify(ocr.identifiedFields),
            confidenceScore: ocr.confidence,
            matchingStatus: ocr.matchingStatus,
            discrepancyNotes: ocr.discrepancies.join('; ') || null,
          },
        });
      }
    }

    // 5. Check duplicate records in archive
    await checkDuplicateRecords({
      applicationId: application.id,
      applicationType: 'DEATH',
      name: deceasedName,
      eventDate: new Date(dateOfDeath),
      gender,
      parentOrSpouseName: spouseName || fatherOrSpouseName,
    });

    // 6. Log audit & send notification
    await logAudit({
      userId: user.id,
      action: 'APPLICATION_SUBMIT_DEATH',
      entityType: 'Application',
      entityId: application.id,
      details: { applicationNumber, status: initialStatus, matchingScore: matchingResult.matchScore },
    });

    await sendNotification({
      userId: user.id,
      title: 'Death Registration Application Received',
      message: `Your application ${applicationNumber} has been logged. Current Status: ${initialStatus === 'HOSPITAL_MATCHED' ? 'Hospital Medical Record Matched' : 'Awaiting Manual Verification'}.`,
      type: 'APPLICATION_STATUS',
      link: `/applications/${application.id}`,
      userEmail: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Death certificate application submitted successfully.',
      applicationNumber,
      status: initialStatus,
      applicationId: application.id,
      matchingResult,
      validation,
    });
  } catch (error: any) {
    console.error('Submit death application error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error processing death application.' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const citizen = await prisma.citizen.findUnique({ where: { userId: user.id } });
    if (!citizen) {
      res.status(403).json({ success: false, message: 'Citizen profile not registered.' });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { citizenId: citizen.id },
      include: {
        birthDetails: true,
        deathDetails: true,
        documents: {
          include: { ocrResult: true },
        },
        documentRequests: true,
        certificate: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, applications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        citizen: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
        birthDetails: true,
        deathDetails: true,
        hospitalMatchedRecord: {
          include: { hospital: true },
        },
        documents: {
          include: { ocrResult: true },
        },
        validationResults: true,
        duplicateRecords: true,
        verificationRecords: {
          include: { officer: { include: { user: { select: { name: true } } } } },
        },
        documentRequests: {
          include: { officer: { include: { user: { select: { name: true } } } } },
        },
        certificate: true,
        statusHistory: {
          include: { changedBy: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Role check: Citizens can only view their own applications
    if (user.role === 'CITIZEN' && application.citizen.userId !== user.id) {
      res.status(403).json({ success: false, message: 'Access denied. You can only view your own applications.' });
      return;
    }

    res.json({ success: true, application });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resubmitDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { citizenResponse, requestId } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const user = req.user!;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { citizen: true },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    if (user.role === 'CITIZEN' && application.citizen.userId !== user.id) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Save newly uploaded files
    for (const file of files) {
      await prisma.document.create({
        data: {
          applicationId: application.id,
          documentType: 'RESUBMITTED_EVIDENCE',
          fileName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      });
    }

    // Update the pending document request if specified
    if (requestId) {
      await prisma.additionalDocumentRequest.update({
        where: { id: requestId },
        data: {
          status: 'FULFILLED',
          fulfilledAt: new Date(),
          citizenResponse: citizenResponse || 'Documents attached and resubmitted by applicant.',
        },
      });
    }

    // Update application status to RESUBMITTED
    await prisma.application.update({
      where: { id },
      data: {
        status: 'RESUBMITTED',
        statusHistory: {
          create: {
            previousStatus: application.status,
            newStatus: 'RESUBMITTED',
            changedById: user.id,
            changeReason: 'Citizen Evidence Resubmission',
            remarks: citizenResponse || 'Additional requested documents uploaded by applicant.',
          },
        },
      },
    });

    await logAudit({
      userId: user.id,
      action: 'APPLICATION_RESUBMISSION',
      entityType: 'Application',
      entityId: application.id,
      details: { filesCount: files.length },
    });

    res.json({
      success: true,
      message: 'Additional documents submitted successfully. Application returned to Municipal Officer review queue.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
