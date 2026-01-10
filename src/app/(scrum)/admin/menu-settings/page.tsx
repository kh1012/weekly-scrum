import { redirect } from "next/navigation";
import { getWorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import { getMenuSettings, type MenuSetting } from "@/lib/data/menu";
import { MenuSettingsManager } from "./_components/MenuSettingsManager";

export const metadata = {
  title: "Menu Settings - Weekly Scrum",
  description: "SNB 메뉴 설정 관리",
};
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

export default async function MenuSettingsPage() {
  const role = await getWorkspaceRole();

  if (!role) {
    redirect("/onboarding/profile");
  }

  // Admin/Manager만 접근 가능
  if (role !== "admin" && role !== "manager") {
    redirect("/");
  }

  let settings: MenuSetting[] = [];
  try {
    settings = await getMenuSettings(DEFAULT_WORKSPACE_ID);
  } catch (error) {
    console.error("[MenuSettingsPage] Error fetching menu settings:", error);
    // 에러가 발생해도 빈 배열로 초기화하여 UI는 표시되도록 함
  }

  return (
    <MenuSettingsManager
      workspaceId={DEFAULT_WORKSPACE_ID}
      initialSettings={settings}
    />
  );
}

