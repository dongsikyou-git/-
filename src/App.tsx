/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { ColumnMapper } from './components/ColumnMapper';
import { FilterControls } from './components/FilterControls';
import { KpiCards } from './components/KpiCards';
import { DetailedTable } from './components/DetailedTable';
import { ChartSection } from './components/ChartSection';
import { SummaryCard } from './components/SummaryCard';

import {
  AggregationCriteria,
  ColumnMapping,
  FilterState,
  NormalizedTrainingRecord,
  StandardField
} from './types';
import { generateSampleData } from './utils/sampleData';
import { normalizeExcelData, parseExcelFile } from './utils/excelParser';
import {
  aggregateRecords,
  computeSummaryMetrics,
  filterRecords,
  generateReportingSummaryText
} from './utils/calculator';
import { copyToClipboard, exportToExcel, generateTsvTable } from './utils/exporter';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Sample data initialized by default
  const initialData = useMemo(() => generateSampleData(), []);

  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>(initialData.rawRows);
  const [headers, setHeaders] = useState<string[]>(initialData.headers);
  const [headerIndex, setHeaderIndex] = useState<number>(initialData.headerIndex);
  const [mapping, setMapping] = useState<ColumnMapping>(initialData.mapping);
  const [records, setRecords] = useState<NormalizedTrainingRecord[]>(initialData.records);
  const [satisfactionScale, setSatisfactionScale] = useState<'5' | '100'>(initialData.satisfactionScale);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedSummaryRows, setSkippedSummaryRows] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    criteria: 'course',
    startYearMonth: '',
    endYearMonth: '',
    searchQuery: '',
    selectedCategory: 'all'
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Reset to initial sample data
  const handleResetToSample = useCallback(() => {
    const sample = generateSampleData();
    setIsSampleData(true);
    setCurrentFileName(null);
    setRawRows(sample.rawRows);
    setHeaders(sample.headers);
    setHeaderIndex(sample.headerIndex);
    setMapping(sample.mapping);
    setRecords(sample.records);
    setSatisfactionScale(sample.satisfactionScale);
    setSkippedSummaryRows(1);
    setErrorMessage(null);
    setFilterState({
      criteria: 'course',
      startYearMonth: '',
      endYearMonth: '',
      searchQuery: '',
      selectedCategory: 'all'
    });
    showToast('예시 데이터로 복원되었습니다.');
  }, [showToast]);

  // Handle uploaded Excel file
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const parsed = await parseExcelFile(file);

      // Normalize data with auto-matched mapping
      const {
        records: normalized,
        skippedSummaryRows: skipped,
        satisfactionScale: detectedScale
      } = normalizeExcelData(
        parsed.rawRows,
        parsed.headerIndex,
        parsed.initialMapping,
        parsed.headers
      );

      // Check required columns: courseName, completed, and hours
      const missingFields: string[] = [];
      if (!parsed.initialMapping.courseName) missingFields.push('교육과정명');
      if (!parsed.initialMapping.completed) missingFields.push('수료인원');
      if (!parsed.initialMapping.hours) missingFields.push('교육시간');

      if (missingFields.length > 0) {
        setErrorMessage(
          `${missingFields.join(', ')} 열을 자동으로 찾지 못했습니다. '엑셀 열 매칭 설정' 패널을 열어 직접 연결해 주세요.`
        );
      }

      setRawRows(parsed.rawRows);
      setHeaders(parsed.headers);
      setHeaderIndex(parsed.headerIndex);
      setMapping(parsed.initialMapping);
      setRecords(normalized);
      setSatisfactionScale(detectedScale);
      setSkippedSummaryRows(skipped);
      setIsSampleData(false);
      setCurrentFileName(file.name);

      // Reset filters for new dataset
      setFilterState({
        criteria: 'course',
        startYearMonth: '',
        endYearMonth: '',
        searchQuery: '',
        selectedCategory: 'all'
      });

      showToast(`'${file.name}' 파일을 성공적으로 불러왔습니다.`);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(
        err.message || '엑셀 파일을 읽는 도중 오류가 발생했습니다. 파일이 손상되지 않았는지 확인해 주세요.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // When user updates column mapping manually
  const handleMappingChange = (key: StandardField, newHeader: string) => {
    const updatedMapping = { ...mapping, [key]: newHeader };
    setMapping(updatedMapping);

    // Re-normalize data with new mapping
    const {
      records: normalized,
      skippedSummaryRows: skipped,
      satisfactionScale: detectedScale
    } = normalizeExcelData(
      rawRows,
      headerIndex,
      updatedMapping,
      headers
    );

    setRecords(normalized);
    setSatisfactionScale(detectedScale);
    setSkippedSummaryRows(skipped);

    // Clear error message if required columns are now satisfied
    if (updatedMapping.courseName && updatedMapping.completed && updatedMapping.hours) {
      setErrorMessage(null);
    }

    showToast(`'${key}' 열 매칭이 업데이트되었습니다.`);
  };

  // Derive unique months and categories for filter dropdowns
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach(r => {
      if (r.yearMonth) months.add(r.yearMonth);
    });
    return Array.from(months).sort();
  }, [records]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    records.forEach(r => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats).sort();
  }, [records]);

  // Filtered records based on query, date range, and category
  const filteredRecords = useMemo(() => {
    return filterRecords(
      records,
      filterState.startYearMonth,
      filterState.endYearMonth,
      filterState.searchQuery,
      filterState.selectedCategory
    );
  }, [records, filterState]);

  // Compute overall KPI metrics
  const summaryMetrics = useMemo(() => {
    return computeSummaryMetrics(filteredRecords, satisfactionScale);
  }, [filteredRecords, satisfactionScale]);

  // Aggregate records by chosen criteria (course, cohort, month, quarter, category)
  const aggregatedRows = useMemo(() => {
    return aggregateRecords(filteredRecords, filterState.criteria);
  }, [filteredRecords, filterState.criteria]);

  // Export handlers
  const handleExportExcel = () => {
    try {
      exportToExcel(summaryMetrics, aggregatedRows, filteredRecords, filterState.criteria);
      showToast('엑셀 보고서 파일(.xlsx)이 다운로드되었습니다.');
    } catch (err) {
      console.error('Excel export error:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const handleCopyTable = async () => {
    const tsv = generateTsvTable(aggregatedRows, summaryMetrics, filterState.criteria);
    const success = await copyToClipboard(tsv);
    if (success) {
      showToast('상세 통계표가 탭 구분 텍스트(TSV)로 복사되었습니다. (엑셀·한글 붙여넣기 가능)');
    }
  };

  const handleCopySummary = async () => {
    const text = generateReportingSummaryText(summaryMetrics);
    const success = await copyToClipboard(text);
    if (success) {
      showToast('보고용 요약 문장이 클립보드에 복사되었습니다.');
    }
  };

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilterState(prev => ({
      ...prev,
      startYearMonth: '',
      endYearMonth: '',
      searchQuery: '',
      selectedCategory: 'all'
    }));
    showToast('조회 필터가 초기화되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col font-['Noto_Sans_KR',sans-serif] text-slate-800">
      
      {/* 1. Header with brand, status, and export buttons */}
      <Header
        isSampleData={isSampleData}
        fileName={currentFileName}
        onResetToSample={handleResetToSample}
        onExportExcel={handleExportExcel}
        onCopyTable={handleCopyTable}
        onCopySummary={handleCopySummary}
        metrics={summaryMetrics}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        {/* 1. File Uploader & Drag/Drop Area */}
        <FileUploader
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
          errorMessage={errorMessage}
          currentFileName={currentFileName}
          isSampleData={isSampleData}
          onResetToSample={handleResetToSample}
          totalParsedRows={records.length}
          skippedSummaryRows={skippedSummaryRows}
        />

        {/* 2. Column Mapping Panel (Auto-matching check & manual override) */}
        <ColumnMapper
          mapping={mapping}
          availableHeaders={headers}
          onMappingChange={handleMappingChange}
          headerIndex={headerIndex}
        />

        {/* 3. Filter & Query Conditions */}
        <FilterControls
          filterState={filterState}
          onFilterChange={handleFilterUpdate}
          onResetFilters={handleResetFilters}
          availableMonths={availableMonths}
          availableCategories={availableCategories}
          totalRecordsCount={records.length}
          filteredRecordsCount={filteredRecords.length}
        />

        {/* 4. Core Metrics Cards (KPI) */}
        <KpiCards metrics={summaryMetrics} />

        {/* 7. Reporting Summary Text (Placed prominently for immediate report drafting) */}
        <SummaryCard metrics={summaryMetrics} />

        {/* 6. Chart Section (Top 10 completions bar chart) */}
        <ChartSection
          rows={aggregatedRows}
          criteria={filterState.criteria}
        />

        {/* 5. Detailed Statistics Table with Sort, Sticky Summary, Warning Cues */}
        <DetailedTable
          rows={aggregatedRows}
          criteria={filterState.criteria}
          metrics={summaryMetrics}
          onCopySuccess={() => showToast('상세 통계표가 클립보드에 복사되었습니다.')}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>교육실적 통계 도우미</strong> · 공공기관 교육기획 실무 전용
          </div>
          <div className="text-slate-400">
            모든 엑셀 파일은 브라우저 내부 메모리에서만 파싱되며 외부 서버나 AI 모델로 전송되지 않습니다.
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 border border-purple-500/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
