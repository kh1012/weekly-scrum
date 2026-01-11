import { createClient } from "@/lib/supabase/server";
import { AdminDashboardView } from "./_components/AdminDashboardView";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

/**
 * Admin Dashboard에서 제외할 사용자 이메일 목록
 * 테스트 계정이나 시스템 계정 등을 제외
 * 필요에 따라 이메일을 추가하여 통계에서 제외할 수 있습니다.
 */
const EXCLUDED_EMAILS = [
  "zrelor@gmail.com", // 개발자 계정
  "hsy0410@midasit.com",
  // 테스트 계정 추가 시 여기에 이메일 추가
  // "test@midasit.com",
];

/**
 * ISO 주차 계산 헬퍼 (ISO 8601 표준)
 * - 주는 월요일부터 시작
 * - 1월 4일이 포함된 주가 1주차
 * - 연도는 해당 주의 목요일이 속한 연도
 */
function getISOWeekInfo(date: Date) {
  // 복사본으로 작업
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

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
  firstMonday.setUTCDate(
    jan4.getUTCDate() - (jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1)
  );

  // 주차 계산
  const weekNumber =
    Math.floor(
      (nearestThursday.getTime() - firstMonday.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    ) + 1;

  return {
    year: yearOfThursday,
    week: weekNumber,
  };
}

/**
 * 최근 N주차 정보 가져오기
 */
function getRecentWeeks(
  count: number
): { year: number; week: number; label: string }[] {
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
  const workspaceId = getDefaultWorkspaceId();

  // 최근 6주차 정보
  const recentWeeks = getRecentWeeks(6);
  const currentWeek = recentWeeks[0]; // 이번 주 (실제로는 표시 안 함)
  const lastWeek = recentWeeks[1]; // 지난 주 (메인으로 표시)

  // 스냅샷 조회 파라미터 준비
  const weekLabels = recentWeeks.map((w) => w.label);
  const years = [...new Set(recentWeeks.map((w) => w.year))];

  // 1. 모든 독립적인 쿼리를 병렬로 실행
  const [
    membersResult,
    snapshotsResult,
    { count: totalSnapshotsCount },
    { count: totalEntriesCount },
  ] = await Promise.all([
    // workspace_members와 profiles를 JOIN으로 한 번에 조회
    supabase
      .from("workspace_members")
      .select(
        `
        user_id,
        role,
        profiles!inner(
          display_name,
          email
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("role"),
    // snapshots 조회 (최근 6주치)
    supabase
      .from("snapshots")
      .select("id, author_id, year, week, workload_level, workload_note")
      .eq("workspace_id", workspaceId)
      .in("year", years)
      .in("week", weekLabels),
    // 전체 스냅샷 통계
    supabase
      .from("snapshots")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    // 전체 엔트리 통계
    supabase
      .from("snapshot_entries")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
  ]);

  const members = membersResult.data;
  const snapshots = snapshotsResult.data;

  // profiles를 user_id로 맵핑 (JOIN된 데이터 구조 사용)
  const profilesMap = new Map(
    (members || []).map((m: any) => [
      m.user_id,
      {
        display_name: m.profiles?.display_name,
        email: m.profiles?.email,
      },
    ])
  );

  // 스냅샷별 엔트리 수 조회 (병렬 쿼리 후 별도 실행)
  const snapshotIds = snapshots?.map((s) => s.id) || [];
  const { data: entries } =
    snapshotIds.length > 0
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
    weeklyWorkload: Record<
      string,
      { level: string | null; note: string | null }
    >; // "2024-W01" -> workload info
  }

  const memberDataList: MemberData[] = (members || [])
    .map((m) => {
      // profiles 맵에서 조회
      const profile = profilesMap.get(m.user_id);

      const weeklyEntries: Record<string, number> = {};
      const weeklyWorkload: Record<
        string,
        { level: string | null; note: string | null }
      > = {};

      recentWeeks.forEach((w) => {
        const weekKey = `${w.year}-${w.label}`;

        // 해당 멤버의 해당 주차 스냅샷 찾기
        const memberSnapshots =
          snapshots?.filter(
            (s) =>
              s.author_id === m.user_id &&
              s.year === w.year &&
              s.week === w.label
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
        displayName:
          profile?.display_name || profile?.email?.split("@")[0] || "Unknown",
        email: profile?.email || "",
        role: m.role,
        weeklyEntries,
        weeklyWorkload,
      };
    })
    // 제외할 이메일 필터링
    .filter((member) => !EXCLUDED_EMAILS.includes(member.email.toLowerCase()));

  // 전체 통계
  const totalMembers = members?.length || 0;
  const totalSnapshots = totalSnapshotsCount || 0;
  const totalEntries = totalEntriesCount || 0;

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
    if (workload?.level === "light") workloadStats.light++;
    else if (workload?.level === "normal") workloadStats.normal++;
    else if (workload?.level === "burden") workloadStats.burden++;
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
