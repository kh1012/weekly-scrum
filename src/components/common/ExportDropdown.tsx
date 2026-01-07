/**
 * Export Dropdown Component
 * JSON, PNG, SVG export 옵션을 제공하는 드롭다운 메뉴
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { LoadingIcon } from "./Icons";

export interface ExportDropdownProps {
  /** JSON export 핸들러 */
  onExportJSON: () => Promise<void>;
  /** PNG export 핸들러 */
  onExportPNG: () => Promise<void>;
  /** SVG export 핸들러 */
  onExportSVG: () => Promise<void>;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 버튼 레이블 */
  label?: string;
}

type ExportType = "json" | "png" | "svg";

export function ExportDropdown({
  onExportJSON,
  onExportPNG,
  onExportSVG,
  disabled = false,
  label = "Export",
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleExport = async (type: ExportType) => {
    if (isExporting) return;

    setIsExporting(true);
    setExportingType(type);
    setIsOpen(false);

    try {
      switch (type) {
        case "json":
          await onExportJSON();
          break;
        case "png":
          await onExportPNG();
          break;
        case "svg":
          await onExportSVG();
          break;
      }
    } catch (error) {
      console.error(`Export 실패 (${type}):`, error);
      // 에러 토스트는 상위 컴포넌트에서 처리
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Export 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: "#6b7280" }}
        title="데이터 및 시각화 Export"
      >
        {isExporting ? (
          <>
            <LoadingIcon className="w-4 h-4 animate-spin" />
            <span>
              {exportingType === "json"
                ? "JSON 생성 중..."
                : exportingType === "png"
                ? "PNG 생성 중..."
                : "SVG 생성 중..."}
            </span>
          </>
        ) : (
          <>
            {/* Export 아이콘 */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>{label}</span>
            {/* 드롭다운 화살표 */}
            <svg
              className={`w-3 h-3 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !isExporting && (
        <div
          className="absolute top-full right-0 mt-2 rounded-lg shadow-lg border border-gray-200 bg-white min-w-[240px] z-50 overflow-hidden"
          style={{
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* JSON Export */}
          <button
            onClick={() => handleExport("json")}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                JSON 데이터
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                필터된 데이터를 JSON 파일로 저장
              </div>
            </div>
          </button>

          {/* PNG Export */}
          <button
            onClick={() => handleExport("png")}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                PNG 이미지
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                전체 화면을 고해상도 이미지로 캡처
              </div>
            </div>
          </button>

          {/* SVG Export */}
          <button
            onClick={() => handleExport("svg")}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                SVG 벡터
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Figma 호환 벡터 파일로 저장
              </div>
            </div>
          </button>

          {/* 안내 문구 */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              💡 PNG는 고해상도(2x), SVG는 Figma Import 가능
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

