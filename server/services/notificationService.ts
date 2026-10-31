import prisma from '../prisma/client.js';
import nodemailer from 'nodemailer';

// Create simulated or live test nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'municipal.vital.records@ethereal.email',
    pass: 'vitalrecords2026',
  },
});

export async function sendNotification({
  userId,
  title,
  message,
  type = 'APPLICATION_STATUS',
  link,
  userEmail,
}: {
  userId: string;
  title: string;
  message: string;
  type?: 'APPLICATION_STATUS' | 'DOCUMENT_REQUEST' | 'APPROVAL' | 'REJECTION' | 'SYSTEM';
  link?: string;
  userEmail?: string;
}) {
  try {
    // 1. Save persistent notification in DB
    const notif = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        isRead: false,
      },
    });

    // 2. Log simulated email delivery via Nodemailer
    if (userEmail) {
      console.log(`[Email Dispatch Simulation via Nodemailer] To: ${userEmail} | Subject: ${title} | Body: ${message}`);
    }

    return notif;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
