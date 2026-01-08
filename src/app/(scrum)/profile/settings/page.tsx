/**
 * 사용자 설정 페이지
 * - 연동 관리 (Figma, Notion, Slack 등)
 * - 개인 설정
 */

import { Suspense } from "react";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "설정 | Weekly Scrum",
  description: "사용자 설정 및 연동 관리",
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}

