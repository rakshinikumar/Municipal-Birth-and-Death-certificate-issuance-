import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma/client.js';
import { logAudit } from '../services/auditService.js';

export const getAdminDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalCitizens,
      totalHospitals,
      totalOfficers,
      totalApplications,
      totalBirths,
      totalDeaths,
      totalCertificates,
      totalArchiveRecords,
      totalAuditLogs,
    ] = await Promise.all([
      prisma.citizen.count(),
      prisma.hospital.count(),
      prisma.officer.count(),
      prisma.application.count(),
      prisma.application.count({ where: { applicationType: 'BIRTH' } }),
      prisma.application.count({ where: { applicationType: 'DEATH' } }),
      prisma.certificate.count(),
      prisma.digitalArchive.count(),
      prisma.auditLog.count(),
    ]);

    // Breakdown by status
    const statuses = await prisma.application.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Recent audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      stats: {
        totalCitizens,
        totalHospitals,
        totalOfficers,
        totalApplications,
        totalBirths,
        totalDeaths,
        totalCertificates,
        totalArchiveRecords,
        totalAuditLogs,
        statusBreakdown: statuses.reduce((acc: any, curr) => {
          acc[curr.status] = curr._count.status;
          return acc;
        }, {}),
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const where: any = {};
    if (role && typeof role === 'string') {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        citizenProfile: true,
        hospitalProfile: true,
        officerProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHospitalAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, hospitalCode, hospitalName, licenseNo, address, contactPerson, contactPhone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'HOSPITAL',
        phone: contactPhone,
        hospitalProfile: {
          create: {
            hospitalCode,
            hospitalName,
            licenseNo,
            address,
            contactPerson,
            contactPhone,
            authorized: true,
          },
        },
      },
      include: { hospitalProfile: true },
    });

    res.status(201).json({ success: true, message: 'Hospital account authorized.', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOfficerAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, officerCode, designation, department, municipalityJurisdiction, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'OFFICER',
        phone,
        officerProfile: {
          create: {
            officerCode,
            designation,
            department: department || 'Vital Statistics & Registrar of Municipal Corporation',
            municipalityJurisdiction: municipalityJurisdiction || 'Metropolitan Municipal Corporation Zone 1',
          },
        },
      },
      include: { officerProfile: true },
    });

    res.status(201).json({ success: true, message: 'Municipal Officer account created.', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleHospitalAuthorization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hospitalId } = req.params;
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      res.status(404).json({ success: false, message: 'Hospital not found.' });
      return;
    }

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: { authorized: !hospital.authorized },
    });

    res.json({ success: true, message: `Hospital authorization set to ${updated.authorized}.`, hospital: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignApplicationToOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { officerId } = req.body;
    const user = req.user!;

    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      include: { user: true },
    });
    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: {
        assignedOfficerId: officerId,
        statusHistory: {
          create: {
            newStatus: 'UNDER_REVIEW',
            changedById: user.id,
            changeReason: 'Admin Assignment',
            remarks: `Application assigned to Municipal Officer ${officer.user.name} (${officer.officerCode}).`,
          },
        },
      },
    });

    await logAudit({
      userId: user.id,
      action: 'ADMIN_ASSIGN_OFFICER',
      entityType: 'Application',
      entityId: applicationId,
      details: { officerId, officerName: officer.user.name },
    });

    res.json({ success: true, message: `Application assigned to ${officer.user.name}.`, application });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, page = '1', limit = '30' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (action && typeof action === 'string') {
      where.action = action;
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    res.json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
