import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, AlertTriangle, Check, HelpCircle } from 'lucide-react';
import { ColumnMapping, StandardField } from '../types';
import { FIELD_DEFINITIONS } from '../utils/excelParser';

interface ColumnMapperProps {
  mapping: ColumnMapping;
  availableHeaders: string[];
  onMappingChange: (key: StandardField, headerName: string) => void;
  headerIndex: number;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  mapping,
  availableHeaders,
  onMappingChange,
  headerIndex
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const missingRequired = FIELD_DEFINITIONS.filter(def => def.required && !mapping[def.key]);
  const hasError = missingRequired.length > 0;

  // Render preview summary string
  const summaryParts = [
    { label: '과정명', val: mapping.courseName, required: true },
    { label: '기수', val: mapping.cohort },
    { label: '수료인원', val: mapping.completed, required: true },
    { label: '교육시간', val: mapping.hours, required: true },
    { label: '만족도', val: mapping.satisfaction },
    { label: '입교인원', val: mapping.enrolled },
    { label: '시작일', val: mapping.startDate },
    { label: '교육유형', val: mapping.category }
  ].filter(p => p.val || p.required);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition">
      {/* Header bar / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${
            hasError ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`}>
            <SlidersHorizontal className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">
                엑셀 열 매칭 설정
              </span>
              <span className="text-xs text-slate-500 font-normal">
                (헤더 행: {headerIndex + 1}행 인식됨)
              </span>
              {hasError && (
                <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  필수 열 선택 필요
                </span>
              )}
            </div>

            {/* Collapsed summary preview */}
            {!isOpen && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mt-1">
                {summaryParts.map((part, idx) => (
                  <React.Fragment key={part.label}>
                    <span className={part.val ? 'text-slate-700' : 'text-rose-600 font-semibold'}>
                      {part.label}:{' '}
                      <span className={part.val ? 'font-medium text-purple-700' : 'text-rose-600'}>
                        {part.val || '미지정 (필수!)'}
                      </span>
                    </span>
                    {idx < summaryParts.length - 1 && (
                      <span className="text-slate-300" aria-hidden="true">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium ml-2">
          <span>{isOpen ? '설정 닫기' : '열 수정하기'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Mapping Controls */}
      {isOpen && (
        <div className="p-5 border-t border-slate-200 bg-slate-50/50">
          {hasError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {missingRequired.map(d => d.label).join(', ')} 열을 찾지 못했습니다.
                </p>
                <p className="text-amber-700 mt-0.5">
                  아래 드롭다운에서 엑셀 파일의 해당 열을 직접 선택해 주시면 즉시 정확한 통계가 집계됩니다.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FIELD_DEFINITIONS.map(def => {
              const currentValue = mapping[def.key] || '';
              const isMatched = Boolean(currentValue);

              return (
                <div
                  key={def.key}
                  className={`p-3 rounded-lg border bg-white flex flex-col justify-between transition ${
                    def.required && !isMatched
                      ? 'border-rose-300 bg-rose-50/30'
                      : isMatched
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-slate-200/80 bg-slate-50/40'
                  }`}
                >
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`select-${def.key}`}
                        className="text-xs font-semibold text-slate-800 flex items-center gap-1"
                      >
                        <span>{def.label}</span>
                        {def.required ? (
                          <span className="text-rose-600 text-[11px] font-bold">*필수</span>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-normal">(선택)</span>
                        )}
                      </label>
                      {isMatched && (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={def.description}>
                      {def.description}
                    </p>
                  </div>

                  <select
                    id={`select-${def.key}`}
                    value={currentValue}
                    onChange={(e) => onMappingChange(def.key, e.target.value)}
                    className={`w-full text-xs rounded-md py-1.5 px-2 bg-white border font-medium transition cursor-pointer ${
                      def.required && !isMatched
                        ? 'border-rose-400 text-rose-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : isMatched
                        ? 'border-slate-300 text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                        : 'border-slate-200 text-slate-400 italic'
                    }`}
                  >
                    <option value="">(연결 안 함 / 미사용)</option>
                    {availableHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              업로드된 엑셀 파일의 열 이름이 표준과 다르더라도 키워드로 자동 추천됩니다.
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
            >
              설정 완료
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
