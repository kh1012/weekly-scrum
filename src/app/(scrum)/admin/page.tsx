import { createClient } from "@/lib/supabase/server";
import { AdminDashboardView } from "./_components/AdminDashboardView";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * ISO 주차 계산 헬퍼
 */
function getISOWeekInfo(date: Date) {
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  const weekDiff = date.getTime() - firstMonday.getTime();
  const currentWeek = Math.ceil(weekDiff / (7 * 24 * 60 * 60 * 1000));
  return { year: date.getFullYear(), week: currentWeek };
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

  // 최근 4주차 정보
  const recentWeeks = getRecentWeeks(4);
  const currentWeek = recentWeeks[0];

  // 워크스페이스 멤버 조회 (프로필 정보 포함)
  const { data: members } = await supabase
    .from("workspace_members")
    .select(`
      user_id,
      role,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .order("role");

  // 스냅샷 조회 (최근 4주치)
  const weekLabels = recentWeeks.map((w) => w.label);
  const years = [...new Set(recentWeeks.map((w) => w.year))];

  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("id, author_id, year, week")
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
  }

  const memberDataList: MemberData[] = (members || []).map((m) => {
    // profiles는 single row여도 배열로 반환될 수 있음
    const profilesData = m.profiles as { display_name: string; email: string } | { display_name: string; email: string }[] | null;
    const profile = Array.isArray(profilesData) ? profilesData[0] : profilesData;

    const weeklyEntries: Record<string, number> = {};

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
    });

    return {
      userId: m.user_id,
      displayName: profile?.display_name || profile?.email?.split("@")[0] || "Unknown",
      email: profile?.email || "",
      role: m.role,
      weeklyEntries,
    };
  });

  // 전체 통계
  const totalMembers = members?.length || 0;
  const totalSnapshots = snapshots?.length || 0;
  const totalEntries = entries?.length || 0;

  // 이번 주 작성 완료자 수
  const currentWeekKey = `${currentWeek.year}-${currentWeek.label}`;
  const completedThisWeek = memberDataList.filter(
    (m) => (m.weeklyEntries[currentWeekKey] || 0) > 0
  ).length;

  return (
    <AdminDashboardView
      stats={{
        totalMembers,
        totalSnapshots,
        totalEntries,
        completedThisWeek,
      }}
      recentWeeks={recentWeeks}
      memberDataList={memberDataList}
      currentWeekKey={currentWeekKey}
    />
  );
}
