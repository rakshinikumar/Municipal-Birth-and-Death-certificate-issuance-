export type UserRole = 'CITIZEN' | 'HOSPITAL' | 'OFFICER' | 'ADMIN';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'HOSPITAL_MATCHED'
  | 'HOSPITAL_NOT_MATCHED'
  | 'MANUAL_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type ApplicationType = 'BIRTH' | 'DEATH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  profileId?: string;
  details?: any;
  createdAt?: string;
}

export interface Citizen {
  id: string;
  userId: string;
  nationalId?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  relationToApplicant?: string | null;
}

export interface Hospital {
  id: string;
  userId: string;
  hospitalCode: string;
  hospitalName: string;
  licenseNo: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  authorized: boolean;
}

export interface Officer {
  id: string;
  userId: string;
  officerCode: string;
  designation: string;
  department: string;
  municipalityJurisdiction: string;
  user?: { name: string; email: string };
}

export interface HospitalReport {
  id: string;
  reportType: ApplicationType;
  hospitalId: string;
  hospital?: Hospital;
  hospitalRegistrationNo: string;
  childOrDeceasedName: string;
  eventDate: string;
  gender: string;
  placeOfEvent: string;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  causeOfDeath?: string | null;
  informantName?: string | null;
  doctorName?: string | null;
  medicalSummary?: string | null;
  documentUrl?: string | null;
  status: string;
  createdAt: string;
}

export interface BirthDetail {
  id: string;
  applicationId: string;
  childName: string;
  dateOfBirth: string;
  timeOfBirth?: string | null;
  gender: string;
  weightAtBirth?: string | null;
  placeOfBirth: string;
  hospitalName?: string | null;
  hospitalRegNo?: string | null;
  fatherName: string;
  fatherAadharOrNationalId?: string | null;
  fatherOccupation?: string | null;
  fatherNationality: string;
  motherName: string;
  motherAadharOrNationalId?: string | null;
  motherOccupation?: string | null;
  motherNationality: string;
  permanentAddress: string;
  presentAddressAtBirth: string;
}

export interface DeathDetail {
  id: string;
  applicationId: string;
  deceasedName: string;
  dateOfDeath: string;
  timeOfDeath?: string | null;
  gender: string;
  age: string;
  placeOfDeath: string;
  hospitalName?: string | null;
  hospitalRegNo?: string | null;
  causeOfDeath: string;
  medicalAttendant?: string | null;
  fatherOrSpouseName?: string | null;
  spouseName?: string | null;
  motherName?: string | null;
  informantName: string;
  informantRelation: string;
  permanentAddress: string;
}

export interface OcrResult {
  id: string;
  documentId: string;
  extractedText: string;
  parsedFieldsJson?: string | null;
  confidenceScore: number;
  matchingStatus: 'MATCHED' | 'PARTIAL_MISMATCH' | 'FAILED';
  discrepancyNotes?: string | null;
  processedAt: string;
}

export interface Document {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  ocrResult?: OcrResult | null;
}

export interface ValidationCheck {
  field: string;
  check: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  id: string;
  applicationId: string;
  isValid: boolean;
  checksJson: string;
  validationScore: number;
  issuesSummary?: string | null;
}

export interface DuplicateRecord {
  id: string;
  applicationId: string;
  archiveRecordId?: string | null;
  similarityScore: number;
  matchedFieldsJson: string;
  reviewDecision: string;
  remarks?: string | null;
  detectedAt: string;
}

export interface VerificationRecord {
  id: string;
  applicationId: string;
  officerId?: string | null;
  officer?: Officer | null;
  verificationType: string;
  remarks: string;
  outcome: string;
  verifiedAt: string;
}

export interface AdditionalDocumentRequest {
  id: string;
  applicationId: string;
  officerId: string;
  officer?: Officer;
  requestedDocuments: string;
  remarks: string;
  requestDate: string;
  status: 'PENDING' | 'FULFILLED';
  fulfilledAt?: string | null;
  citizenResponse?: string | null;
}

export interface Certificate {
  id: string;
  registrationNumber: string;
  certificateNumber: string;
  applicationId: string;
  certificateType: ApplicationType;
  issueDate: string;
  issuingAuthority: string;
  registrarName: string;
  registrarDesignation: string;
  pdfPath: string;
  qrCodeData: string;
  digitalSignatureHash: string;
  valid: boolean;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  previousStatus?: string | null;
  newStatus: string;
  changedById?: string | null;
  changedBy?: { name: string; role: string } | null;
  changeReason?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  applicationType: ApplicationType;
  citizenId: string;
  citizen?: {
    user: {
      name: string;
      email: string;
      phone?: string | null;
    };
  };
  status: ApplicationStatus;
  priority: 'NORMAL' | 'URGENT';
  assignedOfficerId?: string | null;
  assignedOfficer?: Officer | null;
  hospitalMatchedRecordId?: string | null;
  hospitalMatchedRecord?: HospitalReport | null;
  matchedDetails?: string | null;
  submissionDate: string;
  approvedDate?: string | null;
  rejectedDate?: string | null;
  rejectionReason?: string | null;
  officerRemarks?: string | null;
  createdAt: string;
  updatedAt: string;

  birthDetails?: BirthDetail | null;
  deathDetails?: DeathDetail | null;
  documents?: Document[];
  validationResults?: ValidationResult[];
  duplicateRecords?: DuplicateRecord[];
  verificationRecords?: VerificationRecord[];
  documentRequests?: AdditionalDocumentRequest[];
  certificate?: Certificate | null;
  statusHistory?: ApplicationStatusHistory[];
}

export interface DigitalArchiveEntry {
  id: string;
  certificateId: string;
  registrationNumber: string;
  certificateType: ApplicationType;
  subjectName: string;
  eventDate: string;
  gender: string;
  placeOfEvent: string;
  parentOrSpouseName: string;
  archivedAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'AMENDED';
  certificate?: {
    id: string;
    registrationNumber: string;
    certificateNumber: string;
    issueDate: string;
    issuingAuthority: string;
    pdfPath: string;
    digitalSignatureHash: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { name: string; email: string; role: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
