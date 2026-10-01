import React from 'react';
import { BarChart3 } from 'lucide-react';
import { AggregatedRow, AggregationCriteria } from '../types';
import { formatNumber, formatPercent } from '../utils/calculator';

interface ChartSectionProps {
  rows: AggregatedRow[];
  criteria: AggregationCriteria;
}

const CRITERIA_TITLES: Record<AggregationCriteria, string> = {
  course: '과정별',
  courseCohort: '과정·차수별',
  month: '월별',
  quarter: '분기별',
  category: '교육분야별'
};

export const ChartSection: React.FC<ChartSectionProps> = ({ rows, criteria }) => {
  // Sort by completedTotal descending and take top 10
  const sorted = [...rows].sort((a, b) => b.completedTotal - a.completedTotal);
  const top10 = sorted.slice(0, 10);
  const totalCompleted = rows.reduce((acc, r) => acc + r.completedTotal, 0);
  const maxCompleted = top10.length > 0 ? Math.max(...top10.map(r => r.completedTotal)) : 0;

  if (top10.length === 0 || maxCompleted === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-purple-50 text-purple-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            {CRITERIA_TITLES[criteria]} 수료인원 실적 차트
          </h2>
          <span className="text-xs text-slate-500 font-normal">
            (상위 {top10.length}개 항목)
          </span>
        </div>
        <div className="text-xs text-slate-500">
          전체 수료 합계:{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {formatNumber(totalCompleted)}명
          </strong>
        </div>
      </div>

      <div className="space-y-3">
        {top10.map((item, idx) => {
          const percentageOfMax = maxCompleted > 0 ? (item.completedTotal / maxCompleted) * 100 : 0;
          const shareOfTotal = totalCompleted > 0 ? (item.completedTotal / totalCompleted) * 100 : 0;
          const displayName = criteria === 'courseCohort' && item.subName
            ? `${item.name} (${item.subName})`
            : item.name;

          return (
            <div key={item.key} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                    idx === 0
                      ? 'bg-purple-700 text-white'
                      : idx === 1
                      ? 'bg-purple-100 text-purple-800'
                      : idx === 2
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800 truncate" title={displayName}>
                    {displayName}
                  </span>
                  {item.cohortCount > 1 && (
                    <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                      ({item.cohortCount}개 기수)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-right shrink-0 font-mono">
                  <span className="font-semibold text-slate-900">
                    {formatNumber(item.completedTotal)}명
                  </span>
                  <span className="text-slate-400 text-[11px] w-12 text-right">
                    {formatPercent(shareOfTotal)}
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0
                      ? 'bg-purple-700 group-hover:bg-purple-800'
                      : idx < 3
                      ? 'bg-purple-600 group-hover:bg-purple-700'
                      : 'bg-purple-300 group-hover:bg-purple-400'
                  }`}
                  style={{ width: `${Math.max(percentageOfMax, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
