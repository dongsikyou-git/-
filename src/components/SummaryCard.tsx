import React, { useState } from 'react';
import { FileText, Copy, Check, Info } from 'lucide-react';
import { SummaryMetrics } from '../types';
import { generateReportingSummaryText, formatDecimal, formatNumber, formatPercent } from '../utils/calculator';
import { copyToClipboard } from '../utils/exporter';

interface SummaryCardProps {
  metrics: SummaryMetrics;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ metrics }) => {
  const [copiedSentence, setCopiedSentence] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState(false);

  const narrativeText = generateReportingSummaryText(metrics);

  // Generate bullet format commonly used in Korean public institution reports (개조식 보고서 형식)
  const generateBulletText = (): string => {
    const period = (metrics.periodStart && metrics.periodEnd)
      ? `${metrics.periodStart} ~ ${metrics.periodEnd}`
      : '연간 실적';

    const satScaleLabel = metrics.satisfactionScale === '100' ? '100점 만점' : '5.0점 만점';
    const lines: string[] = [
      `□ 교육훈련 추진 실적 보고 (${period} 기준)`,
      ` ○ 운영 규모: 총 ${formatNumber(metrics.totalCourses)}개 과정, ${formatNumber(metrics.totalCohorts)}개 차수 운영`,
      ` ○ 수료 인원: 총 ${formatNumber(metrics.totalCompleted)}명 수료${metrics.overallCompletionRate !== undefined ? ` (수료율 ${formatPercent(metrics.overallCompletionRate)})` : ''}`
    ];

    if (metrics.totalPersonHours > 0) {
      lines.push(` ○ 총 교육실적: ${formatNumber(metrics.totalPersonHours)}인시`);
    }

    if (metrics.avgSatisfaction !== undefined) {
      lines.push(` ○ 평균 만족도: ${formatDecimal(metrics.avgSatisfaction)}점 (${satScaleLabel})`);
    }

    return lines.join('\n');
  };

  const handleCopySentence = async () => {
    const success = await copyToClipboard(narrativeText);
    if (success) {
      setCopiedSentence(true);
      setTimeout(() => setCopiedSentence(false), 2000);
    }
  };

  const handleCopyBullets = async () => {
    const success = await copyToClipboard(generateBulletText());
    if (success) {
      setCopiedBullets(true);
      setTimeout(() => setCopiedBullets(false), 2000);
    }
  };

  return (
    <section className="bg-gradient-to-br from-purple-50/70 via-white to-slate-50 rounded-xl border border-purple-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-purple-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-700 text-white">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              보고용 요약 문장 자동 생성
            </h2>
            <p className="text-[11px] text-slate-500">
              공문, 주간/월간 업무보고, 실적 기안문 본문에 바로 활용할 수 있는 표준 문장입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyBullets}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-purple-50 hover:text-purple-800 active:bg-purple-100 transition shadow-2xs cursor-pointer"
            title="개조식(□, ○) 형태의 보고서 서식으로 복사"
          >
            {copiedBullets ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">개조식 복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>개조식(□) 복사</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopySentence}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 active:bg-purple-900 rounded-md transition shadow-2xs cursor-pointer"
          >
            {copiedSentence ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>문장 복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/90" />
                <span>요약 문장 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Narrative Sentence Display */}
      <div className="p-4 bg-white rounded-lg border border-purple-100/90 shadow-2xs">
        <p className="text-sm font-medium text-slate-800 leading-relaxed tracking-normal select-all">
          "{narrativeText}"
        </p>
      </div>

      <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span>
          조회 조건(기간, 검색, 교육유형)을 변경하면 요약 문장의 수치와 기간이 실시간으로 자동 갱신됩니다.
        </span>
      </div>
    </section>
  );
};
