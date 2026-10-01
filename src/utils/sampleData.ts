import { ColumnMapping, NormalizedTrainingRecord } from '../types';

export interface SampleDataPackage {
  headers: string[];
  headerIndex: number;
  rawRows: any[][];
  mapping: ColumnMapping;
  records: NormalizedTrainingRecord[];
  satisfactionScale: '5' | '100';
}

export function generateSampleData(): SampleDataPackage {
  const headers = [
    '교육과정명',
    '운영차수',
    '교육분야',
    '교육시작일',
    '교육시간(h)',
    '입교인원(명)',
    '수료인원(명)',
    '만족도(5점)'
  ];

  // 8 courses, 30 cohorts from 2026-01 to 2026-09
  const rawDataRows: any[][] = [
    // 1. 생성형 AI 활용 공공행정 실무 (디지털혁신, 16h)
    ['생성형 AI 활용 공공행정 실무', '1기', '디지털혁신', '2026-01-15', 16, 35, 34, 4.8],
    ['생성형 AI 활용 공공행정 실무', '2기', '디지털혁신', '2026-03-12', 16, 40, 39, 4.9],
    ['생성형 AI 활용 공공행정 실무', '3기', '디지털혁신', '2026-06-18', 16, 38, 37, 4.7],
    ['생성형 AI 활용 공공행정 실무', '4기', '디지털혁신', '2026-09-10', 16, 42, 41, 4.9],

    // 2. 공공기관 예산·회계 실무 심화 (직무전문, 21h)
    ['공공기관 예산·회계 실무 심화', '1기', '직무전문', '2026-02-10', 21, 30, 29, 4.5],
    ['공공기관 예산·회계 실무 심화', '2기', '직무전문', '2026-04-14', 21, 32, 31, 4.6],
    ['공공기관 예산·회계 실무 심화', '3기', '직무전문', '2026-07-08', 21, 30, 28, 4.4],
    ['공공기관 예산·회계 실무 심화', '4기', '직무전문', '2026-09-16', 21, 28, 25, 3.9], // Notice satisfaction < 4.0 for testing warning highlight!

    // 3. 청렴윤리 및 이해충돌방지 실천 (공직가치, 7h)
    ['청렴윤리 및 이해충돌방지 실천', '1기', '공직가치', '2026-01-22', 7, 50, 50, 4.6],
    ['청렴윤리 및 이해충돌방지 실천', '2기', '공직가치', '2026-03-26', 7, 55, 54, 4.7],
    ['청렴윤리 및 이해충돌방지 실천', '3기', '공직가치', '2026-05-21', 7, 52, 51, 4.5],
    ['청렴윤리 및 이해충돌방지 실천', '4기', '공직가치', '2026-07-23', 7, 48, 47, 4.6],
    ['청렴윤리 및 이해충돌방지 실천', '5기', '공직가치', '2026-08-27', 7, 53, 52, 4.8],

    // 4. 중간관리자 리더십 및 성과관리 (리더십, 14h)
    ['중간관리자 리더십 및 성과관리', '1기', '리더십', '2026-02-19', 14, 25, 24, 4.6],
    ['중간관리자 리더십 및 성과관리', '2기', '리더십', '2026-04-23', 14, 28, 27, 4.7],
    ['중간관리자 리더십 및 성과관리', '3기', '리더십', '2026-06-25', 14, 26, 25, 4.5],
    ['중간관리자 리더십 및 성과관리', '4기', '리더십', '2026-09-24', 14, 30, 29, 4.6],

    // 5. 공문서·보고서 작성 및 기획력 향상 (공통역량, 14h)
    ['공문서·보고서 작성 및 기획력 향상', '1기', '공통역량', '2026-01-28', 14, 35, 30, 4.3], // 30/35 = 85.7% < 90% for completion rate warning test!
    ['공문서·보고서 작성 및 기획력 향상', '2기', '공통역량', '2026-03-18', 14, 36, 35, 4.6],
    ['공문서·보고서 작성 및 기획력 향상', '3기', '공통역량', '2026-05-13', 14, 38, 37, 4.7],
    ['공문서·보고서 작성 및 기획력 향상', '4기', '공통역량', '2026-07-15', 14, 35, 34, 4.5],
    ['공문서·보고서 작성 및 기획력 향상', '5기', '공통역량', '2026-09-02', 14, 40, 39, 4.8],

    // 6. 공공 데이터 분석과 시각화 기초 (디지털혁신, 21h)
    ['공공 데이터 분석과 시각화 기초', '1기', '디지털혁신', '2026-02-25', 21, 24, 23, 4.7],
    ['공공 데이터 분석과 시각화 기초', '2기', '디지털혁신', '2026-05-27', 21, 25, 24, 4.8],
    ['공공 데이터 분석과 시각화 기초', '3기', '디지털혁신', '2026-08-19', 21, 26, 25, 4.9],

    // 7. 신임 실무자 온보딩 및 기본소양 (신임자, 28h)
    ['신임 실무자 온보딩 및 기본소양', '1기', '신임자', '2026-01-07', 28, 45, 45, 4.7],
    ['신임 실무자 온보딩 및 기본소양', '2기', '신임자', '2026-04-01', 28, 42, 42, 4.8],
    ['신임 실무자 온보딩 및 기본소양', '3기', '신임자', '2026-07-01', 28, 44, 43, 4.6],

    // 8. 악성민원 대응 및 감정노동 힐링 (직무전문, 7h)
    ['악성민원 대응 및 감정노동 힐링', '1기', '직무전문', '2026-03-05', 7, 30, 29, 4.8],
    ['악성민원 대응 및 감정노동 힐링', '2기', '직무전문', '2026-06-11', 7, 32, 31, 4.9]
  ];

  // Top title / summary row to simulate real excel download with title headers
  const fullRows: any[][] = [
    ['2026년도 상반기-3분기 공공인재 교육훈련 운영실적 집계표', '', '', '', '', '', '', ''],
    ['[안내] 본 표는 교육운영시스템 원장 데이터입니다.', '', '', '', '', '', '', ''],
    headers,
    ...rawDataRows,
    ['합계', '', '', '', '', 1081, 1044, 4.65] // Simulated summary row to test filtering out summary row!
  ];

  const mapping: ColumnMapping = {
    courseName: '교육과정명',
    cohort: '운영차수',
    category: '교육분야',
    startDate: '교육시작일',
    hours: '교육시간(h)',
    enrolled: '입교인원(명)',
    completed: '수료인원(명)',
    satisfaction: '만족도(5점)'
  };

  const records: NormalizedTrainingRecord[] = rawDataRows.map((r, idx) => {
    const [cName, cohort, category, dateStr, hours, enrolled, completed, sat] = r;
    const [y, m] = dateStr.split('-');
    const qNum = Math.ceil(parseInt(m, 10) / 3);

    return {
      id: `sample-${idx + 1}`,
      courseName: cName,
      cohort: cohort,
      category: category,
      startDate: dateStr,
      yearMonth: `${y}-${m}`,
      quarter: `${y}-Q${qNum}`,
      hours: hours,
      enrolled: enrolled,
      completed: completed,
      satisfaction: sat,
      personHours: completed * hours,
      raw: {
        '교육과정명': cName,
        '운영차수': cohort,
        '교육분야': category,
        '교육시작일': dateStr,
        '교육시간(h)': hours,
        '입교인원(명)': enrolled,
        '수료인원(명)': completed,
        '만족도(5점)': sat
      }
    };
  });

  return {
    headers,
    headerIndex: 2,
    rawRows: fullRows,
    mapping,
    records,
    satisfactionScale: '5'
  };
}
