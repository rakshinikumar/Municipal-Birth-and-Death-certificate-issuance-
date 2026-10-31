export interface ValidationCheck {
  field: string;
  check: string;
  passed: boolean;
  message: string;
}

export interface ApplicationValidationResult {
  isValid: boolean;
  score: number;
  checks: ValidationCheck[];
  summary: string;
}

export function validateApplicationData(
  applicationType: 'BIRTH' | 'DEATH',
  data: any,
  documentsCount: number
): ApplicationValidationResult {
  const checks: ValidationCheck[] = [];
  let passedCount = 0;

  // 1. Mandatory Name check
  const subjectName = applicationType === 'BIRTH' ? data.childName : data.deceasedName;
  if (subjectName && subjectName.trim().length >= 2) {
    checks.push({ field: 'name', check: 'Subject Name Length & Completeness', passed: true, message: 'Valid name provided.' });
    passedCount++;
  } else {
    checks.push({ field: 'name', check: 'Subject Name Length & Completeness', passed: false, message: 'Full legal name is required (min 2 characters).' });
  }

  // 2. Date sanity check
  const eventDate = new Date(applicationType === 'BIRTH' ? data.dateOfBirth : data.dateOfDeath);
  const now = new Date();
  if (!isNaN(eventDate.getTime()) && eventDate <= now) {
    checks.push({ field: 'eventDate', check: 'Event Date Temporal Validity', passed: true, message: 'Date is valid and not in the future.' });
    passedCount++;
  } else {
    checks.push({ field: 'eventDate', check: 'Event Date Temporal Validity', passed: false, message: 'Event date cannot be in the future.' });
  }

  // 3. Gender validation
  const gender = data.gender;
  if (['Male', 'Female', 'Other'].includes(gender)) {
    checks.push({ field: 'gender', check: 'Gender Classification', passed: true, message: 'Standard gender classification selected.' });
    passedCount++;
  } else {
    checks.push({ field: 'gender', check: 'Gender Classification', passed: false, message: 'Valid gender selection required.' });
  }

  // 4. Place of event
  const place = applicationType === 'BIRTH' ? data.placeOfBirth : data.placeOfDeath;
  if (place && place.trim().length >= 3) {
    checks.push({ field: 'place', check: 'Place of Event Specification', passed: true, message: 'Place of occurrence recorded.' });
    passedCount++;
  } else {
    checks.push({ field: 'place', check: 'Place of Event Specification', passed: false, message: 'Location/address of event is required.' });
  }

  // 5. Supporting documents verification
  if (documentsCount >= 1) {
    checks.push({ field: 'documents', check: 'Supporting Documentation Uploaded', passed: true, message: `${documentsCount} document(s) uploaded.` });
    passedCount++;
  } else {
    checks.push({ field: 'documents', check: 'Supporting Documentation Uploaded', passed: false, message: 'At least one verified supporting document is required.' });
  }

  // 6. Birth / Death specific validation
  if (applicationType === 'BIRTH') {
    if (data.fatherName && data.motherName) {
      checks.push({ field: 'parents', check: 'Parental Lineage Records', passed: true, message: 'Both parents details recorded.' });
      passedCount++;
    } else {
      checks.push({ field: 'parents', check: 'Parental Lineage Records', passed: false, message: 'Father and Mother names are required for official registration.' });
    }
  } else {
    if (data.causeOfDeath && data.causeOfDeath.trim().length >= 3) {
      checks.push({ field: 'causeOfDeath', check: 'Medical Cause of Death Recorded', passed: true, message: 'Certified cause of death provided.' });
      passedCount++;
    } else {
      checks.push({ field: 'causeOfDeath', check: 'Medical Cause of Death Recorded', passed: false, message: 'Cause of death certified details required.' });
    }

    if (data.informantName && data.informantName.trim().length >= 2) {
      checks.push({ field: 'informant', check: 'Designated Informant Information', passed: true, message: 'Authorized informant registered.' });
      passedCount++;
    } else {
      checks.push({ field: 'informant', check: 'Designated Informant Information', passed: false, message: 'Informant name is mandatory.' });
    }
  }

  const totalChecks = checks.length;
  const score = Math.round((passedCount / totalChecks) * 100);
  const isValid = passedCount === totalChecks;

  return {
    isValid,
    score,
    checks,
    summary: isValid
      ? 'All mandatory legal and evidentiary criteria validated successfully.'
      : `${totalChecks - passedCount} validation requirement(s) pending correction.`,
  };
}
