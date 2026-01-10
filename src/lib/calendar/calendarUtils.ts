/**
 * task 문자열에서 완료율(progress)을 추출
 */
export function parseTaskCompletionRate(taskText: string): number {
  const percentMatch = taskText.match(/(\d+)\s*%/);
  if (percentMatch) {
    return Math.min(parseInt(percentMatch[1], 10), 100) / 100;
  }

  const upperText = taskText.toUpperCase();
  if (
    upperText.includes("(DONE)") ||
    upperText.includes("[DONE]") ||
    upperText.includes("완료")
  ) {
    return 1.0;
  }
  if (
    upperText.includes("(HALF)") ||
    upperText.includes("[HALF]") ||
    upperText.includes("진행중")
  ) {
    return 0.5;
  }
  if (
    upperText.includes("(TODO)") ||
    upperText.includes("[TODO]") ||
    upperText.includes("예정")
  ) {
    return 0.0;
  }

  return 0;
}

/**
 * focusScore 계산
 */
export function computeFocusScore(
  plannedCount: number,
  doneCount: number,
  avgRate: number
): number {
  return doneCount;
}

/**
 * week 문자열에서 weekIndex 추출
 */
export function parseWeekIndex(weekStr: string): number {
  const match = weekStr.match(/W?(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * 날짜 범위 문자열에서 시작/종료일 추출
 */
export function parseDateRange(
  rangeStr: string,
  year: number
): { weekStart: string; weekEnd: string } {
  const spaceParts = rangeStr.split(/\s+/).filter(Boolean);
  if (
    spaceParts.length === 2 &&
    spaceParts[0].includes("-") &&
    spaceParts[1].includes("-")
  ) {
    return {
      weekStart: spaceParts[0],
      weekEnd: spaceParts[1],
    };
  }

  const tildeParts = rangeStr.split("~").map((s) => s.trim());
  if (tildeParts.length === 2) {
    const formatDate = (dateStr: string) => {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      const [month, day] = dateStr.split(".").map((n) => n.padStart(2, "0"));
      return `${year}-${month}-${day}`;
    };
    return {
      weekStart: formatDate(tildeParts[0]),
      weekEnd: formatDate(tildeParts[1]),
    };
  }

  return { weekStart: `${year}-01-01`, weekEnd: `${year}-01-07` };
}
