import React, { useRef, useState } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  errorMessage: string | null;
  currentFileName: string | null;
  isSampleData: boolean;
  onResetToSample: () => void;
  totalParsedRows?: number;
  skippedSummaryRows?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  isProcessing,
  errorMessage,
  currentFileName,
  isSampleData,
  onResetToSample,
  totalParsedRows,
  skippedSummaryRows
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcess(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcess(files[0]);
    }
    // Reset input so same file can be reselected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndProcess = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const name = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => name.endsWith(ext));

    if (!isValid) {
      alert('지원되지 않는 파일 형식입니다. .xlsx, .xls, .csv 형식의 파일을 업로드해 주세요.');
      return;
    }

    onFileUpload(file);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150 ${
          isDragOver
            ? 'border-purple-500 bg-purple-50/50'
            : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/20 bg-slate-50/30'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-600'
          }`}>
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-800 text-sm sm:text-base">
              <span>교육운영 실적 엑셀 파일을 여기에 끌어다 놓거나</span>
              <span className="text-purple-700 underline underline-offset-2">파일 찾기</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              지원 형식: <strong>.xlsx, .xls, .csv</strong> (1행 = 1개 기수/차수 단위 실적)
            </p>
          </div>

          {/* Quiet metadata notes */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1 pt-2 border-t border-slate-200/60 w-full max-w-xl">
            <span>제목 행 자동 감지 (상단 10행 검색)</span>
            <span aria-hidden="true">·</span>
            <span>열 이름 자동 매칭</span>
            <span aria-hidden="true">·</span>
            <span>합계·소계 행 자동 제외</span>
            <span aria-hidden="true">·</span>
            <span>외부 서버 전송 없음 (100% 브라우저 메모리 처리)</span>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>엑셀 데이터를 안전하게 분석하고 있습니다...</span>
            </div>
          </div>
        )}
      </div>

      {/* Info/Status Banner */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {errorMessage ? (
          <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-md flex-1">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">파일 분석 오류 안내</p>
              <p className="text-rose-600 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600">
            {isSampleData ? (
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <FileType className="w-3.5 h-3.5 text-amber-600" />
                현재 공공기관 표준 예시 데이터(8개 과정, 30개 기수)가 적용되어 있습니다.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{currentFileName}</span>
                {totalParsedRows !== undefined && (
                  <span className="text-slate-500 font-normal">
                    (총 {totalParsedRows}행 분석됨
                    {skippedSummaryRows ? `, 합계·빈 행 ${skippedSummaryRows}건 자동 제외` : ''})
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {!isSampleData && (
          <button
            onClick={onResetToSample}
            className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1 self-end sm:self-center"
          >
            <RefreshCw className="w-3 h-3" />
            예시 데이터로 되돌리기
          </button>
        )}
      </div>
    </section>
  );
};
