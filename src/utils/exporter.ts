import * as XLSX from 'xlsx';
import { AggregatedRow, AggregationCriteria, NormalizedTrainingRecord, SummaryMetrics } from '../types';
import { formatDecimal, formatNumber, formatPercent, generateReportingSummaryText } from './calculator';

const CRITERIA_LABELS: Record<AggregationCriteria, string> = {
  course: '과정명',
  courseCohort: '과정명 (차수)',
  month: '운영월',
  quarter: '운영분기',
  category: '교육분야'
};

/**
 * Generate and download an Excel file with 3 worksheets
 */
export function exportToExcel(
  metrics: SummaryMetrics,
  aggregatedRows: AggregatedRow[],
  records: NormalizedTrainingRecord[],
  criteria: AggregationCriteria
): void {
  const wb = XLSX.utils.book_new();

  // 1. 핵심지표 시트
  const summaryText = generateReportingSummaryText(metrics);
  const kpiData: any[][] = [
    ['교육실적 통계 보고서 - 핵심 지표 요약'],
    ['생성일시', new Date().toLocaleString('ko-KR')],
    ['보고용 요약문', summaryText],
    [],
    ['지표명', '값', '단위/비고'],
    ['총 운영 과정 수', metrics.totalCourses, '개 과정'],
    ['총 운영 기수(차수)', metrics.totalCohorts, '개 기수'],
    ['총 입교인원', metrics.totalEnrolled > 0 ? metrics.totalEnrolled : '미제공', '명'],
    ['총 수료인원', metrics.totalCompleted, '명'],
    ['전체 수료율', metrics.overallCompletionRate !== undefined ? `${formatDecimal(metrics.overallCompletionRate)}%` : '미제공', '%'],
    ['총 교육실적(인시)', metrics.totalPersonHours > 0 ? metrics.totalPersonHours : '미제공', '인시 (수료인원 × 교육시간)'],
    ['평균 만족도', metrics.avgSatisfaction !== undefined ? formatDecimal(metrics.avgSatisfaction) : '미제공', metrics.satisfactionScale === '100' ? '점 (100점 만점)' : '점 (5.0점 만점)'],
    ['집계 기간', (metrics.periodStart && metrics.periodEnd) ? `${metrics.periodStart} ~ ${metrics.periodEnd}` : '전체']
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, '핵심지표');

  // 2. 상세통계 시트
  const primaryColName = CRITERIA_LABELS[criteria];
  const tableData: any[][] = [
    [
      primaryColName,
      ...(criteria === 'courseCohort' ? ['차수'] : []),
      '운영기수(회)',
      '입교인원(명)',
      '수료인원(명)',
      '수료율(%)',
      '교육시간(h)',
      '총 교육실적(인시)',
      `평균 만족도(${metrics.satisfactionScale === '100' ? '100점' : '5점'})`
    ]
  ];

  let sumCohorts = 0;
  let sumEnrolled = 0;
  let sumCompleted = 0;
  let sumPersonHours = 0;

  aggregatedRows.forEach(row => {
    sumCohorts += row.cohortCount;
    sumEnrolled += row.enrolledTotal;
    sumCompleted += row.completedTotal;
    sumPersonHours += row.personHoursTotal;

    const rowArr: any[] = [
      row.name,
      ...(criteria === 'courseCohort' ? [row.subName || ''] : []),
      row.cohortCount,
      row.enrolledTotal > 0 ? row.enrolledTotal : '',
      row.completedTotal,
      row.completionRate !== undefined ? Number(row.completionRate.toFixed(1)) : '',
      row.hoursTotal > 0 ? Number(row.hoursTotal.toFixed(1)) : '',
      row.personHoursTotal > 0 ? row.personHoursTotal : '',
      row.avgSatisfaction !== undefined ? Number(row.avgSatisfaction.toFixed(1)) : ''
    ];
    tableData.push(rowArr);
  });

  // Add 합계 행
  const totalCompletionRate = sumEnrolled > 0 ? Number(((sumCompleted / sumEnrolled) * 100).toFixed(1)) : '';
  const totalRow: any[] = [
    '합계',
    ...(criteria === 'courseCohort' ? ['-'] : []),
    sumCohorts,
    sumEnrolled > 0 ? sumEnrolled : '',
    sumCompleted,
    totalCompletionRate,
    '-',
    sumPersonHours > 0 ? sumPersonHours : '',
    metrics.avgSatisfaction !== undefined ? Number(metrics.avgSatisfaction.toFixed(1)) : ''
  ];
  tableData.push(totalRow);

  const wsTable = XLSX.utils.aoa_to_sheet(tableData);
  XLSX.utils.book_append_sheet(wb, wsTable, '상세통계');

  // 3. 정제데이터 시트 (Normalized Records)
  const rawData: any[][] = [
    [
      '교육과정명',
      '기수/차수',
      '교육분야',
      '교육시작일',
      '운영월',
      '운영분기',
      '교육시간(h)',
      '입교인원(명)',
      '수료인원(명)',
      '수료율(%)',
      '만족도',
      '교육실적(인시)'
    ]
  ];

  records.forEach(r => {
    const rate = (r.enrolled && r.enrolled > 0)
      ? Number(((r.completed / r.enrolled) * 100).toFixed(1))
      : '';

    rawData.push([
      r.courseName,
      r.cohort,
      r.category || '',
      r.startDate || '',
      r.yearMonth || '',
      r.quarter || '',
      r.hours ?? '',
      r.enrolled ?? '',
      r.completed,
      rate,
      r.satisfaction ?? '',
      r.personHours ?? ''
    ]);
  });

  const wsRaw = XLSX.utils.aoa_to_sheet(rawData);
  XLSX.utils.book_append_sheet(wb, wsRaw, '정제데이터');

  // Save File
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `교육실적_통계보고서_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Format Aggregated Table as Tab-Separated Text (TSV) for clean pasting into Excel or Korean Hancom Office (한글)
 */
export function generateTsvTable(
  aggregatedRows: AggregatedRow[],
  metrics: SummaryMetrics,
  criteria: AggregationCriteria
): string {
  const primaryCol = CRITERIA_LABELS[criteria];
  const isCohort = criteria === 'courseCohort';

  const headers = [
    primaryCol,
    ...(isCohort ? ['차수'] : []),
    '운영기수(회)',
    '입교인원(명)',
    '수료인원(명)',
    '수료율(%)',
    '교육시간(h)',
    '총 교육실적(인시)',
    `평균 만족도(${metrics.satisfactionScale === '100' ? '100점' : '5점'})`
  ];

  const lines: string[] = [headers.join('\t')];

  let sumCohorts = 0;
  let sumEnrolled = 0;
  let sumCompleted = 0;
  let sumPersonHours = 0;

  aggregatedRows.forEach(r => {
    sumCohorts += r.cohortCount;
    sumEnrolled += r.enrolledTotal;
    sumCompleted += r.completedTotal;
    sumPersonHours += r.personHoursTotal;

    const row = [
      r.name,
      ...(isCohort ? [r.subName || ''] : []),
      formatNumber(r.cohortCount),
      r.enrolledTotal > 0 ? formatNumber(r.enrolledTotal) : '-',
      formatNumber(r.completedTotal),
      r.completionRate !== undefined ? formatPercent(r.completionRate) : '-',
      r.hoursTotal > 0 ? formatDecimal(r.hoursTotal) : '-',
      r.personHoursTotal > 0 ? formatNumber(r.personHoursTotal) : '-',
      r.avgSatisfaction !== undefined ? formatDecimal(r.avgSatisfaction) : '-'
    ];
    lines.push(row.join('\t'));
  });

  // Total summary row
  const overallRate = sumEnrolled > 0 ? formatPercent((sumCompleted / sumEnrolled) * 100) : '-';
  const totalRow = [
    '합계',
    ...(isCohort ? ['-'] : []),
    formatNumber(sumCohorts),
    sumEnrolled > 0 ? formatNumber(sumEnrolled) : '-',
    formatNumber(sumCompleted),
    overallRate,
    '-',
    sumPersonHours > 0 ? formatNumber(sumPersonHours) : '-',
    metrics.avgSatisfaction !== undefined ? formatDecimal(metrics.avgSatisfaction) : '-'
  ];
  lines.push(totalRow.join('\t'));

  return lines.join('\n');
}

/**
 * Copy text to clipboard helper with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for iframe environments if clipboard API is restricted
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
