/**
 * ModuleSummaryBar 컴포넌트
 * - Summarized 모드에서 모듈별 요약 정보를 표시하는 바
 * - 배경색, 기간, 기능 개수, 담당자 정보 표시
 */

"use client";

import { getModuleColor } from "@/lib/colorDefines";
import { useMemo } from "react";

interface ModuleSummaryBarProps {
  /** 모듈명 */
  module: string;
  /** 프로젝트명 */
  project: string;
  /** 모듈 전체 시작일 */
  startDate: string;
  /** 모듈 전체 종료일 */
  endDate: string;
  /** 기능 개수 */
  featureCount: number;
  /** 기능명 리스트 */
  features: string[];
  /** 담당자 목록 */
  assignees: Array<{
    userId: string;
    displayName?: string;
    role: string;
  }>;
  /** 바의 x 좌표 */
  left: number;
  /** 바의 너비 */
  width: number;
  /** 클릭 핸들러 */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 우클릭 핸들러 */
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * 날짜 포맷 (MM.DD)
 */
function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}.${day}`;
}

/**
 * 이니셜 생성
 */
function getInitials(name: string): string {
  if (!name) return "?";

  // 한글 이름 처리 (예: "홍길동" → "홍")
  if (/^[가-힣]+$/.test(name)) {
    return name.charAt(0);
  }

  // 영문 이름 처리 (예: "John Doe" → "JD")
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.charAt(0).toUpperCase();
}

export function ModuleSummaryBar({
  module,
  project,
  startDate,
  endDate,
  featureCount,
  features,
  assignees,
  left,
  width,
  onClick,
  onContextMenu,
}: ModuleSummaryBarProps) {
  const colors = useMemo(() => getModuleColor(module), [module]);

  // 담당자 최대 5명까지 표시, 나머지는 +N 형태로 표시
  const displayAssignees = assignees.slice(0, 5);
  const remainingCount = Math.max(0, assignees.length - 5);

  // 너비가 충분히 큰 경우에만 상세 정보 표시
  const isWideEnough = width >= 200;
  const isNarrow = width < 120;

  return (
    <div
      className="absolute rounded-lg flex items-center transition-all duration-200 hover:shadow-lg cursor-pointer"
      style={{
        left,
        width,
        height: 36,
        top: 6, // 상하 여백
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        padding: isNarrow ? "0 8px" : "0 12px",
      }}
      title={`${module} (${featureCount}개 기능, ${assignees.length}명)`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* 왼쪽: 모듈명 */}
      <div
        className="flex-shrink-0 font-semibold text-xs truncate"
        style={{ color: colors.text }}
      >
        {module}
      </div>

      {/* 중간: Spacer */}
      <div className="flex-1" />

      {/* 오른쪽: 담당자 + 정보 */}
      {!isNarrow && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 담당자 아이콘 */}
          {displayAssignees.length > 0 && (
            <div className="flex items-center">
              {displayAssignees.map((assignee, idx) => (
                <div
                  key={assignee.userId}
                  className="flex items-center justify-center rounded-full text-white text-[10px] font-medium"
                  style={{
                    width: 20,
                    height: 20,
                    background: `hsl(${
                      (assignee.userId.charCodeAt(0) * 137) % 360
                    }, 50%, 50%)`,
                    marginLeft: idx > 0 ? -6 : 0,
                    border: "1px solid white",
                    zIndex: displayAssignees.length - idx,
                  }}
                  title={assignee.displayName || assignee.userId}
                >
                  {getInitials(assignee.displayName || assignee.userId)}
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  className="flex items-center justify-center rounded-full text-[10px] font-medium"
                  style={{
                    width: 20,
                    height: 20,
                    background: colors.border,
                    color: colors.text,
                    marginLeft: -6,
                    border: "1px solid white",
                    zIndex: 0,
                  }}
                  title={`외 ${remainingCount}명`}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          )}

          {/* 기능 개수 + 기간 */}
          {isWideEnough && (
            <div
              className="text-[10px] font-medium whitespace-nowrap"
              style={{ color: colors.text }}
            >
              {featureCount}개 기능 · {formatShortDate(startDate)} -{" "}
              {formatShortDate(endDate)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
