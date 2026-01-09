/**
 * 날짜 유틸리티 통합
 * 
 * 프로젝트 전반에 걸쳐 사용되는 날짜 포맷팅 및 계산 함수를 통합합니다.
 */

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 MM.DD 형식으로 포맷팅
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

/**
 * 날짜를 MM.DD (요일) 형식으로 포맷팅
 */
export function formatDateWithDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekDay = weekDays[d.getDay()];
  return `${month}.${day} (${weekDay})`;
}

/**
 * 날짜 범위를 YYYY.MM.DD ~ YYYY.MM.DD 형식으로 포맷팅
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  
  const formatWithDots = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };
  
  return `${formatWithDots(startDate)} ~ ${formatWithDots(endDate)}`;
}

/**
 * 상대 시간 포맷팅 ("3분 전", "2시간 전", "3일 전" 등)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "방금 전";
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks}주 전`;
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffDay / 365);
    return `${years}년 전`;
  }
}

/**
 * 주차 범위를 문자열로 포맷팅
 */
export function formatWeekRange(year: number, week: number): string {
  // ISO 주차 기준으로 주차 범위 계산
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return formatDateRange(weekStart, weekEnd);
}

/**
 * ISO 주차 정보 가져오기
 */
export function getISOWeekInfo(date: Date): {
  year: number;
  week: number;
  weekStart: string;
  weekEnd: string;
} {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    year: d.getFullYear(),
    week,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
  };
}

/**
 * ISO 주차 키 가져오기 (YYYY-WXX 형식)
 */
export function getISOWeekKey(date: Date): string {
  const { year, week } = getISOWeekInfo(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * 컴팩트 날짜/시간 포맷팅 (25.12.19 PM07:06 형식)
 */
export function formatCompactDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = String(hours % 12 || 12).padStart(2, "0");
  
  return `${year}.${month}.${day} ${ampm}${displayHours}:${minutes}`;
}

/**
 * 로컬 날짜 문자열을 ISO 날짜 문자열로 변환 (YYYY-MM-DD)
 */
export function formatLocalDateStr(date: string): string {
  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Date 객체로 파싱 후 포맷팅
  return formatDate(new Date(date));
}
