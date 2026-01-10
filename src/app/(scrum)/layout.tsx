export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getMockData, getLatestWeekKey } from "@/lib/scrumData";
import { getSupabaseOnlyData } from "@/lib/data/snapshots";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import { getMenuSettings } from "@/lib/data/menu";
import { getMenuViewCounts } from "@/lib/data/menu";
import { getMenuStats } from "@/lib/data/menu";
import { getMenuNewCounts } from "@/lib/data/menu";
import { ScrumProvider } from "@/context/ScrumContext";
import { LayoutWrapper, MainContent } from "@/components/weekly-scrum/common";
import type { WeekOption, WeeklyScrumData } from "@/types/scrum";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

// 기본 workspace ID
const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

export default async function ScrumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 개발용 바이패스 체크
  const cookieStore = await cookies();
  const isDevBypass = cookieStore.get("dev-bypass")?.value === "true";

  // Supabase 클라이언트 및 사용자 정보 (한 번만 조회)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  // 프로필 완성 여부 확인 (바이패스 모드에서는 스킵)
  if (!isDevBypass && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      redirect("/onboarding/profile");
    }
  }

  // 독립적인 쿼리들을 병렬로 실행
  const [
    role,
    menuSettingsResult,
    menuViewCountsResult,
    menuStatsResult,
    menuNewCountsResult,
    supabaseDataResult,
  ] = await Promise.allSettled([
    getWorkspaceRole(),
    getMenuSettings(DEFAULT_WORKSPACE_ID),
    getMenuViewCounts({
      workspaceId: DEFAULT_WORKSPACE_ID,
      weeksLimit: 8,
    }),
    getMenuStats({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId,
    }),
    userId
      ? getMenuNewCounts({
          workspaceId: DEFAULT_WORKSPACE_ID,
          userId,
        })
      : Promise.resolve([]),
    getSupabaseOnlyData(DEFAULT_WORKSPACE_ID),
  ]);

  // 결과 추출 (에러 처리 포함)
  const roleValue = role.status === "fulfilled" ? role.value : null;
  const menuSettings =
    menuSettingsResult.status === "fulfilled" ? menuSettingsResult.value : [];
  const menuViewCounts =
    menuViewCountsResult.status === "fulfilled"
      ? menuViewCountsResult.value
      : [];
  const menuStats =
    menuStatsResult.status === "fulfilled"
      ? menuStatsResult.value
      : {
          feedbacks_count: 0,
          snapshots_count: 0,
          total_entries_count: 0,
          plans_count: 0,
          features_count: 0,
          collaborations_count: 0,
          my_entries_count: 0,
          alignment_count: 0,
          workspace_alignment_count: 0,
        };
  const menuNewCounts =
    menuNewCountsResult.status === "fulfilled"
      ? menuNewCountsResult.value
      : [];

  let allData: Record<string, WeeklyScrumData>;
  let weeks: WeekOption[];

  if (
    supabaseDataResult.status === "fulfilled" &&
    Object.keys(supabaseDataResult.value.allData).length > 0
  ) {
    allData = supabaseDataResult.value.allData;
    weeks = supabaseDataResult.value.weeks;
  } else {
    allData = {};
    weeks = [];
  }

  // 데이터가 없으면 Mock 데이터 사용
  if (Object.keys(allData).length === 0) {
    const mockData = getMockData();
    const mockKey = `${mockData.year}-${mockData.week}`;
    const mockWeeks: WeekOption[] = [
      {
        year: mockData.year,
        week: mockData.week,
        weekStart: mockData.range.split(" ~ ")[0],
        weekEnd: mockData.range.split(" ~ ")[1],
        key: mockKey,
        label: `${mockData.year}년 ${mockData.week}`,
        filePath: "",
      },
    ];

    return (
      <ScrumProvider
        allData={{ [mockKey]: mockData }}
        weeks={mockWeeks}
        initialWeekKey={mockKey}
      >
        <LayoutWrapper
          role={roleValue}
          workspaceId={DEFAULT_WORKSPACE_ID}
          userId={userId}
          menuSettings={menuSettings}
          menuViewCounts={menuViewCounts}
          menuStats={menuStats}
          menuNewCounts={menuNewCounts}
        >
          <MainContent>{children}</MainContent>
        </LayoutWrapper>
      </ScrumProvider>
    );
  }

  const initialWeekKey = getLatestWeekKey(weeks);

  return (
    <ScrumProvider
      allData={allData}
      weeks={weeks}
      initialWeekKey={initialWeekKey}
    >
      <LayoutWrapper
        role={roleValue}
        workspaceId={DEFAULT_WORKSPACE_ID}
        userId={userId}
        menuSettings={menuSettings}
        menuViewCounts={menuViewCounts}
        menuStats={menuStats}
        menuNewCounts={menuNewCounts}
      >
        <MainContent>{children}</MainContent>
      </LayoutWrapper>
    </ScrumProvider>
  );
}
