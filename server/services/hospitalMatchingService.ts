import prisma from '../prisma/client.js';

export interface MatchingInput {
  applicationType: 'BIRTH' | 'DEATH';
  name: string;
  date: Date;
  gender: string;
  hospitalName?: string;
  hospitalRegNo?: string;
  placeOfEvent?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
}

export interface MatchResult {
  isMatched: boolean;
  matchScore: number; // 0 - 100
  status: 'HOSPITAL_MATCHED' | 'HOSPITAL_NOT_MATCHED';
  matchedHospitalReport: any | null;
  fieldMatches: {
    nameMatch: boolean;
    dateMatch: boolean;
    genderMatch: boolean;
    hospitalRegNoMatch: boolean;
    hospitalNameMatch: boolean;
    parentOrSpouseMatch: boolean;
    placeMatch: boolean;
  };
  summary: string;
}

function normalize(str?: string | null): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function areDatesSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export async function matchApplicationWithHospital(input: MatchingInput): Promise<MatchResult> {
  // Query all hospital reports of the same type
  const reports = await prisma.hospitalReport.findMany({
    where: {
      reportType: input.applicationType,
    },
    include: {
      hospital: true,
    },
  });

  let bestMatch: any | null = null;
  let highestScore = 0;
  let bestFieldMatches = {
    nameMatch: false,
    dateMatch: false,
    genderMatch: false,
    hospitalRegNoMatch: false,
    hospitalNameMatch: false,
    parentOrSpouseMatch: false,
    placeMatch: false,
  };

  const normInputName = normalize(input.name);
  const normInputRegNo = normalize(input.hospitalRegNo);
  const normInputHospital = normalize(input.hospitalName);
  const normInputFather = normalize(input.fatherName);
  const normInputMother = normalize(input.motherName);
  const normInputSpouse = normalize(input.spouseName);

  for (const report of reports) {
    let score = 0;
    const currentMatches = {
      nameMatch: false,
      dateMatch: false,
      genderMatch: false,
      hospitalRegNoMatch: false,
      hospitalNameMatch: false,
      parentOrSpouseMatch: false,
      placeMatch: false,
    };

    // 1. Hospital Registration No match (High weight: 35 points)
    if (normInputRegNo && normInputRegNo === normalize(report.hospitalRegistrationNo)) {
      currentMatches.hospitalRegNoMatch = true;
      score += 35;
    }

    // 2. Child / Deceased Name match (Weight: 25 points)
    const normReportName = normalize(report.childOrDeceasedName);
    if (normInputName && (normInputName === normReportName || normReportName.includes(normInputName) || normInputName.includes(normReportName))) {
      currentMatches.nameMatch = true;
      score += 25;
    }

    // 3. Date match (Weight: 20 points)
    if (areDatesSameDay(input.date, report.eventDate)) {
      currentMatches.dateMatch = true;
      score += 20;
    }

    // 4. Gender match (Weight: 10 points)
    if (input.gender && normalize(input.gender) === normalize(report.gender)) {
      currentMatches.genderMatch = true;
      score += 10;
    }

    // 5. Hospital Name match (Weight: 5 points)
    const normReportHospital = normalize(report.hospital?.hospitalName);
    if (normInputHospital && (normInputHospital.includes(normReportHospital) || normReportHospital.includes(normInputHospital))) {
      currentMatches.hospitalNameMatch = true;
      score += 5;
    }

    // 6. Parent or Spouse match (Weight: 5 points)
    const normReportFather = normalize(report.fatherName);
    const normReportMother = normalize(report.motherName);
    const normReportSpouse = normalize(report.spouseName);

    if (
      (normInputFather && normReportFather && normInputFather === normReportFather) ||
      (normInputMother && normReportMother && normInputMother === normReportMother) ||
      (normInputSpouse && normReportSpouse && normInputSpouse === normReportSpouse)
    ) {
      currentMatches.parentOrSpouseMatch = true;
      score += 5;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = report;
      bestFieldMatches = currentMatches;
    }
  }

  // Threshold for positive hospital match: 65+ (requires regNo or Name + Date + Gender match)
  const isMatched = highestScore >= 65 && bestMatch !== null;

  return {
    isMatched,
    matchScore: highestScore,
    status: isMatched ? 'HOSPITAL_MATCHED' : 'HOSPITAL_NOT_MATCHED',
    matchedHospitalReport: isMatched ? bestMatch : null,
    fieldMatches: bestFieldMatches,
    summary: isMatched
      ? `Positive match confirmed with authorized hospital record (${bestMatch.hospitalRegistrationNo}) at ${bestMatch.hospital?.hospitalName} with ${highestScore}% correlation.`
      : highestScore > 0
      ? `Partial correlation (${highestScore}%), but insufficient threshold. Routed to Manual Verification workflow for evidentiary review.`
      : `No corresponding hospital entry found in the municipal medical registry. Eligible for Home Birth/Death manual verification.`,
  };
}
