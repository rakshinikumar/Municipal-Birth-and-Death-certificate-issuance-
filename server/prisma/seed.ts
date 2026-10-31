import bcrypt from 'bcryptjs';
import prisma from './client.js';
import { generateCertificatePDF } from '../services/pdfService.js';

export async function seedDatabase() {
  console.log('--- Initializing Municipal Vital Statistics Database Seeder ---');

  // Clear existing records if needed (or upsert)
  const existingUsersCount = await prisma.user.count();
  if (existingUsersCount > 0) {
    console.log('Database already populated. Skipping re-seed.');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const citizenPass = await bcrypt.hash('Citizen123!', salt);
  const hospitalPass = await bcrypt.hash('Hospital123!', salt);
  const officerPass = await bcrypt.hash('Officer123!', salt);
  const adminPass = await bcrypt.hash('Admin123!', salt);

  // 1. Create Citizen Account
  const citizenUser = await prisma.user.create({
    data: {
      name: 'Rakshini Kumar',
      email: 'citizen@elmwood.gov',
      password: citizenPass,
      role: 'CITIZEN',
      phone: '+1 (555) 234-8891',
      citizenProfile: {
        create: {
          nationalId: 'ELM-CIT-984210',
          address: '442 Heritage Boulevard, Suite 3B, Elmwood Municipal District',
          dateOfBirth: new Date('1994-06-18'),
          gender: 'Female',
          relationToApplicant: 'MOTHER',
        },
      },
    },
    include: { citizenProfile: true },
  });

  // 2. Create Hospital Account
  const hospitalUser = await prisma.user.create({
    data: {
      name: 'Elmwood City General Hospital',
      email: 'hospital@general.gov',
      password: hospitalPass,
      role: 'HOSPITAL',
      phone: '+1 (555) 901-4400',
      hospitalProfile: {
        create: {
          hospitalCode: 'HOSP-METRO-01',
          hospitalName: 'Elmwood City General Hospital',
          licenseNo: 'LIC-MED-2024-8841',
          address: '100 Medical Center Parkway, North Elmwood',
          contactPerson: 'Dr. Eleanor Vance, Chief Medical Registrar',
          contactPhone: '+1 (555) 901-4412',
          authorized: true,
        },
      },
    },
    include: { hospitalProfile: true },
  });

  // 3. Create Municipal Officer Account
  const officerUser = await prisma.user.create({
    data: {
      name: 'Officer Sarah Jenkins',
      email: 'officer@elmwood.gov',
      password: officerPass,
      role: 'OFFICER',
      phone: '+1 (555) 880-1200',
      officerProfile: {
        create: {
          officerCode: 'REG-OFF-441',
          designation: 'Senior Registrar of Vital Statistics',
          department: 'Department of Vital Statistics & Public Archives',
          municipalityJurisdiction: 'Metropolitan Municipal Corporation Zone 1',
        },
      },
    },
    include: { officerProfile: true },
  });

  // 4. Create Admin Account
  const adminUser = await prisma.user.create({
    data: {
      name: 'Arthur Vance, IAS',
      email: 'admin@elmwood.gov',
      password: adminPass,
      role: 'ADMIN',
      phone: '+1 (555) 880-1001',
    },
  });

  console.log('Seeded 4 core role users successfully.');

  // 5. Seed Hospital Master Reports
  const reportBirth1 = await prisma.hospitalReport.create({
    data: {
      reportType: 'BIRTH',
      hospitalId: hospitalUser.hospitalProfile!.id,
      hospitalRegistrationNo: 'CGH-BRT-2026-0042',
      childOrDeceasedName: 'Liam Alexander Vance',
      eventDate: new Date('2026-10-15T08:30:00Z'),
      gender: 'Male',
      placeOfEvent: 'Maternity Ward 4A, Elmwood City General Hospital',
      fatherName: 'Julian Vance',
      motherName: 'Elena Vance',
      doctorName: 'Dr. Sarah Lin, MD, OB-GYN',
      medicalSummary: 'Healthy live single birth. Weight 3.4kg. APGAR 9/10.',
      status: 'VERIFIED',
    },
  });

  const reportBirth2 = await prisma.hospitalReport.create({
    data: {
      reportType: 'BIRTH',
      hospitalId: hospitalUser.hospitalProfile!.id,
      hospitalRegistrationNo: 'CGH-BRT-2026-0089',
      childOrDeceasedName: 'Aria Maeve Kumar',
      eventDate: new Date('2026-09-12T14:15:00Z'),
      gender: 'Female',
      placeOfEvent: 'Labor Suite 2, Elmwood City General Hospital',
      fatherName: 'Devan Kumar',
      motherName: 'Rakshini Kumar',
      doctorName: 'Dr. Rebecca Stone, MD',
      medicalSummary: 'Normal spontaneous vaginal delivery. Birth weight 3.1kg.',
      status: 'VERIFIED',
    },
  });

  const reportDeath1 = await prisma.hospitalReport.create({
    data: {
      reportType: 'DEATH',
      hospitalId: hospitalUser.hospitalProfile!.id,
      hospitalRegistrationNo: 'CGH-DTH-2026-0019',
      childOrDeceasedName: 'Robert Thomas Miller',
      eventDate: new Date('2026-10-10T21:40:00Z'),
      gender: 'Male',
      placeOfEvent: 'ICU Bed 8, Elmwood City General Hospital',
      spouseName: 'Martha Miller',
      fatherName: 'William Miller',
      causeOfDeath: 'Acute Myocardial Infarction secondary to Coronary Artery Disease',
      informantName: 'Martha Miller (Spouse)',
      doctorName: 'Dr. Henry Ward, MD, Cardiology',
      medicalSummary: 'Medical certificate of cause of death verified and filed.',
      status: 'VERIFIED',
    },
  });

  console.log('Seeded hospital vital event reports.');

  // 6. Pre-generate an Approved Certificate in Digital Archive for Aria Maeve Kumar
  const regNumber = 'MC-BRT-2026-01892';
  const certNumber = 'CERT-VITAL-2026-558291';
  const issueDate = new Date('2026-09-20');

  const pdfGen = await generateCertificatePDF({
    certificateType: 'BIRTH',
    registrationNumber: regNumber,
    certificateNumber: certNumber,
    issueDate,
    subjectName: 'Aria Maeve Kumar',
    eventDate: new Date('2026-09-12'),
    timeOfEvent: '14:15',
    gender: 'Female',
    placeOfEvent: 'Elmwood City General Hospital',
    hospitalName: 'Elmwood City General Hospital',
    fatherName: 'Devan Kumar',
    motherName: 'Rakshini Kumar',
    permanentAddress: '442 Heritage Boulevard, Suite 3B, Elmwood Municipal District',
    registrarName: 'Arthur Vance, IAS',
    registrarDesignation: 'Executive Municipal Registrar & Commissioner',
  });

  const approvedApp = await prisma.application.create({
    data: {
      applicationNumber: 'APP-BRT-2026-78192',
      applicationType: 'BIRTH',
      citizenId: citizenUser.citizenProfile!.id,
      status: 'APPROVED',
      priority: 'NORMAL',
      hospitalMatchedRecordId: reportBirth2.id,
      matchedDetails: JSON.stringify({
        isMatched: true,
        matchScore: 100,
        status: 'HOSPITAL_MATCHED',
        summary: 'Exact match with hospital report CGH-BRT-2026-0089.',
      }),
      approvedDate: issueDate,
      assignedOfficerId: officerUser.officerProfile!.id,
      officerRemarks: 'All evidentiary records verified against hospital registry. Certificate issued.',
      birthDetails: {
        create: {
          childName: 'Aria Maeve Kumar',
          dateOfBirth: new Date('2026-09-12'),
          timeOfBirth: '14:15',
          gender: 'Female',
          weightAtBirth: '3.1 kg',
          placeOfBirth: 'Elmwood City General Hospital',
          hospitalName: 'Elmwood City General Hospital',
          hospitalRegNo: 'CGH-BRT-2026-0089',
          fatherName: 'Devan Kumar',
          fatherAadharOrNationalId: 'ELM-CIT-778219',
          fatherOccupation: 'Civil Architect',
          fatherNationality: 'Citizen',
          motherName: 'Rakshini Kumar',
          motherAadharOrNationalId: 'ELM-CIT-984210',
          motherOccupation: 'Software Systems Engineer',
          motherNationality: 'Citizen',
          permanentAddress: '442 Heritage Boulevard, Suite 3B, Elmwood Municipal District',
          presentAddressAtBirth: '442 Heritage Boulevard, Suite 3B, Elmwood Municipal District',
        },
      },
      certificate: {
        create: {
          registrationNumber: regNumber,
          certificateNumber: certNumber,
          certificateType: 'BIRTH',
          issueDate,
          issuingAuthority: 'Department of Vital Statistics, Metropolitan Municipal Corporation',
          registrarName: 'Arthur Vance, IAS',
          registrarDesignation: 'Executive Municipal Registrar & Commissioner',
          pdfPath: pdfGen.relativeUrl,
          qrCodeData: pdfGen.qrCodeData,
          digitalSignatureHash: pdfGen.digitalSignatureHash,
          valid: true,
          digitalArchiveEntry: {
            create: {
              registrationNumber: regNumber,
              certificateType: 'BIRTH',
              subjectName: 'Aria Maeve Kumar',
              eventDate: new Date('2026-09-12'),
              gender: 'Female',
              placeOfEvent: 'Elmwood City General Hospital',
              parentOrSpouseName: 'Devan Kumar & Rakshini Kumar',
              archivedAt: issueDate,
              status: 'ACTIVE',
            },
          },
        },
      },
      statusHistory: {
        create: [
          {
            newStatus: 'SUBMITTED',
            changedById: citizenUser.id,
            changeReason: 'Citizen Submission',
            remarks: 'Application logged with hospital discharge slip.',
          },
          {
            previousStatus: 'SUBMITTED',
            newStatus: 'HOSPITAL_MATCHED',
            changedById: citizenUser.id,
            changeReason: 'Hospital Matching Engine',
            remarks: 'Matched 100% with Elmwood City General Hospital database.',
          },
          {
            previousStatus: 'HOSPITAL_MATCHED',
            newStatus: 'APPROVED',
            changedById: officerUser.id,
            changeReason: 'Municipal Officer Approval',
            remarks: `Approved by Officer Sarah Jenkins. Certificate #${regNumber} issued.`,
          },
        ],
      },
    },
  });

  // 7. Seed Hospital-Matched Application in Officer's Queue (Child: Liam Alexander Vance)
  await prisma.application.create({
    data: {
      applicationNumber: 'APP-BRT-2026-88301',
      applicationType: 'BIRTH',
      citizenId: citizenUser.citizenProfile!.id,
      status: 'HOSPITAL_MATCHED',
      priority: 'URGENT',
      hospitalMatchedRecordId: reportBirth1.id,
      matchedDetails: JSON.stringify({
        isMatched: true,
        matchScore: 95,
        status: 'HOSPITAL_MATCHED',
        fieldMatches: {
          nameMatch: true,
          dateMatch: true,
          genderMatch: true,
          hospitalRegNoMatch: true,
          hospitalNameMatch: true,
          parentOrSpouseMatch: true,
          placeMatch: true,
        },
        summary: 'Positive match confirmed with authorized hospital record (CGH-BRT-2026-0042) at Elmwood City General Hospital with 95% correlation.',
      }),
      birthDetails: {
        create: {
          childName: 'Liam Alexander Vance',
          dateOfBirth: new Date('2026-10-15'),
          timeOfBirth: '08:30',
          gender: 'Male',
          weightAtBirth: '3.4 kg',
          placeOfBirth: 'Elmwood City General Hospital',
          hospitalName: 'Elmwood City General Hospital',
          hospitalRegNo: 'CGH-BRT-2026-0042',
          fatherName: 'Julian Vance',
          fatherNationality: 'Citizen',
          motherName: 'Elena Vance',
          motherNationality: 'Citizen',
          permanentAddress: '12 Kensington Gardens, Elmwood',
          presentAddressAtBirth: '12 Kensington Gardens, Elmwood',
        },
      },
      statusHistory: {
        create: {
          newStatus: 'HOSPITAL_MATCHED',
          changedById: citizenUser.id,
          changeReason: 'Automated Hospital Registry Matching Engine',
          remarks: 'Automated hospital matching verified 7/7 core fields.',
        },
      },
    },
  });

  // 8. Seed Manual Verification Application (Home Birth)
  await prisma.application.create({
    data: {
      applicationNumber: 'APP-BRT-2026-91044',
      applicationType: 'BIRTH',
      citizenId: citizenUser.citizenProfile!.id,
      status: 'HOSPITAL_NOT_MATCHED',
      priority: 'NORMAL',
      matchedDetails: JSON.stringify({
        isMatched: false,
        matchScore: 0,
        status: 'HOSPITAL_NOT_MATCHED',
        summary: 'No corresponding hospital entry found in the municipal medical registry. Eligible for Home Birth manual verification.',
      }),
      officerRemarks: 'Home delivery without hospital admission. Certified by registered community midwife affidavit.',
      birthDetails: {
        create: {
          childName: 'Noah Bennett Sterling',
          dateOfBirth: new Date('2026-10-02'),
          timeOfBirth: '23:10',
          gender: 'Male',
          weightAtBirth: '3.2 kg',
          placeOfBirth: 'Home Residence (88 Willow Creek Lane, Elmwood)',
          fatherName: 'Christopher Sterling',
          motherName: 'Hannah Sterling',
          permanentAddress: '88 Willow Creek Lane, Elmwood',
          presentAddressAtBirth: '88 Willow Creek Lane, Elmwood',
        },
      },
      statusHistory: {
        create: {
          newStatus: 'HOSPITAL_NOT_MATCHED',
          changedById: citizenUser.id,
          changeReason: 'Automated Hospital Matching Check',
          remarks: 'No institutional record; assigned to manual field & documentary verification queue.',
        },
      },
    },
  });

  // 9. Seed Death Application with Hospital Match (Robert Thomas Miller)
  await prisma.application.create({
    data: {
      applicationNumber: 'APP-DTH-2026-30211',
      applicationType: 'DEATH',
      citizenId: citizenUser.citizenProfile!.id,
      status: 'HOSPITAL_MATCHED',
      priority: 'NORMAL',
      hospitalMatchedRecordId: reportDeath1.id,
      matchedDetails: JSON.stringify({
        isMatched: true,
        matchScore: 90,
        status: 'HOSPITAL_MATCHED',
        summary: 'Positive match confirmed with authorized hospital record (CGH-DTH-2026-0019) at Elmwood City General Hospital.',
      }),
      deathDetails: {
        create: {
          deceasedName: 'Robert Thomas Miller',
          dateOfDeath: new Date('2026-10-10'),
          timeOfDeath: '21:40',
          gender: 'Male',
          age: '76',
          placeOfDeath: 'Elmwood City General Hospital',
          hospitalName: 'Elmwood City General Hospital',
          hospitalRegNo: 'CGH-DTH-2026-0019',
          causeOfDeath: 'Acute Myocardial Infarction secondary to Coronary Artery Disease',
          medicalAttendant: 'Dr. Henry Ward, MD',
          fatherOrSpouseName: 'Martha Miller (Spouse)',
          spouseName: 'Martha Miller',
          informantName: 'Martha Miller',
          informantRelation: 'Spouse',
          permanentAddress: '512 Oakwood Terrace, Elmwood',
        },
      },
      statusHistory: {
        create: {
          newStatus: 'HOSPITAL_MATCHED',
          changedById: citizenUser.id,
          changeReason: 'Automated Matching',
          remarks: 'Matched ICU medical records.',
        },
      },
    },
  });

  // 10. Pre-seed notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: citizenUser.id,
        title: 'Birth Certificate Issued',
        message: 'Birth Certificate for Aria Maeve Kumar (Registration No: MC-BRT-2026-01892) is ready for download.',
        type: 'APPROVAL',
        link: `/applications/${approvedApp.id}`,
      },
      {
        userId: citizenUser.id,
        title: 'Application Status Updated',
        message: 'Your application APP-BRT-2026-88301 matched authorized hospital database records.',
        type: 'APPLICATION_STATUS',
      },
    ],
  });

  // 11. Pre-seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        detailsJson: JSON.stringify({ version: '2026.1', jurisdiction: 'Elmwood Municipal Corporation' }),
      },
      {
        userId: officerUser.id,
        action: 'APPLICATION_APPROVED_CERTIFICATE_ISSUED',
        entityType: 'Certificate',
        detailsJson: JSON.stringify({ registrationNumber: regNumber, subject: 'Aria Maeve Kumar' }),
      },
    ],
  });

  console.log('--- Municipal Database Seeding Completed Successfully ---');
}

// Allow direct execution via tsx
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
