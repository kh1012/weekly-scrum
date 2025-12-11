/**
 * Calendar View 집계 유틸리티
 *
 * Raw Snapshot 데이터를 주 단위/기간 단위로 집계하는 함수들
 */

import type {
  RawSnapshot,
  WeekKey,
  WeekAggregation,
  InitiativeAggregation,
  MemberAggregation,
  ProjectFocusRangeSummary,
  MemberFocusRangeSummary,
  ProjectFocusItem,
  MemberFocusItem,
} from "@/types/calendar";
import type {
  WeeklyScrumDataUnion,
  WeeklyScrumDataV3,
  ScrumItemV2,
  ScrumItem,
} from "@/types/scrum";
import { isV2Data, isV3Data } from "@/types/scrum";

// ========================================
// 유틸리티 함수
// ========================================

/**
 * task 문자열에서 완료율(progress)을 추출
 * - 숫자 + % 패턴 우선
 * - (DONE), (HALF), (TODO) 키워드 기반
 * - 없으면 0 반환
 */
export function parseTaskCompletionRate(taskText: string): number {
  // % 패턴 추출: "작업 내용 (80%)" 또는 "작업 내용 80%"
  const percentMatch = taskText.match(/(\d+)\s*%/);
  if (percentMatch) {
    return Math.min(parseInt(percentMatch[1], 10), 100) / 100;
  }

  // 키워드 기반
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
 * 초기 버전: doneTaskCount 기반
 */
export function computeFocusScore(
  plannedCount: number,
  doneCount: number,
  avgRate: number
): number {
  // 단순하게 doneCount 사용
  // 추후 확장: doneCount * avgRate 또는 가중치 조정
  return doneCount;
}

/**
 * week 문자열에서 weekIndex 추출
 * 예: "W01" -> 1, "W12" -> 12
 */
export function parseWeekIndex(weekStr: string): number {
  const match = weekStr.match(/W?(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * 날짜 범위 문자열에서 시작/종료일 추출
 * 지원 형식:
 * - "2025-12-01 2025-12-05" (공백 구분)
 * - "2025-12-01 ~ 2025-12-07" (~ 구분, YYYY-MM-DD)
 * - "03.10 ~ 03.14" (~ 구분, MM.DD)
 * - "12.01 ~ 12.05" (~ 구분, MM.DD)
 */
export function parseDateRange(
  rangeStr: string,
  year: number
): { weekStart: string; weekEnd: string } {
  // 형식 1: "2025-12-01 2025-12-05" (공백 구분, YYYY-MM-DD 형식)
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

  // 형식 2: ~ 구분
  const tildeParts = rangeStr.split("~").map((s) => s.trim());
  if (tildeParts.length === 2) {
    const formatDate = (dateStr: string) => {
      // YYYY-MM-DD 형식이면 그대로 반환
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      // MM.DD 형식이면 year를 붙여서 YYYY-MM-DD로 변환
      const [month, day] = dateStr.split(".").map((n) => n.padStart(2, "0"));
      return `${year}-${month}-${day}`;
    };
    return {
      weekStart: formatDate(tildeParts[0]),
      weekEnd: formatDate(tildeParts[1]),
    };
  }

  // 파싱 실패 시 기본값
  return { weekStart: `${year}-01-01`, weekEnd: `${year}-01-07` };
}

// ========================================
// WeeklyScrumData -> RawSnapshot 변환
// ========================================

/**
 * 기존 WeeklyScrumDataUnion을 RawSnapshot[]으로 변환
 * v3 (ISO 주차), v2 (월 내 주차), v1 (레거시) 모두 지원
 */
export function convertToRawSnapshots(
  weeklyDataList: WeeklyScrumDataUnion[]
): RawSnapshot[] {
  const snapshots: RawSnapshot[] = [];

  weeklyDataList.forEach((weeklyData) => {
    // v3: ISO 주차 기준
    if (isV3Data(weeklyData)) {
      const v3Data = weeklyData as WeeklyScrumDataV3;
      const weekIndex = parseWeekIndex(v3Data.week);

      v3Data.items.forEach((item: ScrumItemV2, idx) => {
        snapshots.push({
          id: `${v3Data.year}-${weekIndex}-${idx}`,
          year: v3Data.year,
          weekIndex,
          weekStart: v3Data.weekStart,
          weekEnd: v3Data.weekEnd,
          domain: item.domain || "",
          project: item.project || "",
          module: item.module || "",
          feature: item.feature || "",
          memberName: item.name || "",
          pastWeekTasks: item.pastWeek.tasks.map((t) => ({
            title: t.title,
            progress: t.progress,
          })),
          thisWeekTasks: item.thisWeek.tasks,
        });
      });
      return;
    }

    // v2: 월 내 주차 기준
    if (isV2Data(weeklyData)) {
      const weekIndex = parseWeekIndex(weeklyData.week);
      const { weekStart, weekEnd } = parseDateRange(
        weeklyData.range,
        weeklyData.year
      );

      weeklyData.items.forEach((item: ScrumItemV2, idx) => {
        snapshots.push({
          id: `${weeklyData.year}-${weekIndex}-${idx}`,
          year: weeklyData.year,
          weekIndex,
          weekStart,
          weekEnd,
          domain: item.domain || "",
          project: item.project || "",
          module: item.module || "",
          feature: item.feature || "",
          memberName: item.name || "",
          pastWeekTasks: item.pastWeek.tasks.map((t) => ({
            title: t.title,
            progress: t.progress,
          })),
          thisWeekTasks: item.thisWeek.tasks,
        });
      });
      return;
    }

    // v1: 레거시
    const weekIndex = parseWeekIndex(weeklyData.week);
    const { weekStart, weekEnd } = parseDateRange(
      weeklyData.range,
      weeklyData.year
    );

    weeklyData.items.forEach((item: ScrumItem, idx) => {
      const progress = item.progress || [];
      snapshots.push({
        id: `${weeklyData.year}-${weekIndex}-${idx}`,
        year: weeklyData.year,
        weekIndex,
        weekStart,
        weekEnd,
        domain: item.domain || "",
        project: item.project || "",
        module: item.module || "",
        feature: item.topic || "",
        memberName: item.name || "",
        pastWeekTasks: progress.map((p) => ({
          title: p,
          progress: parseTaskCompletionRate(p) * 100,
        })),
        thisWeekTasks: item.next || [],
      });
    });
  });

  return snapshots;
}

// ========================================
// 주 단위 집계
// ========================================

/**
 * 주 단위로 스냅샷 그룹화
 */
function groupByWeek(snapshots: RawSnapshot[]): Map<string, RawSnapshot[]> {
  const weekMap = new Map<string, RawSnapshot[]>();

  snapshots.forEach((snapshot) => {
    const key = `${snapshot.year}-${snapshot.weekIndex}`;
    if (!weekMap.has(key)) {
      weekMap.set(key, []);
    }
    weekMap.get(key)!.push(snapshot);
  });

  return weekMap;
}

/**
 * 주 단위 프로젝트(이니셔티브) 집계
 */
function aggregateInitiatives(
  snapshots: RawSnapshot[]
): InitiativeAggregation[] {
  const initiativeMap = new Map<string, InitiativeAggregation>();

  snapshots.forEach((snapshot) => {
    const name = snapshot.project || "기타";

    if (!initiativeMap.has(name)) {
      initiativeMap.set(name, {
        initiativeName: name,
        domains: new Set(),
        modules: new Set(),
        features: new Set(),
        members: new Set(),
        plannedTaskCount: 0,
        doneTaskCount: 0,
        avgCompletionRate: 0,
        focusScore: 0,
      });
    }

    const agg = initiativeMap.get(name)!;
    if (snapshot.domain) agg.domains.add(snapshot.domain);
    if (snapshot.module) agg.modules.add(snapshot.module);
    if (snapshot.feature) agg.features.add(snapshot.feature);
    if (snapshot.memberName) agg.members.add(snapshot.memberName);

    // task 집계
    snapshot.pastWeekTasks.forEach((task) => {
      agg.plannedTaskCount += 1;
      if (task.progress >= 100) {
        agg.doneTaskCount += 1;
      }
    });
  });

  // avgCompletionRate 및 focusScore 계산
  initiativeMap.forEach((agg) => {
    agg.avgCompletionRate =
      agg.plannedTaskCount > 0 ? agg.doneTaskCount / agg.plannedTaskCount : 0;
    agg.focusScore = computeFocusScore(
      agg.plannedTaskCount,
      agg.doneTaskCount,
      agg.avgCompletionRate
    );
  });

  // focusScore 기준 내림차순 정렬
  return Array.from(initiativeMap.values()).sort(
    (a, b) => b.focusScore - a.focusScore
  );
}

/**
 * 주 단위 멤버 집계
 */
function aggregateMembers(snapshots: RawSnapshot[]): MemberAggregation[] {
  const memberMap = new Map<string, MemberAggregation>();

  snapshots.forEach((snapshot) => {
    const name = snapshot.memberName || "익명";

    if (!memberMap.has(name)) {
      memberMap.set(name, {
        memberName: name,
        initiatives: new Set(),
        domains: new Set(),
        modules: new Set(),
        features: new Set(),
        plannedTaskCount: 0,
        doneTaskCount: 0,
        avgCompletionRate: 0,
        focusScore: 0,
      });
    }

    const agg = memberMap.get(name)!;
    if (snapshot.project) agg.initiatives.add(snapshot.project);
    if (snapshot.domain) agg.domains.add(snapshot.domain);
    if (snapshot.module) agg.modules.add(snapshot.module);
    if (snapshot.feature) agg.features.add(snapshot.feature);

    // task 집계
    snapshot.pastWeekTasks.forEach((task) => {
      agg.plannedTaskCount += 1;
      if (task.progress >= 100) {
        agg.doneTaskCount += 1;
      }
    });
  });

  // avgCompletionRate 및 focusScore 계산
  memberMap.forEach((agg) => {
    agg.avgCompletionRate =
      agg.plannedTaskCount > 0 ? agg.doneTaskCount / agg.plannedTaskCount : 0;
    agg.focusScore = computeFocusScore(
      agg.plannedTaskCount,
      agg.doneTaskCount,
      agg.avgCompletionRate
    );
  });

  // focusScore 기준 내림차순 정렬
  return Array.from(memberMap.values()).sort(
    (a, b) => b.focusScore - a.focusScore
  );
}

/**
 * 주 단위 집계 생성
 */
export function aggregateByWeek(snapshots: RawSnapshot[]): WeekAggregation[] {
  const weekMap = groupByWeek(snapshots);
  const aggregations: WeekAggregation[] = [];

  weekMap.forEach((weekSnapshots, key) => {
    const [year, weekIndex] = key.split("-").map(Number);
    const firstSnapshot = weekSnapshots[0];

    const initiatives = aggregateInitiatives(weekSnapshots);
    const members = aggregateMembers(weekSnapshots);

    aggregations.push({
      key: { year, weekIndex },
      weekStart: firstSnapshot.weekStart,
      weekEnd: firstSnapshot.weekEnd,
      initiatives,
      members,
      totalInitiativeFocus: initiatives.reduce(
        (sum, i) => sum + i.focusScore,
        0
      ),
      totalMemberFocus: members.reduce((sum, m) => sum + m.focusScore, 0),
    });
  });

  // 주차 순서대로 정렬
  return aggregations.sort((a, b) => {
    if (a.key.year !== b.key.year) return a.key.year - b.key.year;
    return a.key.weekIndex - b.key.weekIndex;
  });
}

// ========================================
// 기간(월/범위) 집계
// ========================================

/**
 * 선택된 월에 해당하는 주 필터링
 * selectedMonth: "YYYY-MM" 형태
 */
export function filterByMonth(
  weeks: WeekAggregation[],
  selectedMonth: string
): WeekAggregation[] {
  const [year, month] = selectedMonth.split("-").map(Number);

  return weeks.filter((week) => {
    // weekStart 또는 weekEnd가 해당 월에 포함되는지 확인
    const startDate = new Date(week.weekStart);
    const endDate = new Date(week.weekEnd);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    return (
      (startDate >= monthStart && startDate <= monthEnd) ||
      (endDate >= monthStart && endDate <= monthEnd) ||
      (startDate <= monthStart && endDate >= monthEnd)
    );
  });
}

/**
 * 프로젝트별 기간 요약 생성
 */
export function createProjectFocusRangeSummary(
  weeks: WeekAggregation[]
): ProjectFocusRangeSummary {
  if (weeks.length === 0) {
    return {
      mode: "project",
      rangeStart: "",
      rangeEnd: "",
      weekCount: 0,
      initiatives: [],
      totalInitiativeCount: 0,
      totalModuleCount: 0,
      totalFeatureCount: 0,
      totalMemberCount: 0,
      totalDoneTaskCount: 0,
      totalPlannedTaskCount: 0,
    };
  }

  const initiativeMap = new Map<string, ProjectFocusItem>();
  const allModules = new Set<string>();
  const allFeatures = new Set<string>();
  const allMembers = new Set<string>();

  weeks.forEach((week) => {
    week.initiatives.forEach((initiative) => {
      const name = initiative.initiativeName;

      if (!initiativeMap.has(name)) {
        initiativeMap.set(name, {
          initiativeName: name,
          weekCount: 0,
          doneTaskCount: 0,
          plannedTaskCount: 0,
          modules: new Set(),
          features: new Set(),
          members: new Set(),
          focusScore: 0,
          avgCompletionRate: 0,
        });
      }

      const item = initiativeMap.get(name)!;
      item.weekCount += 1;
      item.doneTaskCount += initiative.doneTaskCount;
      item.plannedTaskCount += initiative.plannedTaskCount;
      initiative.modules.forEach((m) => {
        item.modules.add(m);
        allModules.add(m);
      });
      initiative.features.forEach((f) => {
        item.features.add(f);
        allFeatures.add(f);
      });
      initiative.members.forEach((m) => {
        item.members.add(m);
        allMembers.add(m);
      });
      item.focusScore += initiative.focusScore;
    });
  });

  // avgCompletionRate 계산
  initiativeMap.forEach((item) => {
    item.avgCompletionRate =
      item.plannedTaskCount > 0
        ? item.doneTaskCount / item.plannedTaskCount
        : 0;
  });

  const initiatives = Array.from(initiativeMap.values()).sort(
    (a, b) => b.focusScore - a.focusScore
  );

  let totalDone = 0;
  let totalPlanned = 0;
  initiatives.forEach((i) => {
    totalDone += i.doneTaskCount;
    totalPlanned += i.plannedTaskCount;
  });

  return {
    mode: "project",
    rangeStart: weeks[0].weekStart,
    rangeEnd: weeks[weeks.length - 1].weekEnd,
    weekCount: weeks.length,
    initiatives,
    totalInitiativeCount: initiatives.length,
    totalModuleCount: allModules.size,
    totalFeatureCount: allFeatures.size,
    totalMemberCount: allMembers.size,
    totalDoneTaskCount: totalDone,
    totalPlannedTaskCount: totalPlanned,
  };
}

/**
 * 멤버별 기간 요약 생성
 */
export function createMemberFocusRangeSummary(
  weeks: WeekAggregation[]
): MemberFocusRangeSummary {
  if (weeks.length === 0) {
    return {
      mode: "member",
      rangeStart: "",
      rangeEnd: "",
      weekCount: 0,
      members: [],
      totalMemberCount: 0,
      totalInitiativeCount: 0,
      totalModuleCount: 0,
      totalFeatureCount: 0,
      totalDoneTaskCount: 0,
      totalPlannedTaskCount: 0,
    };
  }

  const memberMap = new Map<string, MemberFocusItem>();
  const allInitiatives = new Set<string>();
  const allModules = new Set<string>();
  const allFeatures = new Set<string>();

  weeks.forEach((week) => {
    week.members.forEach((member) => {
      const name = member.memberName;

      if (!memberMap.has(name)) {
        memberMap.set(name, {
          memberName: name,
          weekCount: 0,
          initiatives: new Set(),
          modules: new Set(),
          features: new Set(),
          doneTaskCount: 0,
          plannedTaskCount: 0,
          focusScore: 0,
          avgCompletionRate: 0,
        });
      }

      const item = memberMap.get(name)!;
      item.weekCount += 1;
      item.doneTaskCount += member.doneTaskCount;
      item.plannedTaskCount += member.plannedTaskCount;
      member.initiatives.forEach((i) => {
        item.initiatives.add(i);
        allInitiatives.add(i);
      });
      member.modules.forEach((m) => {
        item.modules.add(m);
        allModules.add(m);
      });
      member.features.forEach((f) => {
        item.features.add(f);
        allFeatures.add(f);
      });
      item.focusScore += member.focusScore;
    });
  });

  // avgCompletionRate 계산
  memberMap.forEach((item) => {
    item.avgCompletionRate =
      item.plannedTaskCount > 0
        ? item.doneTaskCount / item.plannedTaskCount
        : 0;
  });

  const members = Array.from(memberMap.values()).sort(
    (a, b) => b.focusScore - a.focusScore
  );

  let totalDone = 0;
  let totalPlanned = 0;
  members.forEach((m) => {
    totalDone += m.doneTaskCount;
    totalPlanned += m.plannedTaskCount;
  });

  return {
    mode: "member",
    rangeStart: weeks[0].weekStart,
    rangeEnd: weeks[weeks.length - 1].weekEnd,
    weekCount: weeks.length,
    members,
    totalMemberCount: members.length,
    totalInitiativeCount: allInitiatives.size,
    totalModuleCount: allModules.size,
    totalFeatureCount: allFeatures.size,
    totalDoneTaskCount: totalDone,
    totalPlannedTaskCount: totalPlanned,
  };
}

// ========================================
// 메인 집계 함수
// ========================================

/**
 * 전체 집계 함수
 * rawSnapshots를 입력받아 주 단위 집계 및 기간 요약 반환
 */
export function aggregateCalendarData(
  rawSnapshots: RawSnapshot[],
  selectedMonth: string // "all" 또는 "YYYY-MM" 형식
): {
  weeks: WeekAggregation[];
  projectRangeSummary: ProjectFocusRangeSummary;
  memberRangeSummary: MemberFocusRangeSummary;
} {
  // 1. 주 단위 집계
  const allWeeks = aggregateByWeek(rawSnapshots);

  // 2. 선택 월 필터링 ("all"이면 전체)
  const filteredWeeks =
    selectedMonth === "all" ? allWeeks : filterByMonth(allWeeks, selectedMonth);

  // 3. 기간 요약 생성
  const projectRangeSummary = createProjectFocusRangeSummary(filteredWeeks);
  const memberRangeSummary = createMemberFocusRangeSummary(filteredWeeks);

  return {
    weeks: filteredWeeks,
    projectRangeSummary,
    memberRangeSummary,
  };
}

// ========================================
// 헬퍼 함수
// ========================================

/**
 * 현재 월 문자열 반환
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * 이전 월 문자열 반환
 */
export function getPrevMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-").map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

/**
 * 다음 월 문자열 반환
 */
export function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-").map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * 월 문자열을 표시용 레이블로 변환
 */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${year}년 ${m}월`;
}

/**
 * 주차 레이블 생성
 */
export function formatWeekLabel(week: WeekAggregation): string {
  const startParts = week.weekStart.split("-");
  const endParts = week.weekEnd.split("-");
  const startStr = `${startParts[1]}.${startParts[2]}`;
  const endStr = `${endParts[1]}.${endParts[2]}`;
  return `W${String(week.key.weekIndex).padStart(
    2,
    "0"
  )} · ${startStr} ~ ${endStr}`;
}

/**
 * RawSnapshot 목록에서 사용 가능한 월 목록 추출
 * @returns { value: string, label: string }[] - value: "YYYY-MM", label: "YYYY년 M월"
 */
export function getAvailableMonths(
  snapshots: RawSnapshot[]
): { value: string; label: string }[] {
  const monthSet = new Set<string>();

  snapshots.forEach((snapshot) => {
    // weekStart에서 월 추출
    const [year, month] = snapshot.weekStart.split("-");
    monthSet.add(`${year}-${month}`);
    // weekEnd에서도 월 추출 (주가 월 경계를 넘는 경우)
    const [endYear, endMonth] = snapshot.weekEnd.split("-");
    monthSet.add(`${endYear}-${endMonth}`);
  });

  // 정렬 (최신순)
  const sortedMonths = Array.from(monthSet).sort().reverse();

  return sortedMonths.map((m) => ({
    value: m,
    label: formatMonthLabel(m),
  }));
}
