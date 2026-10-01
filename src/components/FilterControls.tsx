import React from 'react';
import { Search, RotateCcw, Calendar, Layers } from 'lucide-react';
import { AggregationCriteria, FilterState } from '../types';

interface FilterControlsProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableMonths: string[];
  availableCategories: string[];
  totalRecordsCount: number;
  filteredRecordsCount: number;
}

const CRITERIA_OPTIONS: { id: AggregationCriteria; label: string; desc: string }[] = [
  { id: 'course', label: '과정별', desc: '동일 과정 통합 집계' },
  { id: 'courseCohort', label: '과정·기수별', desc: '과정 및 차수별 세부 집계' },
  { id: 'month', label: '월별', desc: '교육 시작월 기준 추이' },
  { id: 'quarter', label: '분기별', desc: '분기별 실적 집계' },
  { id: 'category', label: '교육유형별', desc: '직무/분야별 비중' }
];

export const FilterControls: React.FC<FilterControlsProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  availableMonths,
  availableCategories,
  totalRecordsCount,
  filteredRecordsCount
}) => {
  const isFiltered =
    Boolean(filterState.searchQuery) ||
    Boolean(filterState.selectedCategory && filterState.selectedCategory !== 'all') ||
    Boolean(filterState.startYearMonth) ||
    Boolean(filterState.endYearMonth);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-4">
        
        {/* Top: Aggregation Criteria Tabs (Interactive segmented control) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              집계 기준 선택
            </span>
            <div className="text-xs text-slate-500">
              조회 결과:{' '}
              <strong className="text-slate-900 font-semibold">{filteredRecordsCount}</strong>
              <span className="text-slate-400">/{totalRecordsCount}건</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg">
            {CRITERIA_OPTIONS.map(opt => {
              const active = filterState.criteria === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange({ criteria: opt.id })}
                  className={`py-2 px-3 text-xs font-semibold rounded-md transition-all text-center cursor-pointer ${
                    active
                      ? 'bg-white text-purple-700 shadow-xs ring-1 ring-purple-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className={`text-[10px] font-normal truncate mt-0.5 ${
                    active ? 'text-purple-600/80 font-medium' : 'text-slate-400'
                  }`}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Filters (Search, Period Range, Category) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Search by Course Name */}
          <div className="sm:col-span-4">
            <label htmlFor="search-input" className="sr-only">과정명 검색</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input"
                type="text"
                placeholder="과정명 또는 키워드 검색..."
                value={filterState.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
              {filterState.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Period Range (Start Month ~ End Month) */}
          <div className="sm:col-span-5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <div className="flex items-center gap-1 w-full text-xs">
              <select
                aria-label="시작 월 선택"
                value={filterState.startYearMonth}
                onChange={(e) => onFilterChange({ startYearMonth: e.target.value })}
                className="flex-1 text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">시작월 (전체)</option>
                {availableMonths.map(m => (
                  <option key={`start-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">~</span>
              <select
                aria-label="종료 월 선택"
                value={filterState.endYearMonth}
                onChange={(e) => onFilterChange({ endYearMonth: e.target.value })}
                className="flex-1 text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">종료월 (전체)</option>
                {availableMonths.map(m => (
                  <option key={`end-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-2">
            <select
              aria-label="교육유형 필터"
              value={filterState.selectedCategory}
              onChange={(e) => onFilterChange({ selectedCategory: e.target.value })}
              disabled={availableCategories.length === 0}
              className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="all">전체 분야/유형</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="sm:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={!isFiltered}
              title="필터 초기화"
              className={`p-2 rounded-md border text-xs flex items-center justify-center transition ${
                isFiltered
                  ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 cursor-pointer shadow-2xs'
                  : 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
