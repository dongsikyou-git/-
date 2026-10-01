export interface RawExcelRow {
  [key: string]: any;
}

export type StandardField = 
  | 'courseName'
  | 'cohort'
  | 'completed'
  | 'satisfaction'
  | 'category'
  | 'startDate'
  | 'hours'
  | 'enrolled';

export interface FieldDefinition {
  key: StandardField;
  label: string;
  required: boolean;
  description: string;
  keywords: string[];
  excludeKeywords?: string[];
}

export interface ColumnMapping {
  courseName: string; // Excel header name
  cohort: string;
  completed: string;
  satisfaction: string;
  category: string;
  startDate: string;
  hours: string;
  enrolled: string;
}

export interface NormalizedTrainingRecord {
  id: string;
  courseName: string;
  cohort: string;
  completed: number;
  enrolled?: number;
  satisfaction?: number;
  category?: string;
  startDate?: string; // YYYY-MM-DD
  yearMonth?: string; // YYYY-MM
  quarter?: string;   // YYYY-Q1
  hours?: number;
  personHours?: number; // completed * hours
  raw: Record<string, any>;
}

export type AggregationCriteria = 
  | 'course'         // 과정별
  | 'courseCohort'   // 과정·기수별
  | 'month'          // 월별
  | 'quarter'        // 분기별
  | 'category';      // 교육유형별

export interface AggregatedRow {
  key: string;
  name: string;
  subName?: string; // e.g., cohort for courseCohort
  cohortCount: number; // 운영 기수
  enrolledTotal: number;
  completedTotal: number;
  completionRate?: number; // %
  hoursTotal: number; // 총 교육시간 (평균 또는 단순합)
  personHoursTotal: number; // 인시 (수료인원 * 교육시간)
  avgSatisfaction?: number; // 가중평균
  satisfactionCount: number;
}

export interface SummaryMetrics {
  totalCourses: number;
  totalCohorts: number;
  totalEnrolled: number;
  totalCompleted: number;
  overallCompletionRate?: number;
  totalPersonHours: number;
  avgSatisfaction?: number;
  satisfactionScale: '5' | '100';
  periodStart?: string; // YYYY-MM
  periodEnd?: string;   // YYYY-MM
}

export interface FilterState {
  criteria: AggregationCriteria;
  startYearMonth: string;
  endYearMonth: string;
  searchQuery: string;
  selectedCategory: string;
}
