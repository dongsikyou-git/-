import { AggregatedRow, AggregationCriteria, NormalizedTrainingRecord, SummaryMetrics } from '../types';

/**
 * Format numbers with commas
 */
export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return new Intl.NumberFormat('ko-KR').format(Math.round(val));
}

/**
 * Format decimal to 1 decimal place
 */
export function formatDecimal(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return Number(val).toFixed(1);
}

/**
 * Format percentage
 */
export function formatPercent(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return `${Number(val).toFixed(1)}%`;
}

/**
 * Calculate weighted satisfaction
 */
export function calculateWeightedSatisfaction(records: NormalizedTrainingRecord[]): number | undefined {
  const valid = records.filter(r => r.satisfaction !== undefined && !isNaN(r.satisfaction));
  if (valid.length === 0) return undefined;

  let totalWeighted = 0;
  let totalWeight = 0;
  let hasValidWeight = false;

  valid.forEach(r => {
    const weight = (r.completed && r.completed > 0) ? r.completed : 0;
    if (weight > 0) {
      hasValidWeight = true;
      totalWeighted += (r.satisfaction! * weight);
      totalWeight += weight;
    }
  });

  if (hasValidWeight && totalWeight > 0) {
    return totalWeighted / totalWeight;
  }

  // Fallback to simple average
  const sum = valid.reduce((acc, r) => acc + r.satisfaction!, 0);
  return sum / valid.length;
}

/**
 * Filter records by period, search query, category
 */
export function filterRecords(
  records: NormalizedTrainingRecord[],
  startYearMonth: string,
  endYearMonth: string,
  searchQuery: string,
  selectedCategory: string
): NormalizedTrainingRecord[] {
  const query = searchQuery.trim().toLowerCase();

  return records.filter(record => {
    // Search query (course name or cohort)
    if (query) {
      const matchCourse = record.courseName.toLowerCase().includes(query);
      const matchCohort = record.cohort.toLowerCase().includes(query);
      const matchCat = (record.category || '').toLowerCase().includes(query);
      if (!matchCourse && !matchCohort && !matchCat) return false;
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      if (record.category !== selectedCategory) return false;
    }

    // Period filter (only if record has yearMonth)
    if (record.yearMonth) {
      if (startYearMonth && record.yearMonth < startYearMonth) return false;
      if (endYearMonth && record.yearMonth > endYearMonth) return false;
    }

    return true;
  });
}

/**
 * Calculate Summary Metrics (KPIs)
 */
export function computeSummaryMetrics(
  records: NormalizedTrainingRecord[],
  satisfactionScale: '5' | '100'
): SummaryMetrics {
  const uniqueCourses = new Set(records.map(r => r.courseName));
  const totalCourses = uniqueCourses.size;
  const totalCohorts = records.length;

  let totalEnrolled = 0;
  let hasEnrolledData = false;
  let totalCompleted = 0;
  let totalPersonHours = 0;

  const validDates: string[] = [];

  records.forEach(r => {
    if (r.enrolled !== undefined && !isNaN(r.enrolled)) {
      totalEnrolled += r.enrolled;
      hasEnrolledData = true;
    }
    totalCompleted += (r.completed || 0);
    if (r.personHours !== undefined && !isNaN(r.personHours)) {
      totalPersonHours += r.personHours;
    } else if (r.hours !== undefined && !isNaN(r.hours)) {
      totalPersonHours += (r.completed || 0) * r.hours;
    }

    if (r.yearMonth) {
      validDates.push(r.yearMonth);
    }
  });

  const overallCompletionRate = (hasEnrolledData && totalEnrolled > 0)
    ? (totalCompleted / totalEnrolled) * 100
    : undefined;

  const avgSatisfaction = calculateWeightedSatisfaction(records);

  validDates.sort();
  const periodStart = validDates.length > 0 ? validDates[0] : undefined;
  const periodEnd = validDates.length > 0 ? validDates[validDates.length - 1] : undefined;

  return {
    totalCourses,
    totalCohorts,
    totalEnrolled: hasEnrolledData ? totalEnrolled : 0,
    totalCompleted,
    overallCompletionRate,
    totalPersonHours,
    avgSatisfaction,
    satisfactionScale,
    periodStart,
    periodEnd
  };
}

/**
 * Group & aggregate records by criteria
 */
export function aggregateRecords(
  records: NormalizedTrainingRecord[],
  criteria: AggregationCriteria
): AggregatedRow[] {
  const groupMap = new Map<string, {
    name: string;
    subName?: string;
    records: NormalizedTrainingRecord[];
  }>();

  records.forEach(r => {
    let key = '';
    let name = '';
    let subName: string | undefined = undefined;

    switch (criteria) {
      case 'course':
        key = r.courseName || '미지정 과정';
        name = key;
        break;
      case 'courseCohort':
        key = `${r.courseName || '미지정'}__${r.cohort || '1기'}`;
        name = r.courseName || '미지정';
        subName = r.cohort || '1기';
        break;
      case 'month':
        key = r.yearMonth || '일자 미지정';
        name = r.yearMonth ? `${r.yearMonth.slice(0, 4)}년 ${parseInt(r.yearMonth.slice(5), 10)}월` : '일자 미지정';
        break;
      case 'quarter':
        key = r.quarter || '분기 미지정';
        if (r.quarter && r.quarter.includes('-Q')) {
          const [yr, q] = r.quarter.split('-Q');
          name = `${yr}년 ${q}분기`;
        } else {
          name = '분기 미지정';
        }
        break;
      case 'category':
        key = r.category || '기타/미분류';
        name = key;
        break;
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, { name, subName, records: [] });
    }
    groupMap.get(key)!.records.push(r);
  });

  const result: AggregatedRow[] = [];

  groupMap.forEach((group, key) => {
    const list = group.records;
    const cohortCount = list.length;
    let enrolledTotal = 0;
    let hasEnrolled = false;
    let completedTotal = 0;
    let personHoursTotal = 0;
    let totalHoursSum = 0;
    let hoursCount = 0;

    list.forEach(r => {
      if (r.enrolled !== undefined && !isNaN(r.enrolled)) {
        enrolledTotal += r.enrolled;
        hasEnrolled = true;
      }
      completedTotal += (r.completed || 0);

      if (r.hours !== undefined && !isNaN(r.hours)) {
        totalHoursSum += r.hours;
        hoursCount++;
      }

      if (r.personHours !== undefined && !isNaN(r.personHours)) {
        personHoursTotal += r.personHours;
      } else if (r.hours !== undefined && !isNaN(r.hours)) {
        personHoursTotal += (r.completed || 0) * r.hours;
      }
    });

    const completionRate = (hasEnrolled && enrolledTotal > 0)
      ? (completedTotal / enrolledTotal) * 100
      : undefined;

    const avgSat = calculateWeightedSatisfaction(list);
    const validSatCount = list.filter(r => r.satisfaction !== undefined).length;

    // For hours, show average hours per session or sum
    const avgHours = hoursCount > 0 ? (totalHoursSum / hoursCount) : 0;

    result.push({
      key,
      name: group.name,
      subName: group.subName,
      cohortCount,
      enrolledTotal: hasEnrolled ? enrolledTotal : 0,
      completedTotal,
      completionRate,
      hoursTotal: avgHours,
      personHoursTotal,
      avgSatisfaction: avgSat,
      satisfactionCount: validSatCount
    });
  });

  // Default sorting:
  // For month/quarter, sort chronologically ascending
  // For course/category/courseCohort, sort by completedTotal descending
  if (criteria === 'month' || criteria === 'quarter') {
    result.sort((a, b) => a.key.localeCompare(b.key));
  } else {
    result.sort((a, b) => b.completedTotal - a.completedTotal);
  }

  return result;
}

/**
 * Generate official reporting narrative sentence
 * Example: "2026년 1~9월 기준 12개 과정 34개 기수를 운영하여 1,020명이 수료했습니다(수료율 96.2%). 총 교육실적은 25,400인시이며, 평균 만족도는 4.6점입니다."
 */
export function generateReportingSummaryText(metrics: SummaryMetrics): string {
  if (metrics.totalCohorts === 0) {
    return '집계 대상 교육 데이터가 없습니다.';
  }

  let periodPhrase = '';
  if (metrics.periodStart && metrics.periodEnd) {
    const sYr = metrics.periodStart.slice(0, 4);
    const sMo = parseInt(metrics.periodStart.slice(5), 10);
    const eYr = metrics.periodEnd.slice(0, 4);
    const eMo = parseInt(metrics.periodEnd.slice(5), 10);

    if (sYr === eYr) {
      if (sMo === eMo) {
        periodPhrase = `${sYr}년 ${sMo}월 기준 `;
      } else {
        periodPhrase = `${sYr}년 ${sMo}~${eMo}월 기준 `;
      }
    } else {
      periodPhrase = `${sYr}년 ${sMo}월 ~ ${eYr}년 ${eMo}월 기준 `;
    }
  }

  const courseCohortPhrase = `${formatNumber(metrics.totalCourses)}개 과정 ${formatNumber(metrics.totalCohorts)}개 기수를 운영하여 `;
  
  let completionPhrase = `${formatNumber(metrics.totalCompleted)}명이 수료했습니다`;
  if (metrics.overallCompletionRate !== undefined) {
    completionPhrase += `(수료율 ${formatDecimal(metrics.overallCompletionRate)}%)`;
  }
  completionPhrase += '. ';

  let secondSentence = '';
  if (metrics.totalPersonHours > 0 && metrics.avgSatisfaction !== undefined) {
    const unit = metrics.satisfactionScale === '100' ? '점(100점 만점)' : '점(5.0점 만점)';
    secondSentence = `총 교육실적은 ${formatNumber(metrics.totalPersonHours)}인시이며, 평균 만족도는 ${formatDecimal(metrics.avgSatisfaction)}${unit}입니다.`;
  } else if (metrics.totalPersonHours > 0) {
    secondSentence = `총 교육실적은 ${formatNumber(metrics.totalPersonHours)}인시입니다.`;
  } else if (metrics.avgSatisfaction !== undefined) {
    const unit = metrics.satisfactionScale === '100' ? '점(100점 만점)' : '점(5.0점 만점)';
    secondSentence = `평균 만족도는 ${formatDecimal(metrics.avgSatisfaction)}${unit}입니다.`;
  }

  return `${periodPhrase}${courseCohortPhrase}${completionPhrase}${secondSentence}`.trim();
}
