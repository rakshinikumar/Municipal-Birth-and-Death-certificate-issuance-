import prisma from '../prisma/client.js';

export interface DuplicateCheckInput {
  applicationId: string;
  applicationType: 'BIRTH' | 'DEATH';
  name: string;
  eventDate: Date;
  gender: string;
  parentOrSpouseName?: string;
  motherName?: string;
}

export interface DuplicateDetectionResult {
  hasPotentialDuplicate: boolean;
  highestSimilarityScore: number;
  matchedArchiveRecord: any | null;
  matchedFields: string[];
  notes: string;
}

function normalize(s?: string | null): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function checkDuplicateRecords(input: DuplicateCheckInput): Promise<DuplicateDetectionResult> {
  // Query existing digital archive entries
  const archiveRecords = await prisma.digitalArchive.findMany({
    where: {
      certificateType: input.applicationType,
      status: 'ACTIVE',
    },
  });

  let bestMatch: any | null = null;
  let highestScore = 0;
  let matchedFieldsList: string[] = [];

  const normName = normalize(input.name);
  const normParent = normalize(input.parentOrSpouseName);
  const normMother = normalize(input.motherName);

  for (const record of archiveRecords) {
    let score = 0;
    const currentMatches: string[] = [];

    const recNormName = normalize(record.subjectName);
    if (normName && (normName === recNormName || recNormName.includes(normName) || normName.includes(recNormName))) {
      score += 40;
      currentMatches.push('Subject Name');
    }

    const recDate = new Date(record.eventDate);
    const inputDate = new Date(input.eventDate);
    if (
      recDate.getFullYear() === inputDate.getFullYear() &&
      recDate.getMonth() === inputDate.getMonth() &&
      recDate.getDate() === inputDate.getDate()
    ) {
      score += 30;
      currentMatches.push('Date of Event');
    }

    if (input.gender && normalize(input.gender) === normalize(record.gender)) {
      score += 15;
      currentMatches.push('Gender');
    }

    const recParent = normalize(record.parentOrSpouseName);
    if (
      (normParent && recParent && (normParent.includes(recParent) || recParent.includes(normParent))) ||
      (normMother && recParent && (normMother.includes(recParent) || recParent.includes(normMother)))
    ) {
      score += 15;
      currentMatches.push('Parent / Spouse Record');
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = record;
      matchedFieldsList = currentMatches;
    }
  }

  const isDuplicateSuspicious = highestScore >= 70;

  if (isDuplicateSuspicious && bestMatch) {
    // Record in database duplicate_records table
    await prisma.duplicateRecord.create({
      data: {
        applicationId: input.applicationId,
        archiveRecordId: bestMatch.id,
        similarityScore: highestScore,
        matchedFieldsJson: JSON.stringify(matchedFieldsList),
        reviewDecision: 'PENDING',
        remarks: `Automated duplicate detection matched ${highestScore}% against active certificate #${bestMatch.registrationNumber} (${bestMatch.subjectName}). Officer review required.`,
      },
    });
  }

  return {
    hasPotentialDuplicate: isDuplicateSuspicious,
    highestSimilarityScore: highestScore,
    matchedArchiveRecord: isDuplicateSuspicious ? bestMatch : null,
    matchedFields: matchedFieldsList,
    notes: isDuplicateSuspicious
      ? `High similarity (${highestScore}%) found in municipal archives with certificate #${bestMatch.registrationNumber}. Subject: ${bestMatch.subjectName}.`
      : 'No duplicate records identified in municipal digital archive.',
  };
}
