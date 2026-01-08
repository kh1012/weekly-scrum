/**
 * More Options Menu Component
 * Export와 Performance 옵션을 제공하는 더보기 메뉴
 * ExportDropdown 스타일을 따름
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { LoadingIcon } from "@/components/common/Icons";
import { getFeatureFlags, setFeatureFlag } from "./featureFlags";
import type { ExportQuality } from "@/components/common/ExportDropdown";

export interface MoreOptionsMenuProps {
  /** JSON export 핸들러 */
  onExportJSON: () => Promise<void>;
  /** PNG export 핸들러 (품질 옵션 포함) */
  onExportPNG: (quality?: ExportQuality) => Promise<void>;
  /** PNG Draw export 핸들러 (품질 옵션 포함) */
  onExportDraw: (quality?: ExportQuality) => Promise<void>;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 읽기 전용 모드 (Performance 설정을 보여줄지 결정) */
  readOnly?: boolean;
}

type ExportType = "json" | "png" | "draw";

// 품질별 설정
const QUALITY_PRESETS = {
  low: { scale: 1, label: "저품질", description: "빠른 생성 (1x)" },
  normal: { scale: 2, label: "기본", description: "표준 품질 (2x)" },
  high: { scale: 3, label: "고품질", description: "최고 품질 (3x)" },
};

export function MoreOptionsMenu({
  onExportJSON,
  onExportPNG,
  onExportDraw,
  disabled = false,
  readOnly = false,
}: MoreOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showPNGQuality, setShowPNGQuality] = useState(false);
  const [showDrawQuality, setShowDrawQuality] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [selectedPNGQuality, setSelectedPNGQuality] =
    useState<ExportQuality>("normal");
  const [selectedDrawQuality, setSelectedDrawQuality] =
    useState<ExportQuality>("normal");

  // Performance 설정
  const [perfFlags, setPerfFlags] = useState(getFeatureFlags());
  const [needsReload, setNeedsReload] = useState(false);

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
        setShowExport(false);
        setShowPerformance(false);
        setShowPNGQuality(false);
        setShowDrawQuality(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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

    try {
      setIsExporting(true);
      setExportingType(type);

      if (type === "json") {
        await onExportJSON();
      } else if (type === "png") {
        await onExportPNG(quality);
        // 품질 저장
        if (quality) {
          localStorage.setItem("export-png-quality", quality);
          setSelectedPNGQuality(quality);
        }
      } else if (type === "draw") {
        await onExportDraw(quality);
        // 품질 저장
        if (quality) {
          localStorage.setItem("export-draw-quality", quality);
          setSelectedDrawQuality(quality);
        }
      }

      setIsOpen(false);
      setShowExport(false);
      setShowPNGQuality(false);
      setShowDrawQuality(false);
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  const handlePerformanceFlagChange = (
    key: keyof typeof perfFlags,
    value: boolean
  ) => {
    setFeatureFlag(key, value);
    setPerfFlags(getFeatureFlags());
    setNeedsReload(true);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 더보기 버튼 */}
      <button
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setShowExport(false);
            setShowPerformance(false);
          }
        }}
        disabled={disabled || isExporting}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 
          text-sm font-medium rounded-md
          transition-all duration-200
          ${
            disabled || isExporting
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 shadow-sm"
          }
        `}
      >
        {isExporting ? (
          <LoadingIcon className="w-4 h-4" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        )}
        <span>더보기</span>
      </button>

      {/* 메인 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {/* Export 옵션 */}
          <div className="relative">
            <button
              onMouseEnter={() => {
                setShowExport(true);
                setShowPerformance(false);
              }}
              onClick={() => setShowExport(!showExport)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Export</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Beta</span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </span>
            </button>

            {/* Export 서브메뉴 (좌측 cascading) */}
            {showExport && (
              <div className="absolute right-full top-0 mr-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                {/* JSON */}
                <button
                  onClick={() => handleExport("json")}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span>JSON</span>
                    {isExporting && exportingType === "json" && (
                      <LoadingIcon className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* PNG */}
                <div className="relative">
                  <button
                    onMouseEnter={() => {
                      setShowPNGQuality(true);
                      setShowDrawQuality(false);
                    }}
                    onClick={() => handleExport("png")}
                    disabled={isExporting}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <span>PNG (html2canvas)</span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* PNG 품질 선택 */}
                  {showPNGQuality && (
                    <div className="absolute right-full top-0 mr-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                      {(["low", "normal", "high"] as ExportQuality[]).map(
                        (quality) => (
                          <button
                            key={quality}
                            onClick={() => handleExport("png", quality)}
                            disabled={isExporting}
                            className={`
                              w-full text-left px-4 py-2 text-sm hover:bg-gray-50
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                selectedPNGQuality === quality
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {QUALITY_PRESETS[quality].label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {QUALITY_PRESETS[quality].description}
                                </div>
                              </div>
                              {isExporting &&
                                exportingType === "png" &&
                                selectedPNGQuality === quality && (
                                  <LoadingIcon className="w-4 h-4" />
                                )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* PNG Draw */}
                <div className="relative">
                  <button
                    onMouseEnter={() => {
                      setShowDrawQuality(true);
                      setShowPNGQuality(false);
                    }}
                    onClick={() => handleExport("draw")}
                    disabled={isExporting}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <span>PNG (Canvas Draw)</span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Draw 품질 선택 */}
                  {showDrawQuality && (
                    <div className="absolute right-full top-0 mr-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                      {(["low", "normal", "high"] as ExportQuality[]).map(
                        (quality) => (
                          <button
                            key={quality}
                            onClick={() => handleExport("draw", quality)}
                            disabled={isExporting}
                            className={`
                              w-full text-left px-4 py-2 text-sm hover:bg-gray-50
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                selectedDrawQuality === quality
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {QUALITY_PRESETS[quality].label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {QUALITY_PRESETS[quality].description}
                                </div>
                              </div>
                              {isExporting &&
                                exportingType === "draw" &&
                                selectedDrawQuality === quality && (
                                  <LoadingIcon className="w-4 h-4" />
                                )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Performance 옵션 (읽기 모드일 때만 표시) */}
          {readOnly && (
            <div className="relative">
              <button
                onMouseEnter={() => {
                  setShowPerformance(true);
                  setShowExport(false);
                }}
                onClick={() => setShowPerformance(!showPerformance)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Performance</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Beta</span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </span>
              </button>

              {/* Performance 서브메뉴 (좌측 cascading) */}
              {showPerformance && (
                <div className="absolute right-full top-0 mr-1 w-72 bg-white rounded-md shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      성능 최적화 설정
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      설정 변경 후 새로고침이 필요합니다
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    {/* RAF 스로틀링 */}
                    <div className="px-4 py-2 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            RAF 스로틀링
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            마우스 드래그 부드럽게
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={perfFlags.enableRAFThrottle}
                          onChange={(e) =>
                            handlePerformanceFlagChange(
                              "enableRAFThrottle",
                              e.target.checked
                            )
                          }
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>

                    {/* 가상화 */}
                    <div className="px-4 py-2 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            가상 스크롤링
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            대량 데이터 성능 개선
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={perfFlags.enableVirtualization}
                          onChange={(e) =>
                            handlePerformanceFlagChange(
                              "enableVirtualization",
                              e.target.checked
                            )
                          }
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>

                    {/* 성능 로깅 */}
                    <div className="px-4 py-2 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            성능 로깅
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            콘솔에서 FPS 측정
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={perfFlags.enablePerformanceLogging}
                          onChange={(e) =>
                            handlePerformanceFlagChange(
                              "enablePerformanceLogging",
                              e.target.checked
                            )
                          }
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>

                    {/* 디버그 모드 */}
                    <div className="px-4 py-2 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            디버그 모드
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            상세 로그 출력
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={perfFlags.enableDebugMode}
                          onChange={(e) =>
                            handlePerformanceFlagChange(
                              "enableDebugMode",
                              e.target.checked
                            )
                          }
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 새로고침 필요 경고 */}
                  {needsReload && (
                    <div className="px-4 py-2 border-t border-gray-200">
                      <div className="flex items-center justify-between gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <span className="text-xs text-amber-800">
                            새로고침 필요
                          </span>
                        </div>
                        <button
                          onClick={handleReload}
                          className="px-2 py-1 text-xs font-medium text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300"
                        >
                          새로고침
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

