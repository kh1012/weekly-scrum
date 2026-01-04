export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getMockData,
  getLatestWeekKey,
} from "@/lib/scrumData";
import { getSupabaseOnlyData } from "@/lib/data/supabaseSnapshots";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import { getMenuSettings } from "@/lib/data/menuSettings";
import { getMenuViewCounts } from "@/lib/data/menuUsage";
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

  // 프로필 완성 여부 확인 (서버 컴포넌트에서 추가 보호)
  // 바이패스 모드에서는 체크 스킵
  if (!isDevBypass) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // 프로필이 없으면 온보딩으로 리다이렉트
      if (!profile) {
        redirect("/onboarding/profile");
      }
    }
  }

  // 현재 유저의 workspace role 조회
  const role = await getWorkspaceRole();

  // 메뉴 설정 조회
  let menuSettings: Awaited<ReturnType<typeof getMenuSettings>> = [];
  try {
    menuSettings = await getMenuSettings(DEFAULT_WORKSPACE_ID);
  } catch {
    // 메뉴 설정 로드 실패 시 빈 배열 사용
  }

  // 메뉴 조회수 데이터 가져오기
  let menuViewCounts: Awaited<ReturnType<typeof getMenuViewCounts>> = [];
  try {
    menuViewCounts = await getMenuViewCounts({
      workspaceId: DEFAULT_WORKSPACE_ID,
      weeksLimit: 8,
    });
  } catch {
    // 조회수 데이터 로드 실패 시 빈 배열 사용
  }

  let allData: Record<string, WeeklyScrumData>;
  let weeks: WeekOption[];

  // Supabase 데이터만 사용
  try {
    const result = await getSupabaseOnlyData(DEFAULT_WORKSPACE_ID);
    allData = result.allData;
    weeks = result.weeks;
  } catch {
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
          role={role} 
          workspaceId={DEFAULT_WORKSPACE_ID} 
          menuSettings={menuSettings}
          menuViewCounts={menuViewCounts}
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
        role={role} 
        workspaceId={DEFAULT_WORKSPACE_ID} 
        menuSettings={menuSettings}
        menuViewCounts={menuViewCounts}
      >
        <MainContent>{children}</MainContent>
      </LayoutWrapper>
    </ScrumProvider>
  );
}
