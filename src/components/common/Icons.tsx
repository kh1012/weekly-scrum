"use client";

/**
 * 공통 아이콘 컴포넌트 (SVG 기반)
 * FontAwesome 스타일 아이콘을 SVG로 구현
 */

import { memo, SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const createIcon = (paths: string[], viewBox = "0 0 24 24") => {
  const Icon = memo(function Icon({
    size = 16,
    className = "",
    ...props
  }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  });
  Icon.displayName = "Icon";
  return Icon;
};

// 캘린더
export const CalendarIcon = createIcon([
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
]);

// 로켓 (릴리즈)
export const RocketIcon = createIcon([
  "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
]);

// 새로고침 (스프린트)
export const RefreshIcon = createIcon([
  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
]);

// 폴더 (프로젝트)
export const FolderIcon = createIcon([
  "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
]);

// 큐브 (모듈)
export const CubeIcon = createIcon([
  "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
]);

// 코드 (기능)
export const CodeIcon = createIcon(["M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"]);

// 체크
export const CheckIcon = createIcon(["M5 13l4 4L19 7"]);

// 정보
export const InfoIcon = createIcon([
  "M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
]);

// 플러스
export const PlusIcon = createIcon(["M12 4v16m8-8H4"]);

// X
export const XIcon = createIcon(["M6 18L18 6M6 6l12 12"]);

// 쉴드 (관리자)
export const ShieldIcon = createIcon([
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
]);

// 눈 (읽기전용)
export const EyeIcon = createIcon([
  "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
]);

// 간트
export const GanttIcon = createIcon(["M4 6h16M4 10h8m-8 4h10m-10 4h6"]);

// 검색
export const SearchIcon = createIcon([
  "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
]);

// 저장
export const SaveIcon = createIcon([
  "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
]);

// 시계 (커밍순)
export const ClockIcon = createIcon([
  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
]);

// 화살표 (좌/우/상/하)
export const ChevronLeftIcon = createIcon(["M15 19l-7-7 7-7"]);
export const ChevronRightIcon = createIcon(["M9 5l7 7-7 7"]);
export const ChevronDownIcon = createIcon(["M19 9l-7 7-7-7"]);
export const ChevronUpIcon = createIcon(["M5 15l7-7 7 7"]);

// 더블 화살표 (모두 펼치기/접기)
export const ChevronsDownIcon = createIcon(["M7 7l5 5 5-5", "M7 13l5 5 5-5"]);
export const ChevronsUpIcon = createIcon([
  "M17 17l-5-5-5 5",
  "M17 11l-5-5-5 5",
]);

// 모두 펼치기 (계층 구조 확장)
export const ExpandAllIcon = createIcon(["M4 6h16", "M4 12h16", "M4 18h16"]);

// 모두 접기 (계층 구조 축소)
export const CollapseAllIcon = createIcon(["M4 6h16", "M4 12h10", "M4 18h6"]);

// 휴지통
export const TrashIcon = createIcon([
  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
]);

// 복사
export const CopyIcon = createIcon([
  "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
]);

// 명령
export const CommandIcon = createIcon([
  "M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z",
]);

// 필터
export const FilterIcon = createIcon([
  "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
]);

// 전구 (힌트)
export const LightbulbIcon = createIcon([
  "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
]);

// 리스트
export const ListIcon = createIcon(["M4 6h16M4 10h16M4 14h16M4 18h16"]);

// 캘린더 (날짜)
export const CalendarDaysIcon = createIcon([
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  "M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01",
]);

// 잠금 (닫힘)
export const LockClosedIcon = createIcon([
  "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
]);

// 잠금 (열림)
export const LockOpenIcon = createIcon([
  "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
]);

// 재생
export const PlayIcon = createIcon([
  "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
  "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
]);

// 정지
export const StopIcon = createIcon([
  "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
]);

// 실행 취소
export const UndoIcon = createIcon([
  "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
]);

// 다시 실행
export const RedoIcon = createIcon([
  "M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6",
]);

// 도움말
export const HelpIcon = createIcon([
  "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
]);

// 경고
export const AlertIcon = createIcon([
  "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
]);

// 드래그 핸들
export const DragHandleIcon = createIcon(["M4 8h16M4 16h16"]);

// 더블 화살표 (확장/축소)
export const ExpandIcon = createIcon([
  "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
]);

// 줌 인
export const ZoomInIcon = createIcon([
  "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7",
]);

// 줌 아웃
export const ZoomOutIcon = createIcon([
  "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7",
]);

// 스타 (임시)
export const StarIcon = memo(function StarIcon({
  size = 16,
  className = "",
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
});

// 사용자
export const UserIcon = createIcon([
  "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
]);

// 로딩 스피너
export const LoadingIcon = createIcon([
  "M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M8.76 15.24l-2.83 2.83m11.31 0l-2.83-2.83M8.76 8.76L5.93 5.93",
]);
