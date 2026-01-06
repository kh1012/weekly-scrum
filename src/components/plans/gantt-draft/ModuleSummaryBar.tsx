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
  /** 평균 진행률 */
  avgProgress?: number;
  /** Entry만 있는지 여부 */
  isEntryOnly?: boolean;
  /** Entry와 Plan이 혼합된 경우 */
  isMixed?: boolean;
  /** Entry 작성자 목록 */
  authors?: Array<{
    userId: string;
    displayName?: string;
  }>;
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
  avgProgress,
  isEntryOnly = false,
  isMixed = false,
  authors = [],
}: ModuleSummaryBarProps) {
  // 색상 결정
  const colors = useMemo(() => {
    if (isEntryOnly) {
      // Entry만 있는 경우: 검정 border, 흰색 배경, 검정 글씨
      return {
        bg: "rgba(255, 255, 255, 0.6)",
        border: "rgba(0, 0, 0, 0.3)",
        text: "rgba(0, 0, 0, 0.8)",
      };
    } else if (isMixed) {
      // 혼합된 경우: 보라색 계열
      return {
        bg: "rgba(243, 232, 255, 0.5)",
        border: "rgba(168, 85, 247, 0.5)",
        text: "rgba(124, 58, 237, 0.85)",
      };
    } else {
      // Plan만 있는 경우: 기존 모듈 색상
      return getModuleColor(module);
    }
  }, [module, isEntryOnly, isMixed]);

  // 프로필 아이콘 표시 로직
  const profiles = useMemo(() => {
    if (isEntryOnly) {
      // Entry만: authors만 표시
      return authors.map((author) => ({
        userId: author.userId,
        displayName: author.displayName,
      }));
    } else if (isMixed) {
      // 혼합: assignees + authors (중복 제거)
      const userMap = new Map<
        string,
        { userId: string; displayName?: string }
      >();

      // assignees 먼저
      assignees.forEach((assignee) => {
        userMap.set(assignee.userId, {
          userId: assignee.userId,
          displayName: assignee.displayName,
        });
      });

      // authors 추가 (중복 제거)
      authors.forEach((author) => {
        if (!userMap.has(author.userId)) {
          userMap.set(author.userId, {
            userId: author.userId,
            displayName: author.displayName,
          });
        }
      });

      return Array.from(userMap.values());
    } else {
      // Plan만: assignees만 표시
      return assignees.map((assignee) => ({
        userId: assignee.userId,
        displayName: assignee.displayName,
      }));
    }
  }, [isEntryOnly, isMixed, assignees, authors]);

  // 프로필 최대 5명까지 표시, 나머지는 +N 형태로 표시
  const displayProfiles = profiles.slice(0, 5);
  const remainingCount = Math.max(0, profiles.length - 5);

  // 너비가 충분히 큰 경우에만 상세 정보 표시
  const isWideEnough = width >= 200;
  const isNarrow = width < 120;

  // 진행률 표시 여부
  const showProgress = avgProgress !== undefined && avgProgress !== null;

  return (
    <div
      className="absolute rounded-lg flex items-center transition-all duration-200 hover:shadow-lg cursor-pointer"
      style={{
        left,
        width,
        height: 36,
        top: 6, // 상하 여백
        background: colors.bg,
        border: isMixed
          ? `1px dashed ${colors.border}`
          : `1px solid ${colors.border}`,
        color: colors.text,
        padding: isNarrow ? "0 8px" : "0 12px",
      }}
      title={`${module} (${featureCount}개 기능, ${profiles.length}명)`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* 왼쪽: 모듈명 */}
      <div
        className="flex-shrink-0 font-semibold text-[10px] truncate"
        style={{ color: colors.text }}
      >
        {module}
      </div>

      {/* 중간: Spacer */}
      <div className="flex-1" />

      {/* 오른쪽: 담당자 + 정보 + 진행률 */}
      {!isNarrow && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 프로필 아이콘 */}
          {displayProfiles.length > 0 && (
            <div className="flex items-center">
              {displayProfiles.map((profile, idx) => (
                <div
                  key={profile.userId}
                  className="flex items-center justify-center rounded-full text-white text-[10px] font-medium"
                  style={{
                    width: 20,
                    height: 20,
                    background: `hsl(${
                      (profile.userId.charCodeAt(0) * 137) % 360
                    }, 50%, 50%)`,
                    marginLeft: idx > 0 ? -6 : 0,
                    border: "1px solid white",
                    zIndex: displayProfiles.length - idx,
                  }}
                  title={profile.displayName || profile.userId}
                >
                  {getInitials(profile.displayName || profile.userId)}
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

          {/* 원형 진행률 프로그래스바 */}
          {showProgress && width > 100 && (
            <div className="relative w-8 h-8 flex-shrink-0">
              <svg className="w-8 h-8 -rotate-90">
                {/* 배경 원 */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                {/* 진행률 원 */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray={`${((avgProgress || 0) / 100) * 75.4} 75.4`}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                style={{ color: "#6b7280" }}
              >
                {Math.round(avgProgress || 0)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
