import { Request, Response } from 'express';
import prisma from '../prisma/client.js';

export const getArchiveRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, search, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (type && (type === 'BIRTH' || type === 'DEATH')) {
      where.certificateType = type;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { registrationNumber: { contains: search } },
        { subjectName: { contains: search } },
        { parentOrSpouseName: { contains: search } },
        { placeOfEvent: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.eventDate = {};
      if (startDate) where.eventDate.gte = new Date(startDate as string);
      if (endDate) where.eventDate.lte = new Date(endDate as string);
    }

    const [total, records] = await Promise.all([
      prisma.digitalArchive.count({ where }),
      prisma.digitalArchive.findMany({
        where,
        include: {
          certificate: {
            select: {
              id: true,
              registrationNumber: true,
              certificateNumber: true,
              issueDate: true,
              issuingAuthority: true,
              registrarName: true,
              pdfPath: true,
              digitalSignatureHash: true,
            },
          },
        },
        orderBy: { archivedAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const totalBirths = await prisma.digitalArchive.count({ where: { certificateType: 'BIRTH' } });
    const totalDeaths = await prisma.digitalArchive.count({ where: { certificateType: 'DEATH' } });

    res.json({
      success: true,
      stats: { total, totalBirths, totalDeaths },
      pagination: {
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      records,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getArchiveRecordById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await prisma.digitalArchive.findUnique({
      where: { id },
      include: {
        certificate: {
          include: {
            application: {
              include: {
                birthDetails: true,
                deathDetails: true,
                documents: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Archive record not found.' });
      return;
    }

    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
