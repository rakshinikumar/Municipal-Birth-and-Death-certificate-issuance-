import prisma from '../prisma/client.js';

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress = '127.0.0.1',
}: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        detailsJson: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Audit log creation failed:', err);
    return null;
  }
}
