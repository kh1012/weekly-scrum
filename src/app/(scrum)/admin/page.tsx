import { createClient } from "@/lib/supabase/server";
import { AdminDashboardView } from "./_components/AdminDashboardView";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * ISO 주차 계산 헬퍼 (ISO 8601 표준)
 * - 주는 월요일부터 시작
 * - 1월 4일이 포함된 주가 1주차
 * - 연도는 해당 주의 목요일이 속한 연도
 */
function getISOWeekInfo(date: Date) {
  // 복사본으로 작업
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // ISO 8601: 목요일이 속한 연도가 해당 주의 연도
  // 해당 주의 목요일 날짜 구하기
  const dayOfWeek = target.getUTCDay();
  const nearestThursday = new Date(target.getTime());
  nearestThursday.setUTCDate(target.getUTCDate() + 4 - (dayOfWeek || 7));
  
  // 목요일이 속한 연도
  const yearOfThursday = nearestThursday.getUTCFullYear();
  
  // 그 연도의 1월 4일 (항상 W01에 포함)
  const jan4 = new Date(Date.UTC(yearOfThursday, 0, 4));
  
  // 1월 4일이 포함된 주의 월요일
  const jan4DayOfWeek = jan4.getUTCDay();
  const firstMonday = new Date(jan4.getTime());
  firstMonday.setUTCDate(jan4.getUTCDate() - (jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1));
  
  // 주차 계산
  const weekNumber = Math.floor((nearestThursday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  return { 
    year: yearOfThursday, 
    week: weekNumber 
  };
}

/**
 * 최근 N주차 정보 가져오기
 */
function getRecentWeeks(count: number): { year: number; week: number; label: string }[] {
  const weeks: { year: number; week: number; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const targetDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const { year, week } = getISOWeekInfo(targetDate);
    weeks.push({
      year,
      week,
      label: `W${week.toString().padStart(2, "0")}`,
    });
  }

  return weeks;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 최근 6주차 정보
  const recentWeeks = getRecentWeeks(6);
  const currentWeek = recentWeeks[0]; // 이번 주 (실제로는 표시 안 함)
  const lastWeek = recentWeeks[1]; // 지난 주 (메인으로 표시)

  // 1. 워크스페이스 멤버 조회
  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .order("role");

  // 2. profiles 별도 조회
  const userIds = members?.map((m) => m.user_id) || [];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds)
    : { data: [] };

  // profiles를 user_id로 맵핑
  const profilesMap = new Map(
    (profiles || []).map((p) => [p.user_id, { display_name: p.display_name, email: p.email }])
  );

  // 스냅샷 조회 (최근 6주치)
  const weekLabels = recentWeeks.map((w) => w.label);
  const years = [...new Set(recentWeeks.map((w) => w.year))];

  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("id, author_id, year, week, workload_level, workload_note")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .in("year", years)
    .in("week", weekLabels);

  // 스냅샷별 엔트리 수 조회
  const snapshotIds = snapshots?.map((s) => s.id) || [];
  const { data: entries } = snapshotIds.length > 0
    ? await supabase
        .from("snapshot_entries")
        .select("snapshot_id")
        .in("snapshot_id", snapshotIds)
    : { data: [] };

  // 스냅샷별 엔트리 수 맵핑
  const entryCountBySnapshot = new Map<string, number>();
  entries?.forEach((e) => {
    const count = entryCountBySnapshot.get(e.snapshot_id) || 0;
    entryCountBySnapshot.set(e.snapshot_id, count + 1);
  });

  // 멤버별, 주차별 엔트리 수 매트릭스 생성
  interface MemberData {
    userId: string;
    displayName: string;
    email: string;
    role: string;
    weeklyEntries: Record<string, number>; // "2024-W01" -> entry count
    weeklyWorkload: Record<string, { level: string | null; note: string | null }>; // "2024-W01" -> workload info
  }

  const memberDataList: MemberData[] = (members || []).map((m) => {
    // profiles 맵에서 조회
    const profile = profilesMap.get(m.user_id);

    const weeklyEntries: Record<string, number> = {};
    const weeklyWorkload: Record<string, { level: string | null; note: string | null }> = {};

    recentWeeks.forEach((w) => {
      const weekKey = `${w.year}-${w.label}`;

      // 해당 멤버의 해당 주차 스냅샷 찾기
      const memberSnapshots = snapshots?.filter(
        (s) => s.author_id === m.user_id && s.year === w.year && s.week === w.label
      ) || [];

      // 엔트리 수 합산
      let totalEntries = 0;
      memberSnapshots.forEach((s) => {
        totalEntries += entryCountBySnapshot.get(s.id) || 0;
      });

      weeklyEntries[weekKey] = totalEntries;

      // workload 정보 (가장 최근 스냅샷 기준)
      const latestSnapshot = memberSnapshots[0]; // snapshots는 updated_at desc 순서가 아니므로 첫 번째 값 사용
      weeklyWorkload[weekKey] = {
        level: latestSnapshot?.workload_level || null,
        note: latestSnapshot?.workload_note || null,
      };
    });

    return {
      userId: m.user_id,
      displayName: profile?.display_name || profile?.email?.split("@")[0] || "Unknown",
      email: profile?.email || "",
      role: m.role,
      weeklyEntries,
      weeklyWorkload,
    };
  });

  // 전체 통계
  const totalMembers = members?.length || 0;
  const totalSnapshots = snapshots?.length || 0;
  const totalEntries = entries?.length || 0;

  // 지난 주 작성 완료자 수
  const lastWeekKey = `${lastWeek.year}-${lastWeek.label}`;
  const completedLastWeek = memberDataList.filter(
    (m) => (m.weeklyEntries[lastWeekKey] || 0) > 0
  ).length;

  // 지난 주 부담 수준 통계
  const workloadStats = {
    light: 0,
    normal: 0,
    burden: 0,
  };
  
  memberDataList.forEach((m) => {
    const workload = m.weeklyWorkload[lastWeekKey];
    if (workload?.level === 'light') workloadStats.light++;
    else if (workload?.level === 'normal') workloadStats.normal++;
    else if (workload?.level === 'burden') workloadStats.burden++;
  });

  return (
    <AdminDashboardView
      stats={{
        totalMembers,
        totalSnapshots,
        totalEntries,
        completedLastWeek,
        workloadLight: workloadStats.light,
        workloadNormal: workloadStats.normal,
        workloadBurden: workloadStats.burden,
      }}
      recentWeeks={recentWeeks}
      memberDataList={memberDataList}
      lastWeekKey={lastWeekKey}
    />
  );
}
