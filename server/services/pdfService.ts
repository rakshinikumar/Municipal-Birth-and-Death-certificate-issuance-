import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG } from '../config/index.js';

export interface CertificateData {
  certificateType: 'BIRTH' | 'DEATH';
  registrationNumber: string;
  certificateNumber: string;
  issueDate: Date;
  subjectName: string;
  eventDate: Date;
  timeOfEvent?: string;
  gender: string;
  placeOfEvent: string;
  hospitalName?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  causeOfDeath?: string;
  permanentAddress?: string;
  registrarName?: string;
  registrarDesignation?: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<{
  pdfPath: string;
  relativeUrl: string;
  qrCodeData: string;
  digitalSignatureHash: string;
}> {
  if (!fs.existsSync(CONFIG.CERTIFICATES_DIR)) {
    fs.mkdirSync(CONFIG.CERTIFICATES_DIR, { recursive: true });
  }

  const safeReg = data.registrationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `CERT_${safeReg}_${Date.now()}.pdf`;
  const fullPath = path.join(CONFIG.CERTIFICATES_DIR, filename);
  const relativeUrl = `/uploads/certificates/${filename}`;

  // Public verification payload for QR code
  const verificationPayload = JSON.stringify({
    reg: data.registrationNumber,
    type: data.certificateType,
    name: data.subjectName,
    date: new Date(data.eventDate).toISOString().slice(0, 10),
    auth: CONFIG.MUNICIPALITY_NAME,
    v: '1.0',
  });

  // Generate QR Code as Buffer
  const qrCodeBuffer = await QRCode.toBuffer(verificationPayload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 140,
  });

  // Generate SHA-256 Digital Signature Hash
  const hashString = `${data.registrationNumber}|${data.subjectName}|${data.eventDate}|${data.certificateType}|${CONFIG.JWT_SECRET}`;
  const digitalSignatureHash = crypto.createHash('sha256').update(hashString).digest('hex');

  return new Promise((resolve, reject) => {
    // Standard A4 dimensions: 595.28 x 841.89 points
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `${data.certificateType} Certificate - ${data.registrationNumber}`,
        Author: CONFIG.MUNICIPALITY_NAME,
        Subject: `Official Vital Statistics Record`,
      },
    });

    const writeStream = fs.createWriteStream(fullPath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // --- ORNATE BORDERS ---
    // Outer Border
    doc.rect(25, 25, pageWidth - 50, pageHeight - 50)
      .lineWidth(3)
      .strokeColor('#1e3a8a') // Navy
      .stroke();

    // Inner Border
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
      .lineWidth(1)
      .strokeColor('#d97706') // Gold / Amber
      .stroke();

    // Corner rosettes
    const corners = [
      [35, 35],
      [pageWidth - 35, 35],
      [35, pageHeight - 35],
      [pageWidth - 35, pageHeight - 35],
    ];
    corners.forEach(([cx, cy]) => {
      doc.circle(cx, cy, 3).fillColor('#d97706').fill();
    });

    // --- HEADER ---
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#64748b')
      .text('GOVERNMENT OF THE METROPOLITAN MUNICIPAL CORPORATION', { align: 'center', characterSpacing: 1.5 });

    doc.font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#0f172a')
      .text(CONFIG.MUNICIPALITY_NAME.toUpperCase(), { align: 'center' });

    doc.font('Helvetica')
      .fontSize(9)
      .fillColor('#475569')
      .text(CONFIG.MUNICIPALITY_DEPARTMENT, { align: 'center' });

    doc.moveDown(0.8);
    // Divider line
    doc.moveTo(60, doc.y).lineTo(pageWidth - 60, doc.y).lineWidth(1).strokeColor('#cbd5e1').stroke();
    doc.moveDown(0.8);

    // Certificate Title Banner
    const isBirth = data.certificateType === 'BIRTH';
    doc.rect(70, doc.y, pageWidth - 140, 32).fillColor('#1e3a8a').fill();
    doc.font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#ffffff')
      .text(isBirth ? 'CERTIFICATE OF BIRTH' : 'CERTIFICATE OF DEATH', 70, doc.y - 24, {
        align: 'center',
        characterSpacing: 2,
      });

    doc.moveDown(1.2);
    doc.font('Helvetica-Oblique')
      .fontSize(8.5)
      .fillColor('#475569')
      .text('(Issued under Section 12/17 of the Registration of Births and Deaths Act & Municipal Vital Records By-laws)', {
        align: 'center',
      });

    doc.moveDown(1.5);

    // Registration Meta Box
    const metaY = doc.y;
    doc.rect(50, metaY, pageWidth - 100, 42).fillColor('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.5).fillAndStroke();

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e3a8a');
    doc.text('REGISTRATION NO:', 60, metaY + 8);
    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
    doc.text(data.registrationNumber, 60, metaY + 22);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e3a8a');
    doc.text('CERTIFICATE NO:', 240, metaY + 8);
    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
    doc.text(data.certificateNumber, 240, metaY + 22);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e3a8a');
    doc.text('DATE OF REGISTRATION:', 410, metaY + 8);
    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
    doc.text(new Date(data.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }), 410, metaY + 22);

    doc.moveDown(3);

    // Legal certification text
    doc.font('Helvetica').fontSize(9.5).fillColor('#1e293b').lineGap(3);
    const eventWord = isBirth ? 'birth' : 'death';
    doc.text(
      `This is to certify that the following information has been taken from the original official record of ${eventWord} which is the statutory register for the Metropolitan Corporation of Elmwood.`,
      50,
      doc.y,
      { width: pageWidth - 100, align: 'justify' }
    );

    doc.moveDown(1.5);

    // Event Details Grid
    const startTableY = doc.y;
    const tableRows = [
      [isBirth ? 'Full Legal Name of Child:' : 'Full Legal Name of Deceased:', data.subjectName.toUpperCase()],
      [isBirth ? 'Date of Birth:' : 'Date of Death:', `${new Date(data.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${data.timeOfEvent ? '(' + data.timeOfEvent + ')' : ''}`],
      ['Gender / Sex:', data.gender],
      ['Place of Occurrence:', data.placeOfEvent],
      ['Hospital / Healthcare Center:', data.hospitalName || 'Verified Non-Hospital / Residential Occurrence'],
    ];

    if (isBirth) {
      tableRows.push(['Father\'s Full Name:', data.fatherName || 'Recorded in Registry']);
      tableRows.push(['Mother\'s Full Name:', data.motherName || 'Recorded in Registry']);
    } else {
      if (data.spouseName) tableRows.push(['Spouse Full Name:', data.spouseName]);
      if (data.fatherName) tableRows.push(['Father / Guardian Name:', data.fatherName]);
      tableRows.push(['Cause of Death (Certified):', data.causeOfDeath || 'Medical Certification Recorded']);
    }

    if (data.permanentAddress) {
      tableRows.push(['Permanent Residential Address:', data.permanentAddress]);
    }

    let currentY = startTableY;
    tableRows.forEach(([label, value], index) => {
      const rowHeight = 22;
      const isEven = index % 2 === 0;

      doc.rect(50, currentY, pageWidth - 100, rowHeight)
        .fillColor(isEven ? '#ffffff' : '#f1f5f9')
        .fill();

      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#334155')
        .text(label, 60, currentY + 6, { width: 180 });

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(value, 240, currentY + 6, { width: pageWidth - 300 });

      currentY += rowHeight;
    });

    // Outer grid line
    doc.rect(50, startTableY, pageWidth - 100, currentY - startTableY)
      .lineWidth(0.5)
      .strokeColor('#cbd5e1')
      .stroke();

    doc.y = currentY + 20;

    // --- BOTTOM SECTION: QR CODE & DIGITAL SIGNATURE & REGISTRAR SEAL ---
    const bottomY = Math.max(doc.y, pageHeight - 170);

    // Render QR Code image
    doc.image(qrCodeBuffer, 60, bottomY - 10, { width: 85, height: 85 });
    doc.font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#1e3a8a')
      .text('SCAN TO VERIFY ONLINE', 60, bottomY + 80, { width: 85, align: 'center' });

    // Digital Hash & Legal disclaimer
    doc.font('Helvetica')
      .fontSize(7)
      .fillColor('#64748b')
      .text(
        `Digital Hash: ${digitalSignatureHash.slice(0, 32)}...\nValid across all governmental authorities, foreign embassies, educational institutions and civil registries. Tampering invalidates this certificate.`,
        160,
        bottomY + 10,
        { width: 200 }
      );

    // Official Municipal Seal Stamp
    const sealX = pageWidth - 190;
    doc.circle(sealX + 50, bottomY + 30, 36)
      .lineWidth(1)
      .dash(3, { space: 2 })
      .strokeColor('#d97706')
      .stroke();
    doc.undash();

    doc.font('Helvetica-Bold')
      .fontSize(6.5)
      .fillColor('#b45309')
      .text('OFFICIAL SEAL OF THE REGISTRAR', sealX + 15, bottomY + 15, { width: 70, align: 'center' });
    doc.text('VITAL STATISTICS\nELMWOOD', sealX + 15, bottomY + 32, { width: 70, align: 'center' });

    // Signature Area
    doc.moveTo(sealX - 20, bottomY + 65).lineTo(pageWidth - 55, bottomY + 65).lineWidth(0.5).strokeColor('#64748b').stroke();
    doc.font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text(data.registrarName || CONFIG.DEFAULT_REGISTRAR, sealX - 20, bottomY + 68, { width: 140, align: 'center' });
    doc.font('Helvetica')
      .fontSize(7.5)
      .fillColor('#475569')
      .text(data.registrarDesignation || CONFIG.REGISTRAR_TITLE, sealX - 20, bottomY + 79, { width: 140, align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      resolve({
        pdfPath: fullPath,
        relativeUrl,
        qrCodeData: verificationPayload,
        digitalSignatureHash,
      });
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}
