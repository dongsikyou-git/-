import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, Check, AlertCircle } from 'lucide-react';
import { AggregatedRow, AggregationCriteria, SummaryMetrics } from '../types';
import { formatDecimal, formatNumber, formatPercent } from '../utils/calculator';
import { copyToClipboard, generateTsvTable } from '../utils/exporter';

interface DetailedTableProps {
  rows: AggregatedRow[];
  criteria: AggregationCriteria;
  metrics: SummaryMetrics;
  onCopySuccess: () => void;
}

type SortField =
  | 'name'
  | 'cohortCount'
  | 'enrolledTotal'
  | 'completedTotal'
  | 'completionRate'
  | 'hoursTotal'
  | 'personHoursTotal'
  | 'avgSatisfaction';

type SortDirection = 'asc' | 'desc';

const CRITERIA_HEADERS: Record<AggregationCriteria, string> = {
  course: '교육과정명',
  courseCohort: '교육과정명 (차수)',
  month: '운영월',
  quarter: '운영분기',
  category: '교육유형(분야)'
};

export const DetailedTable: React.FC<DetailedTableProps> = ({
  rows,
  criteria,
  metrics,
  onCopySuccess
}) => {
  const [sortField, setSortField] = useState<SortField>('completedTotal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copied, setCopied] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Sort rows copy
  const sortedRows = [...rows].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal === undefined || aVal === null) aVal = -Infinity;
    if (bVal === undefined || bVal === null) bVal = -Infinity;

    if (typeof aVal === 'string') {
      const cmp = aVal.localeCompare(String(bVal), 'ko');
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    const diff = aVal - bVal;
    return sortDirection === 'asc' ? diff : -diff;
  });

  // Calculate totals for footer
  let totalCohorts = 0;
  let totalEnrolled = 0;
  let hasEnrolled = false;
  let totalCompleted = 0;
  let totalPersonHours = 0;

  rows.forEach(r => {
    totalCohorts += r.cohortCount;
    if (r.enrolledTotal > 0) {
      totalEnrolled += r.enrolledTotal;
      hasEnrolled = true;
    }
    totalCompleted += r.completedTotal;
    totalPersonHours += r.personHoursTotal;
  });

  const totalCompletionRate = (hasEnrolled && totalEnrolled > 0)
    ? (totalCompleted / totalEnrolled) * 100
    : undefined;

  const handleCopyTable = async () => {
    const tsv = generateTsvTable(sortedRows, metrics, criteria);
    const success = await copyToClipboard(tsv);
    if (success) {
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition shrink-0" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
    );
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>상세 실적 통계표</span>
            <span className="text-xs font-normal text-slate-500">
              ({CRITERIA_HEADERS[criteria]} 기준 / 총 {rows.length}개 항목)
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            열 제목을 클릭하면 오름차순/내림차순으로 정렬됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyTable}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 active:bg-slate-100 transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">클립보드 복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>표 복사 (엑셀·한글 붙여넣기용)</span>
            </>
          )}
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 font-semibold text-slate-700">
              <th
                scope="col"
                onClick={() => handleSort('name')}
                className="py-3 px-4 group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>{CRITERIA_HEADERS[criteria]}</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              {criteria === 'courseCohort' && (
                <th scope="col" className="py-3 px-3 w-20 text-center">
                  차수
                </th>
              )}

              <th
                scope="col"
                onClick={() => handleSort('cohortCount')}
                className="py-3 px-3 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>기수(회)</span>
                  {renderSortIndicator('cohortCount')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('enrolledTotal')}
                className="py-3 px-3 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>입교인원</span>
                  {renderSortIndicator('enrolledTotal')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('completedTotal')}
                className="py-3 px-3 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>수료인원</span>
                  {renderSortIndicator('completedTotal')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('completionRate')}
                className="py-3 px-3 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>수료율</span>
                  {renderSortIndicator('completionRate')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('hoursTotal')}
                className="py-3 px-3 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>시간(h)</span>
                  {renderSortIndicator('hoursTotal')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('personHoursTotal')}
                className="py-3 px-3 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>인시(수료×시간)</span>
                  {renderSortIndicator('personHoursTotal')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('avgSatisfaction')}
                className="py-3 px-4 text-right group cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>
                    만족도({metrics.satisfactionScale === '100' ? '100점' : '5점'})
                  </span>
                  {renderSortIndicator('avgSatisfaction')}
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={criteria === 'courseCohort' ? 9 : 8} className="py-12 text-center text-slate-400">
                  선택한 조건에 해당하는 교육실적 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => {
                const isLowCompletion = row.completionRate !== undefined && row.completionRate < 90;
                const isLowSatisfaction = row.avgSatisfaction !== undefined && (
                  metrics.satisfactionScale === '100'
                    ? row.avgSatisfaction < 80
                    : row.avgSatisfaction < 4.0
                );

                return (
                  <tr
                    key={row.key}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Primary Name */}
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[240px] truncate" title={row.name}>
                      {row.name}
                    </td>

                    {/* SubName (Cohort) if applicable */}
                    {criteria === 'courseCohort' && (
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                        {row.subName || '-'}
                      </td>
                    )}

                    {/* Cohort Count */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumber(row.cohortCount)}
                    </td>

                    {/* Enrolled Total */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {row.enrolledTotal > 0 ? formatNumber(row.enrolledTotal) : '-'}
                    </td>

                    {/* Completed Total */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatNumber(row.completedTotal)}
                    </td>

                    {/* Completion Rate */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {row.completionRate !== undefined ? (
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isLowCompletion ? 'text-amber-700 bg-amber-50 px-1 rounded' : 'text-slate-800'
                          }`}
                        >
                          {isLowCompletion && <AlertCircle className="w-3 h-3 text-amber-600 inline" />}
                          {formatPercent(row.completionRate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {row.hoursTotal > 0 ? formatDecimal(row.hoursTotal) : '-'}
                    </td>

                    {/* Person Hours */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.personHoursTotal > 0 ? formatNumber(row.personHoursTotal) : '-'}
                    </td>

                    {/* Average Satisfaction */}
                    <td className="py-2.5 px-4 text-right font-mono">
                      {row.avgSatisfaction !== undefined ? (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isLowSatisfaction ? 'text-amber-700 bg-amber-50 px-1 rounded' : 'text-slate-800'
                          }`}
                        >
                          {isLowSatisfaction && <AlertCircle className="w-3 h-3 text-amber-600 inline" />}
                          {formatDecimal(row.avgSatisfaction)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Total Summary Row (합계 행) */}
          {sortedRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
                <td className="py-3 px-4">
                  <span>합계 ({rows.length}개 항목)</span>
                </td>

                {criteria === 'courseCohort' && (
                  <td className="py-3 px-3 text-center text-slate-500 font-mono">
                    -
                  </td>
                )}

                <td className="py-3 px-3 text-right font-mono">
                  {formatNumber(totalCohorts)}
                </td>

                <td className="py-3 px-3 text-right font-mono">
                  {totalEnrolled > 0 ? formatNumber(totalEnrolled) : '-'}
                </td>

                <td className="py-3 px-3 text-right font-mono text-purple-800">
                  {formatNumber(totalCompleted)}
                </td>

                <td className="py-3 px-3 text-right font-mono">
                  {totalCompletionRate !== undefined ? (
                    <span className={totalCompletionRate < 90 ? 'text-amber-700' : ''}>
                      {formatPercent(totalCompletionRate)}
                    </span>
                  ) : '-'}
                </td>

                <td className="py-3 px-3 text-right font-mono text-slate-500">
                  -
                </td>

                <td className="py-3 px-3 text-right font-mono text-purple-700">
                  {totalPersonHours > 0 ? formatNumber(totalPersonHours) : '-'}
                </td>

                <td className="py-3 px-4 text-right font-mono">
                  {metrics.avgSatisfaction !== undefined ? formatDecimal(metrics.avgSatisfaction) : '-'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
};
