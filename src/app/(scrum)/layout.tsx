import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getMockData,
  getLatestWeekKey,
} from "@/lib/scrumData";
import { getSupabaseOnlyData } from "@/lib/data/supabaseSnapshots";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import { ScrumProvider } from "@/context/ScrumContext";
import { LayoutWrapper, MainContent } from "@/components/weekly-scrum/common";
import type { WeekOption, WeeklyScrumData } from "@/types/scrum";

// 기본 workspace ID
const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

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
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      // 프로필이 없으면 온보딩으로 리다이렉트
      if (!profile) {
        redirect("/onboarding/profile");
      }
    }
  }

  // 현재 유저의 workspace role 조회
  const role = await getWorkspaceRole();

  let allData: Record<string, WeeklyScrumData>;
  let weeks: WeekOption[];

  // Supabase 데이터만 사용
  try {
    const result = await getSupabaseOnlyData(DEFAULT_WORKSPACE_ID);
    allData = result.allData;
    weeks = result.weeks;
    console.log(`[ScrumLayout] Loaded ${Object.keys(allData).length} weeks from Supabase`);
  } catch (error) {
    console.error("[ScrumLayout] Failed to fetch from Supabase:", error);
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
        <LayoutWrapper role={role}>
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
      <LayoutWrapper role={role}>
        <MainContent>{children}</MainContent>
      </LayoutWrapper>
    </ScrumProvider>
  );
}
