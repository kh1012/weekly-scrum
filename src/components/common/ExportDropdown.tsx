/**
 * Export Dropdown Component
 * JSON, PNG export 옵션을 제공하는 드롭다운 메뉴
 * GitHub 스타일 디자인 적용
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { LoadingIcon } from "./Icons";

export type ExportQuality = "low" | "normal" | "high";

export interface ExportDropdownProps {
  /** JSON export 핸들러 */
  onExportJSON: () => Promise<void>;
  /** PNG export 핸들러 (품질 옵션 포함) - html2canvas 방식 */
  onExportPNG: (quality?: ExportQuality) => Promise<void>;
  /** PNG Draw export 핸들러 (품질 옵션 포함) - Canvas Draw 방식 */
  onExportDraw: (quality?: ExportQuality) => Promise<void>;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 버튼 레이블 */
  label?: string;
}

type ExportType = "json" | "png" | "draw";

// 품질별 설정
const QUALITY_PRESETS = {
  low: { scale: 1, label: "저품질", description: "빠른 생성 (1x)" },
  normal: { scale: 2, label: "기본", description: "표준 품질 (2x)" },
  high: { scale: 3, label: "고품질", description: "최고 품질 (3x)" },
};

export function ExportDropdown({
  onExportJSON,
  onExportPNG,
  onExportDraw,
  disabled = false,
  label = "Export",
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [showPNGQuality, setShowPNGQuality] = useState(false);
  const [showDrawQuality, setShowDrawQuality] = useState(false);
  const [selectedPNGQuality, setSelectedPNGQuality] =
    useState<ExportQuality>("normal");
  const [selectedDrawQuality, setSelectedDrawQuality] =
    useState<ExportQuality>("normal");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 품질 설정 불러오기
  useEffect(() => {
    try {
      const pngQuality =
        (localStorage.getItem("export-png-quality") as ExportQuality) ||
        "normal";
      const drawQuality =
        (localStorage.getItem("export-draw-quality") as ExportQuality) ||
        "normal";
      setSelectedPNGQuality(pngQuality);
      setSelectedDrawQuality(drawQuality);
    } catch {
      // localStorage 접근 실패 시 무시
    }
  }, []);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowPNGQuality(false);
        setShowDrawQuality(false);
      }
    };
    if (isOpen || showPNGQuality || showDrawQuality) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, showPNGQuality, showDrawQuality]);

  const handleExport = async (type: ExportType, quality?: ExportQuality) => {
    if (isExporting) return;

    // PNG/Draw는 품질 선택 메뉴 토글
    if (type === "png" && !quality) {
      setShowPNGQuality(!showPNGQuality);
      setShowDrawQuality(false);
      return;
    }
    if (type === "draw" && !quality) {
      setShowDrawQuality(!showDrawQuality);
      setShowPNGQuality(false);
      return;
    }

    setIsExporting(true);
    setExportingType(type);
    setIsOpen(false);
    setShowPNGQuality(false);
    setShowDrawQuality(false);

    try {
      switch (type) {
        case "json":
          await onExportJSON();
          break;
        case "png":
          await onExportPNG(quality || selectedPNGQuality);
          break;
        case "draw":
          await onExportDraw(quality || selectedDrawQuality);
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

  const handleQualitySelect = (
    quality: ExportQuality,
    type: "png" | "draw"
  ) => {
    if (type === "png") {
      setSelectedPNGQuality(quality);
      try {
        localStorage.setItem("export-png-quality", quality);
      } catch {
        // localStorage 접근 실패 시 무시
      }
    } else if (type === "draw") {
      setSelectedDrawQuality(quality);
      try {
        localStorage.setItem("export-draw-quality", quality);
      } catch {
        // localStorage 접근 실패 시 무시
      }
    }
  };

  const handleExportWithQuality = async (type: "png" | "draw") => {
    if (type === "png") {
      await handleExport(type, selectedPNGQuality);
    } else if (type === "draw") {
      await handleExport(type, selectedDrawQuality);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Export 버튼 - GitHub 스타일 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isExporting}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  : "PNG Draw 생성 중..."}
              </span>
            </>
          ) : (
            <>
              {/* Download 아이콘 (GitHub 스타일) */}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z" />
              </svg>
              <span>{label}</span>
              {/* 드롭다운 화살표 */}
              <svg
                className={`w-3 h-3 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
              </svg>
            </>
          )}
        </button>

        {/* 드롭다운 메뉴 - GitHub 스타일 */}
        {isOpen && !isExporting && (
          <div
            className="absolute top-full right-0 mt-2 py-2 rounded-md border border-gray-200 bg-white min-w-[280px] z-50 overflow-hidden"
            style={{
              boxShadow:
                "0 8px 24px rgba(140, 149, 159, 0.2), 0 0 1px rgba(27, 31, 35, 0.1)",
            }}
          >
            {/* JSON Export */}
            <button
              onClick={() => handleExport("json")}
              className="w-full px-3 py-2 text-xs font-medium text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              JSON
            </button>

            {/* PNG Export [FAST] */}
            <div>
              <button
                onClick={() => handleExport("png")}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  PNG
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-700 rounded">
                    HTML2CANVAS
                  </span>
                </span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${
                    showPNGQuality ? "rotate-90" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" />
                </svg>
              </button>

              {/* PNG 품질 선택 */}
              {showPNGQuality && (
                <div className="bg-gray-50 py-1.5 px-2 space-y-1">
                  {(Object.keys(QUALITY_PRESETS) as ExportQuality[]).map(
                    (quality) => {
                      const preset = QUALITY_PRESETS[quality];
                      return (
                        <button
                          key={quality}
                          onClick={() => handleQualitySelect(quality, "png")}
                          className={`w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors ${
                            selectedPNGQuality === quality
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span>{preset.label}</span>
                          {selectedPNGQuality === quality && (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                            </svg>
                          )}
                        </button>
                      );
                    }
                  )}
                  <button
                    onClick={() => handleExportWithQuality("png")}
                    className="w-full mt-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Export PNG
                  </button>
                </div>
              )}
            </div>

            {/* PNG Draw Export [SLOW BUT DETAILED] */}
            <div>
              <button
                onClick={() => handleExport("draw")}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  PNG
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-700 rounded">
                    CANVAS DRAWN
                  </span>
                </span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${
                    showDrawQuality ? "rotate-90" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" />
                </svg>
              </button>

              {/* PNG Draw 품질 선택 */}
              {showDrawQuality && (
                <div className="bg-gray-50 py-1.5 px-2 space-y-1">
                  {(Object.keys(QUALITY_PRESETS) as ExportQuality[]).map(
                    (quality) => {
                      const preset = QUALITY_PRESETS[quality];
                      return (
                        <button
                          key={quality}
                          onClick={() => handleQualitySelect(quality, "draw")}
                          className={`w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors ${
                            selectedDrawQuality === quality
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span>{preset.label}</span>
                          {selectedDrawQuality === quality && (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                            </svg>
                          )}
                        </button>
                      );
                    }
                  )}
                  <button
                    onClick={() => handleExportWithQuality("draw")}
                    className="w-full mt-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Export PNG
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
