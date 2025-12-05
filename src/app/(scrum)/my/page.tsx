"use client";

import { Suspense } from "react";
import { MyDashboardView } from "@/components/weekly-scrum/my/MyDashboardView";

export default function MyPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-[#656d76]">로딩 중...</div>}>
      <MyDashboardView />
    </Suspense>
  );
}

