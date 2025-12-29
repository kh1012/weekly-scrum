import { redirect } from "next/navigation";
import { getWorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import { getMenuSettings } from "@/lib/data/menuSettings";
import { MenuSettingsManager } from "./_components/MenuSettingsManager";

export const metadata = {
  title: "Menu Settings - Weekly Scrum",
  description: "SNB 메뉴 설정 관리",
};

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

export default async function MenuSettingsPage() {
  const role = await getWorkspaceRole();

  if (!role) {
    redirect("/onboarding/profile");
  }

  // Admin/Manager만 접근 가능
  if (role !== "admin" && role !== "manager") {
    redirect("/");
  }

  const settings = await getMenuSettings(DEFAULT_WORKSPACE_ID);

  return (
    <MenuSettingsManager
      workspaceId={DEFAULT_WORKSPACE_ID}
      initialSettings={settings}
    />
  );
}

