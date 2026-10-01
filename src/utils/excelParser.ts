import * as XLSX from 'xlsx';
import { ColumnMapping, FieldDefinition, NormalizedTrainingRecord, StandardField } from '../types';

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    key: 'courseName',
    label: '교육과정명',
    required: true,
    description: '과정명 또는 프로그램명',
    keywords: ['과정', '과정명', '교육과정', '교육과정명', '프로그램명', '연수과정', '과목명'],
    excludeKeywords: ['유형', '분야', '구분', '코드', '과정코드']
  },
  {
    key: 'cohort',
    label: '기수 (차수)',
    required: false,
    description: '기수, 차수, 회차 번호',
    keywords: ['차수', '기수', '회차', '기', '차', '운영차수', '교육기수', '기수/차수'],
  },
  {
    key: 'completed',
    label: '수료인원',
    required: true,
    description: '과정을 수료한 인원수',
    keywords: ['수료인원', '수료자수', '수료자', '수료인원(명)', '수료', '수료(명)'],
    excludeKeywords: ['수료율', '수료률', '수료율(%)', '비율', '미수료']
  },
  {
    key: 'satisfaction',
    label: '만족도',
    required: false,
    description: '설문 평균 만족도 점수',
    keywords: ['만족도', '만족', '평가점수', '설문점수', '만족도점수', '만족도(점)', '만족도(5점)', '평균만족도'],
    excludeKeywords: ['응답수', '인원', '응답자']
  },
  {
    key: 'enrolled',
    label: '입교인원',
    required: false,
    description: '입교, 신청, 등록한 학습자 수',
    keywords: ['입교인원', '입교', '교육인원', '신청인원', '등록인원', '선발인원', '정원', '참여인원', '입교(명)'],
    excludeKeywords: ['수료']
  },
  {
    key: 'hours',
    label: '교육시간',
    required: true,
    description: '과정 총 교육시간(시수, 필수)',
    keywords: ['교육시간', '시수', '시간', '총시간', '인정시간', '교육시수', '시간(H)', '시간(h)', '교육시간(h)', '교육시간(H)'],
    excludeKeywords: ['시작', '종료', '일시']
  },
  {
    key: 'startDate',
    label: '교육시작일 (기간)',
    required: false,
    description: '교육 시작일자 또는 교육 운영기간',
    keywords: ['교육시작일', '시작일', '시작일자', '개강일', '개강일자', '교육기간', '연수기간', '일자', '일시', '기간'],
    excludeKeywords: ['시간', '종료일']
  },
  {
    key: 'category',
    label: '교육유형 (분야)',
    required: false,
    description: '직무분야, 교육구분, 과정분류',
    keywords: ['교육유형', '유형', '분야', '교육분야', '과정분야', '직무분야', '구분', '교육구분', '분류', '과정구분'],
    excludeKeywords: ['대상', '장소']
  }
];

/**
 * Clean numeric string with units (e.g., "1,200명", "4.8점", "98.5%", "16시간")
 */
export function parseNumeric(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') {
    return isNaN(val) ? undefined : val;
  }
  const str = String(val).trim();
  if (!str) return undefined;
  
  // Extract signed floating point number
  // Removes commas and units like 명, 점, %, 시간, H, etc.
  const cleaned = str.replace(/,/g, '').replace(/[^\d.-]/g, '');
  if (!cleaned) return undefined;
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse various date formats:
 * - Excel serial number
 * - "2026-03-02", "2026.03.02", "2026/03/02"
 * - "2026.03.02~03.06", "2026-03-02 ~ 2026-03-06"
 * - "20260302"
 */
export function parseTrainingDate(val: any): { fullDate?: string; yearMonth?: string; quarter?: string } {
  if (val === null || val === undefined) return {};
  
  // Handle Excel date serial numbers
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj) {
        const y = String(dateObj.y).padStart(4, '20');
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        const fullDate = `${y}-${m}-${d}`;
        const yearMonth = `${y}-${m}`;
        const qNum = Math.ceil(dateObj.m / 3);
        const quarter = `${y}-Q${qNum}`;
        return { fullDate, yearMonth, quarter };
      }
    } catch {
      // Fallback
    }
  }

  const str = String(val).trim();
  if (!str) return {};

  // If period format like "2026.03.02~03.06" or "2026-03-02 ~ 2026-03-06", take the start date
  const firstPart = str.split(/[~–—]/)[0].trim();

  // Pattern 1: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
  const ymdMatch = firstPart.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    const fullDate = `${y}-${m}-${d}`;
    const yearMonth = `${y}-${m}`;
    const qNum = Math.ceil(parseInt(m, 10) / 3);
    const quarter = `${y}-Q${qNum}`;
    return { fullDate, yearMonth, quarter };
  }

  // Pattern 2: YYYY-MM, YYYY.MM
  const ymMatch = firstPart.match(/(\d{4})[./-](\d{1,2})/);
  if (ymMatch) {
    const y = ymMatch[1];
    const m = ymMatch[2].padStart(2, '0');
    const yearMonth = `${y}-${m}`;
    const qNum = Math.ceil(parseInt(m, 10) / 3);
    const quarter = `${y}-Q${qNum}`;
    return { fullDate: `${y}-${m}-01`, yearMonth, quarter };
  }

  // Pattern 3: Compact 8-digit "20260302"
  const compactMatch = firstPart.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const y = compactMatch[1];
    const m = compactMatch[2];
    const d = compactMatch[3];
    const fullDate = `${y}-${m}-${d}`;
    const yearMonth = `${y}-${m}`;
    const qNum = Math.ceil(parseInt(m, 10) / 3);
    const quarter = `${y}-Q${qNum}`;
    return { fullDate, yearMonth, quarter };
  }

  return {};
}

/**
 * Scan top rows (up to 10) to detect the most probable header row
 */
export function detectHeaderRow(rows: any[][]): { headerIndex: number; headers: string[] } {
  const maxRows = Math.min(rows.length, 10);
  let bestIndex = 0;
  let maxScore = -1;
  let bestHeaders: string[] = [];

  for (let i = 0; i < maxRows; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    let score = 0;
    const strValues = row.map(cell => String(cell || '').trim());

    // Evaluate how many standard fields match this row's values
    FIELD_DEFINITIONS.forEach(def => {
      const hasMatch = strValues.some(val => {
        if (!val) return false;
        const normalized = val.toLowerCase().replace(/\s+/g, '');
        // Check exclude keywords
        if (def.excludeKeywords?.some(ex => normalized.includes(ex.toLowerCase()))) {
          return false;
        }
        return def.keywords.some(kw => normalized.includes(kw.toLowerCase()));
      });

      if (hasMatch) {
        score += def.required ? 3 : 1;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
      bestHeaders = strValues;
    }
  }

  // If headers contain empty strings or duplicates, make them unique
  const cleanHeaders = bestHeaders.map((h, idx) => h || `열_${idx + 1}`);

  return {
    headerIndex: bestIndex,
    headers: cleanHeaders
  };
}

/**
 * Auto-match headers to standard fields
 */
export function autoMatchColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    courseName: '',
    cohort: '',
    completed: '',
    satisfaction: '',
    category: '',
    startDate: '',
    hours: '',
    enrolled: ''
  };

  const usedHeaders = new Set<string>();

  // Process required fields first, then optional fields
  const sortedDefs = [...FIELD_DEFINITIONS].sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));

  for (const def of sortedDefs) {
    let bestHeader = '';
    let bestPriority = -1;

    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const cleanHeader = header.trim().toLowerCase().replace(/\s+/g, '');

      // Check exclude rules
      if (def.excludeKeywords?.some(ex => cleanHeader.includes(ex.toLowerCase()))) {
        continue;
      }

      // Check exact match first
      for (let k = 0; k < def.keywords.length; k++) {
        const kw = def.keywords[k].toLowerCase();
        if (cleanHeader === kw) {
          const priority = 100 - k;
          if (priority > bestPriority) {
            bestPriority = priority;
            bestHeader = header;
          }
        } else if (cleanHeader.includes(kw)) {
          const priority = 50 - k;
          if (priority > bestPriority) {
            bestPriority = priority;
            bestHeader = header;
          }
        }
      }
    }

    if (bestHeader) {
      mapping[def.key] = bestHeader;
      usedHeaders.add(bestHeader);
    }
  }

  return mapping;
}

/**
 * Check if a row should be excluded:
 * - Empty course name
 * - "합계", "소계", "총계", "계", "Total"
 */
export function isSummaryOrEmptyRow(courseNameVal: any): boolean {
  if (!courseNameVal) return true;
  const str = String(courseNameVal).trim();
  if (!str) return true;
  
  const lower = str.toLowerCase();
  const summaryKeywords = ['합계', '소계', '총계', '계', '평균', 'total', 'subtotal', 'sum'];
  if (summaryKeywords.includes(lower)) return true;
  if (/^(합계|소계|총계|계)\s*$/.test(str)) return true;
  if (lower.startsWith('합계(') || lower.startsWith('총계(')) return true;

  return false;
}

/**
 * Normalize raw rows with the selected column mapping
 */
export function normalizeExcelData(
  rawData: any[][],
  headerIndex: number,
  mapping: ColumnMapping,
  availableHeaders: string[]
): {
  records: NormalizedTrainingRecord[];
  skippedSummaryRows: number;
  totalParsedRows: number;
  satisfactionScale: '5' | '100';
} {
  const dataRows = rawData.slice(headerIndex + 1);
  const records: NormalizedTrainingRecord[] = [];
  let skippedSummaryRows = 0;
  let maxSatisfaction = 0;

  dataRows.forEach((row, rowIndex) => {
    if (!row || row.length === 0) return;

    // Convert row array to key-value object using availableHeaders
    const rawObj: Record<string, any> = {};
    availableHeaders.forEach((h, colIdx) => {
      rawObj[h] = row[colIdx];
    });

    // Extract Course Name
    const courseRaw = mapping.courseName ? rawObj[mapping.courseName] : '';
    if (isSummaryOrEmptyRow(courseRaw)) {
      if (courseRaw) skippedSummaryRows++;
      return;
    }
    const courseName = String(courseRaw).trim();

    // Completed
    const completedRaw = mapping.completed ? rawObj[mapping.completed] : undefined;
    const completedNum = parseNumeric(completedRaw) ?? 0;

    // Enrolled
    const enrolledRaw = mapping.enrolled ? rawObj[mapping.enrolled] : undefined;
    const enrolledNum = parseNumeric(enrolledRaw);

    // Cohort
    const cohortRaw = mapping.cohort ? rawObj[mapping.cohort] : '';
    let cohortStr = String(cohortRaw ?? '').trim();
    if (cohortStr && !cohortStr.endsWith('기') && !cohortStr.endsWith('차') && /^\d+$/.test(cohortStr)) {
      cohortStr = `${cohortStr}기`;
    }

    // Satisfaction
    const satRaw = mapping.satisfaction ? rawObj[mapping.satisfaction] : undefined;
    const satNum = parseNumeric(satRaw);
    if (satNum !== undefined && satNum > maxSatisfaction) {
      maxSatisfaction = satNum;
    }

    // Hours
    const hoursRaw = mapping.hours ? rawObj[mapping.hours] : undefined;
    const hoursNum = parseNumeric(hoursRaw);

    // Person hours
    const personHours = (hoursNum !== undefined && completedNum > 0)
      ? Math.round(completedNum * hoursNum)
      : undefined;

    // Category
    const categoryRaw = mapping.category ? rawObj[mapping.category] : '';
    const category = categoryRaw ? String(categoryRaw).trim() : undefined;

    // Start Date & Period
    const dateRaw = mapping.startDate ? rawObj[mapping.startDate] : undefined;
    const { fullDate, yearMonth, quarter } = parseTrainingDate(dateRaw);

    records.push({
      id: `rec-${rowIndex + 1}`,
      courseName,
      cohort: cohortStr || '1기',
      completed: completedNum,
      enrolled: enrolledNum,
      satisfaction: satNum,
      category,
      startDate: fullDate,
      yearMonth,
      quarter,
      hours: hoursNum,
      personHours,
      raw: rawObj
    });
  });

  // Determine scale: if max value > 5.5, it is 100-point scale
  const satisfactionScale: '5' | '100' = maxSatisfaction > 5.5 ? '100' : '5';

  return {
    records,
    skippedSummaryRows,
    totalParsedRows: dataRows.length,
    satisfactionScale
  };
}

/**
 * Read uploaded file buffer or ArrayBuffer and parse as sheet
 */
export async function parseExcelFile(file: File): Promise<{
  sheetNames: string[];
  rawRows: any[][];
  headers: string[];
  headerIndex: number;
  initialMapping: ColumnMapping;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('엑셀 파일에 유효한 시트가 없습니다.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Read as 2D array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('시트에 데이터가 존재하지 않습니다.');
  }

  const { headerIndex, headers } = detectHeaderRow(rawRows);
  const initialMapping = autoMatchColumns(headers);

  return {
    sheetNames: workbook.SheetNames,
    rawRows,
    headers,
    headerIndex,
    initialMapping
  };
}
