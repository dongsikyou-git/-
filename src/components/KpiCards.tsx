import React from 'react';
import { BookOpen, CalendarDays, Users, Award, Percent, Clock, Star, AlertTriangle } from 'lucide-react';
import { SummaryMetrics } from '../types';
import { formatDecimal, formatNumber, formatPercent } from '../utils/calculator';

interface KpiCardsProps {
  metrics: SummaryMetrics;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  const isLowCompletion = metrics.overallCompletionRate !== undefined && metrics.overallCompletionRate < 90;
  
  const isLowSatisfaction = metrics.avgSatisfaction !== undefined && (
    metrics.satisfactionScale === '100'
      ? metrics.avgSatisfaction < 80
      : metrics.avgSatisfaction < 4.0
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
          핵심 교육실적 지표 (KPI)
        </h2>
        {metrics.periodStart && metrics.periodEnd && (
          <span className="text-xs text-slate-500 font-mono">
            기준 기간: {metrics.periodStart} ~ {metrics.periodEnd}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* 1. 운영 과정 수 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-500">운영 과정</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {formatNumber(metrics.totalCourses)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">개 과정</div>
          </div>
        </div>

        {/* 2. 운영 기수 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-500">운영 기수</span>
            <CalendarDays className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {formatNumber(metrics.totalCohorts)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">개 차수(회)</div>
          </div>
        </div>

        {/* 3. 총 입교인원 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-500">총 입교인원</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {metrics.totalEnrolled > 0 ? formatNumber(metrics.totalEnrolled) : '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics.totalEnrolled > 0 ? '학습 등록인원' : '데이터 미제공'}
            </div>
          </div>
        </div>

        {/* 4. 총 수료인원 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-500">총 수료인원</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight font-mono">
              {formatNumber(metrics.totalCompleted)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">명 수료 완료</div>
          </div>
        </div>

        {/* 5. 전체 수료율 (주의 색 강조: 90% 미만) */}
        <div className={`p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between transition ${
          isLowCompletion
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/30'
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className={`text-xs font-medium ${isLowCompletion ? 'text-amber-800 font-semibold' : 'text-slate-500'}`}>
              전체 수료율
            </span>
            {isLowCompletion ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <Percent className="w-4 h-4 text-teal-500" />
            )}
          </div>
          <div>
            <div className={`text-2xl font-bold tracking-tight font-mono ${
              isLowCompletion ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {metrics.overallCompletionRate !== undefined ? formatPercent(metrics.overallCompletionRate) : '-'}
            </div>
            <div className={`text-[11px] mt-0.5 ${isLowCompletion ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
              {isLowCompletion ? '90% 미만 주의' : '수료/입교 비율'}
            </div>
          </div>
        </div>

        {/* 6. 총 교육실적 (인시) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-500">총 교육실적</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {metrics.totalPersonHours > 0 ? formatNumber(metrics.totalPersonHours) : '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics.totalPersonHours > 0 ? '인시 (수료인원×시간)' : '시수 미제공'}
            </div>
          </div>
        </div>

        {/* 7. 평균 만족도 (주의 색 강조: 4.0 미만 또는 80점 미만) */}
        <div className={`p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between transition ${
          isLowSatisfaction
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/30'
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className={`text-xs font-medium ${isLowSatisfaction ? 'text-amber-800 font-semibold' : 'text-slate-500'}`}>
              평균 만족도
            </span>
            {isLowSatisfaction ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            )}
          </div>
          <div>
            <div className={`text-2xl font-bold tracking-tight font-mono ${
              isLowSatisfaction ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {metrics.avgSatisfaction !== undefined ? formatDecimal(metrics.avgSatisfaction) : '-'}
            </div>
            <div className={`text-[11px] mt-0.5 ${isLowSatisfaction ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
              {isLowSatisfaction
                ? '관리 기준치 미달'
                : `가중평균 (${metrics.satisfactionScale === '100' ? '100점 만점' : '5.0점 만점'})`}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
