import React from 'react';
import { ShieldCheck, FileSpreadsheet, Copy, Sparkles, RefreshCw } from 'lucide-react';
import { SummaryMetrics } from '../types';

interface HeaderProps {
  isSampleData: boolean;
  fileName: string | null;
  onResetToSample: () => void;
  onExportExcel: () => void;
  onCopyTable: () => void;
  onCopySummary: () => void;
  metrics: SummaryMetrics;
}

export const Header: React.FC<HeaderProps> = ({
  isSampleData,
  fileName,
  onResetToSample,
  onExportExcel,
  onCopyTable,
  onCopySummary
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Context */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs shrink-0 ring-1 ring-purple-600/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  교육실적 통계 도우미
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  로컬 전용 (안전한 사내망)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                교육운영 엑셀 데이터를 브라우저에서 즉시 집계하고 공문·보고용 문장을 자동 생성합니다.
              </p>
            </div>
          </div>

          {/* Data Source & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status indicator */}
            {isSampleData ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>체험용 <strong>예시 데이터</strong> 표시 중</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-md">
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-medium truncate max-w-[160px]" title={fileName || ''}>
                  {fileName}
                </span>
                <button
                  onClick={onResetToSample}
                  title="예시 데이터 다시 보기"
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <button
              onClick={onCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 active:bg-slate-100 transition shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              요약 복사
            </button>

            <button
              onClick={onCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 active:bg-slate-100 transition shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              표 복사 (한글/엑셀)
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              엑셀로 저장 (.xlsx)
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
