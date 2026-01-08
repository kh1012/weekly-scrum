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
import type { CanvasOptions } from "@/lib/export/types";

export interface MoreOptionsMenuProps {
  /** JSON export 핸들러 */
  onExportJSON: () => Promise<void>;
  /** PNG export 핸들러 (품질 옵션 포함) */
  onExportPNG: (
    quality?: ExportQuality,
    options?: { returnBlob?: boolean }
  ) => Promise<Blob | void>;
  /** PNG Draw export 핸들러 (품질 옵션 포함) */
  onExportDraw: (
    quality?: ExportQuality,
    canvasOptions?: CanvasOptions,
    options?: { returnBlob?: boolean }
  ) => Promise<Blob | void>;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 읽기 전용 모드 (Performance 설정을 보여줄지 결정) */
  readOnly?: boolean;
  /** Alignment 페이지 여부 */
  isAlignmentPage?: boolean;
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
  isAlignmentPage = false,
}: MoreOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showPNGQuality, setShowPNGQuality] = useState(false);
  const [showDrawQuality, setShowDrawQuality] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);

  // Figma 연동 관련 상태
  const [isFigmaConnected, setIsFigmaConnected] = useState(false);
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<"figma" | "figjam">(
    "figjam"
  );
  const [exportMethod, setExportMethod] = useState<"png" | "draw">("png");

  // Canvas 옵션 상태
  const [showTableColumns, setShowTableColumns] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [showProgressGradient, setShowProgressGradient] = useState(true);
  const [showAlignmentArrows, setShowAlignmentArrows] = useState(true);

  // Performance 설정
  const [perfFlags, setPerfFlags] = useState(getFeatureFlags());
  const [needsReload, setNeedsReload] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Canvas 옵션 불러오기
  useEffect(() => {
    try {
      const savedShowTableColumns = localStorage.getItem(
        "export-canvas-show-table-columns"
      );
      const savedShowMetadata = localStorage.getItem(
        "export-canvas-show-metadata"
      );
      const savedShowLegend = localStorage.getItem("export-canvas-show-legend");
      const savedShowStatistics = localStorage.getItem(
        "export-canvas-show-statistics"
      );
      const savedShowProgressGradient = localStorage.getItem(
        "export-canvas-show-progress-gradient"
      );
      const savedShowAlignmentArrows = localStorage.getItem(
        "export-canvas-show-alignment-arrows"
      );

      if (savedShowTableColumns !== null)
        setShowTableColumns(savedShowTableColumns === "true");
      if (savedShowMetadata !== null)
        setShowMetadata(savedShowMetadata === "true");
      if (savedShowLegend !== null) setShowLegend(savedShowLegend === "true");
      if (savedShowStatistics !== null)
        setShowStatistics(savedShowStatistics === "true");
      if (savedShowProgressGradient !== null)
        setShowProgressGradient(savedShowProgressGradient === "true");
      if (savedShowAlignmentArrows !== null)
        setShowAlignmentArrows(savedShowAlignmentArrows === "true");
    } catch {
      // localStorage 접근 실패 시 무시
    }
  }, []);

  // Figma 연동 상태 확인
  useEffect(() => {
    checkFigmaConnection();

    const savedPlatform = localStorage.getItem("figma-platform");
    if (savedPlatform) setTargetPlatform(savedPlatform as "figma" | "figjam");

    const savedMethod = localStorage.getItem("figma-export-method");
    if (savedMethod) setExportMethod(savedMethod as "png" | "draw");
  }, []);

  async function checkFigmaConnection() {
    try {
      const { createClient } = await import("@/lib/supabase/browser");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("figma_encrypted_tokens")
        .eq("id", user.id)
        .single();

      setIsFigmaConnected(!!data?.figma_encrypted_tokens);
    } catch (error) {
      console.error("[Figma Connection Check]", error);
    }
  }

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
      } else if (type === "draw") {
        // Canvas 옵션 전달
        const canvasOptions: CanvasOptions = {
          showTableColumns,
          showMetadata,
          showLegend,
          showStatistics,
          showProgressGradient,
          showAlignmentArrows: isAlignmentPage && showAlignmentArrows,
          columnConfig: {
            showAssignees: true,
            showStatus: true,
            showProgress: false,
          },
        };
        await onExportDraw(quality, canvasOptions);
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

  const handleFigmaClick = () => {
    // 연동되어 있을 때만 호출됨 (버튼 disabled 처리)
    setShowFigmaModal(true);
    setIsOpen(false);
    setShowExport(false);
  };

  const handleFigmaUpload = async () => {
    setShowFigmaModal(false);
    setIsExporting(true);
    setExportingType("figma" as ExportType);
    setIsOpen(false);

    try {
      // 1. PNG 생성 (선택한 방식에 따라)
      let blob: Blob;
      if (exportMethod === "png") {
        // HTML2Canvas 방식
        blob = (await onExportPNG("normal", { returnBlob: true })) as Blob;
      } else {
        // Canvas Draw 방식
        const canvasOptions: CanvasOptions = {
          showTableColumns,
          showMetadata,
          showLegend,
          showStatistics,
          showProgressGradient,
          showAlignmentArrows: isAlignmentPage && showAlignmentArrows,
          columnConfig: {
            showAssignees: true,
            showStatus: true,
            showProgress: false,
          },
        };
        blob = (await onExportDraw("normal", canvasOptions, {
          returnBlob: true,
        })) as Blob;
      }

      // 2. Figma 업로드
      const formData = new FormData();
      formData.append("image", blob, "gantt.png");
      formData.append(
        "filename",
        `Gantt Chart ${new Date().toLocaleDateString()}`
      );
      formData.append("platform", targetPlatform);

      const res = await fetch("/api/figma/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      const platformName = targetPlatform === "figjam" ? "FigJam" : "Figma";

      alert(
        `✅ ${platformName}에 업로드 완료!\n\n` +
          `파일: ${data.fileUrl}\n\n` +
          `📌 파일을 열어 이미지를 캔버스로 드래그하세요.`
      );

      window.open(data.fileUrl, "_blank");
    } catch (error) {
      console.error("[Figma Upload]", error);
      alert(
        `Figma 업로드 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
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
      {/* 추가 기능 버튼 */}
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
          flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${
            disabled || isExporting
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }
        `}
      >
        {isExporting ? <LoadingIcon className="w-3.5 h-3.5" /> : null}
        <span>추가 기능</span>
      </button>

      {/* 메인 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 text-xs">
          {/* Export 옵션 */}
          <div className="relative">
            <button
              onMouseEnter={() => {
                setShowExport(true);
                setShowPerformance(false);
              }}
              onClick={() => setShowExport(!showExport)}
              className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5"
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
                <span className="font-medium">Export</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                  Beta
                </span>
              </span>
              <svg
                className="w-3.5 h-3.5 text-gray-400"
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

            {/* Export 서브메뉴 (좌측 cascading) */}
            {showExport && (
              <div className="absolute right-full top-0 mr-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 text-xs">
                {/* JSON */}
                <button
                  onClick={() => handleExport("json")}
                  disabled={isExporting}
                  className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">JSON</span>
                    {isExporting && exportingType === "json" && (
                      <LoadingIcon className="w-3.5 h-3.5" />
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
                    className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">PNG</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-200">
                        html2canvas
                      </span>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
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
                    <div className="absolute right-full top-0 mr-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 text-xs">
                      {(["low", "normal", "high"] as ExportQuality[]).map(
                        (quality) => (
                          <button
                            key={quality}
                            onClick={() => handleExport("png", quality)}
                            disabled={isExporting}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-medium">
                                  {QUALITY_PRESETS[quality].label}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {QUALITY_PRESETS[quality].description}
                                </div>
                              </div>
                              {isExporting && exportingType === "png" && (
                                <LoadingIcon className="w-3.5 h-3.5" />
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
                    className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">PNG</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
                        Canvas Draw
                      </span>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
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
                    <div className="absolute right-full top-0 mr-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 text-xs">
                      {(["low", "normal", "high"] as ExportQuality[]).map(
                        (quality) => (
                          <button
                            key={quality}
                            onClick={() => handleExport("draw", quality)}
                            disabled={isExporting}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-medium">
                                  {QUALITY_PRESETS[quality].label}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {QUALITY_PRESETS[quality].description}
                                </div>
                              </div>
                              {isExporting && exportingType === "draw" && (
                                <LoadingIcon className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div className="border-t border-gray-200 my-1" />

                {/* Figma */}
                <div className="w-full px-3 py-1.5 flex items-center justify-between gap-2">
                  <button
                    onClick={isFigmaConnected ? handleFigmaClick : undefined}
                    disabled={!isFigmaConnected || isExporting}
                    className={`flex items-center gap-1.5 flex-1 ${
                      isFigmaConnected
                        ? "text-gray-700 hover:text-gray-900 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 38 57"
                    >
                      <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                      <path d="M0 47.5C0 42.26 4.26 38 9.5 38H19V47.5C19 52.74 14.74 57 9.5 57C4.26 57 0 52.74 0 47.5Z" />
                      <path d="M19 0V19H28.5C33.74 19 38 14.74 38 9.5C38 4.26 33.74 0 28.5 0H19Z" />
                      <path d="M0 9.5C0 14.74 4.26 19 9.5 19H19V0H9.5C4.26 0 0 4.26 0 9.5Z" />
                      <path d="M0 28.5C0 33.74 4.26 38 9.5 38H19V19H9.5C4.26 19 0 23.26 0 28.5Z" />
                    </svg>
                    <span className="font-medium">Figma</span>
                    {isFigmaConnected && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
                        연동됨
                      </span>
                    )}
                  </button>
                  {!isFigmaConnected && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowExport(false);
                        window.location.href = "/settings";
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <span>연동하러 가기</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </button>
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
                className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
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
                  <span className="font-medium">Performance</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                    Beta
                  </span>
                </span>
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
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

              {/* Performance 서브메뉴 (좌측 cascading) */}
              {showPerformance && (
                <div className="absolute right-full top-0 mr-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 text-xs">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <div className="font-semibold text-gray-900">
                      성능 최적화 설정
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      설정 변경 후 새로고침이 필요합니다
                    </div>
                  </div>

                  <div className="py-1">
                    {/* RAF 스로틀링 */}
                    <div className="px-3 py-1.5 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700">
                            RAF 스로틀링
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
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
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                      </label>
                    </div>

                    {/* 가상화 */}
                    <div className="px-3 py-1.5 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700">
                            가상 스크롤링
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
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
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                      </label>
                    </div>

                    {/* 고급 메모이제이션 */}
                    <div className="px-3 py-1.5 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700">
                            고급 메모이제이션
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            렌더링 최적화 강화
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={perfFlags.enableAdvancedMemo}
                          onChange={(e) =>
                            handlePerformanceFlagChange(
                              "enableAdvancedMemo",
                              e.target.checked
                            )
                          }
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                      </label>
                    </div>

                    <div className="my-1.5 h-[1px] bg-gray-100 w-full" />

                    {/* 성능 로깅 */}
                    <div className="px-3 py-1.5 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700">
                            성능 로깅
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
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
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                      </label>
                    </div>

                    {/* 디버그 모드 */}
                    <div className="px-3 py-1.5 hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700">
                            디버그 모드
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
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
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 새로고침 필요 경고 */}
                  {needsReload && (
                    <div className="px-3 py-2 border-t border-gray-200">
                      <div className="flex items-center justify-between gap-2 p-1.5 bg-amber-50 rounded border border-amber-200">
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5 text-amber-600 flex-shrink-0"
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
                          <span className="text-[10px] text-amber-800 font-medium">
                            새로고침 필요
                          </span>
                        </div>
                        <button
                          onClick={handleReload}
                          className="px-2 py-0.5 text-[10px] font-medium text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 flex-shrink-0"
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

      {/* Figma 설정 모달 */}
      {showFigmaModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          onClick={() => setShowFigmaModal(false)}
        >
          <div
            className="bg-white rounded-md border border-gray-300 max-w-sm w-full mx-4"
            style={{
              boxShadow:
                "0 8px 24px rgba(140, 149, 159, 0.2), 0 0 1px rgba(27, 31, 35, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Figma 업로드
                </h3>
                <button
                  onClick={() => setShowFigmaModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 본문 */}
            <div className="px-4 py-3 space-y-3">
              {/* 플랫폼 선택 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  업로드 대상
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTargetPlatform("figjam");
                      localStorage.setItem("figma-platform", "figjam");
                    }}
                    className={`flex-1 px-3 py-2 text-xs rounded-md border ${
                      targetPlatform === "figjam"
                        ? "bg-purple-50 border-purple-600 text-purple-700 font-medium"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    FigJam
                  </button>
                  <button
                    onClick={() => {
                      setTargetPlatform("figma");
                      localStorage.setItem("figma-platform", "figma");
                    }}
                    className={`flex-1 px-3 py-2 text-xs rounded-md border ${
                      targetPlatform === "figma"
                        ? "bg-purple-50 border-purple-600 text-purple-700 font-medium"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Figma
                  </button>
                </div>
              </div>

              {/* Export 방식 선택 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Export 방식
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setExportMethod("png");
                      localStorage.setItem("figma-export-method", "png");
                    }}
                    className={`flex-1 px-3 py-2 text-xs rounded-md border ${
                      exportMethod === "png"
                        ? "bg-blue-50 border-blue-600 text-blue-700 font-medium"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    빠름 (html2canvas)
                  </button>
                  <button
                    onClick={() => {
                      setExportMethod("draw");
                      localStorage.setItem("figma-export-method", "draw");
                    }}
                    className={`flex-1 px-3 py-2 text-xs rounded-md border ${
                      exportMethod === "draw"
                        ? "bg-blue-50 border-blue-600 text-blue-700 font-medium"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    정밀 (Canvas Draw)
                  </button>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  💡 이미지가 {targetPlatform === "figjam" ? "FigJam" : "Figma"}{" "}
                  파일의 Assets에 업로드됩니다.
                  <br />
                  파일을 열어 이미지를 캔버스로 드래그하세요.
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-md">
              <button
                onClick={() => setShowFigmaModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleFigmaUpload}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
