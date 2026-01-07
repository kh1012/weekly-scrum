/**
 * Export Dropdown Component
 * JSON, PNG, SVG, Figma export 옵션을 제공하는 드롭다운 메뉴
 * GitHub 스타일 디자인 적용
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

type ExportType = "json" | "png" | "svg" | "figma";

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
  const [showFigmaSettings, setShowFigmaSettings] = useState(false);
  const [figmaToken, setFigmaToken] = useState("");
  const [figmaFileKey, setFigmaFileKey] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Figma 설정 불러오기
  useEffect(() => {
    try {
      const token = localStorage.getItem("figma-access-token") || "";
      const fileKey = localStorage.getItem("figma-file-key") || "";
      setFigmaToken(token);
      setFigmaFileKey(fileKey);
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
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleExport = async (type: ExportType) => {
    if (isExporting) return;

    if (type === "figma") {
      setShowFigmaSettings(true);
      setIsOpen(false);
      return;
    }

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

  const handleFigmaExport = async () => {
    if (!figmaToken || !figmaFileKey) {
      alert("Figma Access Token과 File Key를 입력해주세요.");
      return;
    }

    setIsExporting(true);
    setExportingType("figma");
    setShowFigmaSettings(false);

    try {
      // Figma 설정 저장
      localStorage.setItem("figma-access-token", figmaToken);
      localStorage.setItem("figma-file-key", figmaFileKey);

      // SVG를 먼저 생성하고 Figma에 업로드
      await onExportSVG();
      
      // 실제 Figma API 호출은 향후 구현 예정
      // 현재는 SVG 다운로드만 수행
      alert(
        "SVG 파일이 다운로드되었습니다.\n" +
        "Figma에서 File > Import를 통해 업로드해주세요.\n" +
        "자동 업로드 기능은 추후 업데이트 예정입니다."
      );
    } catch (error) {
      console.error("Figma Export 실패:", error);
      alert("Figma Export에 실패했습니다.");
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Export 버튼 - GitHub 스타일 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isExporting}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  : exportingType === "figma"
                  ? "Figma 연동 중..."
                  : "SVG 생성 중..."}
              </span>
            </>
          ) : (
            <>
              {/* Download 아이콘 (GitHub 스타일) */}
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
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
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M3.5 1.75a.25.25 0 01.25-.25h3.5a.75.75 0 010 1.5h-3.5a.25.25 0 01-.25-.25v-1.5zm-2 0A2.25 2.25 0 013.75 0h3.5a2.25 2.25 0 011.5 3.93v6.64a2.25 2.25 0 01-1.5 3.93h-3.5a2.25 2.25 0 01-1.5-3.93V3.93A2.25 2.25 0 011.5 1.75zm8.75 11.5a.25.25 0 01.25-.25h3.5a.25.25 0 01.25.25v1.5a.25.25 0 01-.25.25h-3.5a.25.25 0 01-.25-.25v-1.5zm-2 0c0-1.118.82-2.04 1.875-2.197V4.447A2.25 2.25 0 0110.25 2h3.5A2.25 2.25 0 0116 4.25v1.5a2.25 2.25 0 01-1.5 3.93v6.64a2.25 2.25 0 01-1.875 2.197V13.25z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600">
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
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M1.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h.94a.76.76 0 01-.03-.03l-1.11-1.11A1.75 1.75 0 011.5 2.75c0-.966.784-1.75 1.75-1.75h8.5a1.75 1.75 0 011.75 1.75v8.5c0 .698-.409 1.3-1 1.58v-8.33a.25.25 0 00-.25-.25h-10.5zM11 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM2.75 14a.25.25 0 01-.22-.364l3.69-7.38a.75.75 0 011.32 0L10.78 13a.75.75 0 01-.66 1.11H2.75z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600">
                  PNG 이미지
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  고해상도 이미지로 화면 캡처 (2x)
                </div>
              </div>
            </button>

            {/* SVG Export */}
            <button
              onClick={() => handleExport("svg")}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M3.5 3.5a1 1 0 011-1h7a1 1 0 011 1v7a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7zM4.5 2a2.5 2.5 0 00-2.5 2.5v7A2.5 2.5 0 004.5 14h7a2.5 2.5 0 002.5-2.5v-7A2.5 2.5 0 0011.5 2h-7z" />
                  <path d="M5.75 4.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 3a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 3a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600">
                  SVG 벡터
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Figma Import 가능한 벡터 파일
                </div>
              </div>
            </button>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-1" />

            {/* Figma API Export */}
            <button
              onClick={() => handleExport("figma")}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-purple-50 hover:text-purple-600 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 38 57"
                >
                  <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                  <path d="M0 47.5C0 42.26 4.26 38 9.5 38H19V47.5C19 52.74 14.74 57 9.5 57C4.26 57 0 52.74 0 47.5Z" />
                  <path d="M19 0V19H28.5C33.74 19 38 14.74 38 9.5C38 4.26 33.74 0 28.5 0H19Z" />
                  <path d="M0 9.5C0 14.74 4.26 19 9.5 19H19V0H9.5C4.26 0 0 4.26 0 9.5Z" />
                  <path d="M0 28.5C0 33.74 4.26 38 9.5 38H19V19H9.5C4.26 19 0 23.26 0 28.5Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-purple-600 flex items-center gap-1">
                  Figma 자동 연동
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-700 rounded">
                    BETA
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Figma REST API로 직접 업로드
                </div>
              </div>
            </button>

            {/* 안내 문구 */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                <span className="font-semibold">💡 Tip:</span> SVG는 벡터 편집
                가능, PNG는 즉시 공유용
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Figma 설정 모달 */}
      {showFigmaSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          onClick={() => setShowFigmaSettings(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 38 57"
                  >
                    <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                    <path d="M0 47.5C0 42.26 4.26 38 9.5 38H19V47.5C19 52.74 14.74 57 9.5 57C4.26 57 0 52.74 0 47.5Z" />
                    <path d="M19 0V19H28.5C33.74 19 38 14.74 38 9.5C38 4.26 33.74 0 28.5 0H19Z" />
                    <path d="M0 9.5C0 14.74 4.26 19 9.5 19H19V0H9.5C4.26 0 0 4.26 0 9.5Z" />
                    <path d="M0 28.5C0 33.74 4.26 38 9.5 38H19V19H9.5C4.26 19 0 23.26 0 28.5Z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Figma 연동 설정
                  </h3>
                </div>
                <button
                  onClick={() => setShowFigmaSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* 본문 */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Figma Access Token
                  <a
                    href="https://www.figma.com/developers/api#access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-700 text-xs"
                  >
                    발급받기 →
                  </a>
                </label>
                <input
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="figd_..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Figma File Key
                  <span className="ml-2 text-xs text-gray-500">
                    (URL에서 확인 가능)
                  </span>
                </label>
                <input
                  type="text"
                  value={figmaFileKey}
                  onChange={(e) => setFigmaFileKey(e.target.value)}
                  placeholder="예: abc123def456..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-semibold">📝 참고:</span> Figma File
                  Key는 URL에서 확인할 수 있습니다.
                  <br />
                  <code className="text-[10px] bg-blue-100 px-1 py-0.5 rounded">
                    figma.com/file/[FILE_KEY]/...
                  </code>
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setShowFigmaSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                onClick={handleFigmaExport}
                disabled={!figmaToken || !figmaFileKey}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                연동하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

