/**
 * Alignment View
 * 
 * Personal Space > Alignment
 * Plans를 기준 축으로, Snapshots를 주차별 오버레이로 표시하는 읽기 전용 비교 뷰
 */

"use client";

import { useState, useEffect } from "react";
import { getCurrentISOWeek } from "@/lib/date/isoWeek";
import { WeekSelector } from "./WeekSelector";
import { AlignmentContent } from "./AlignmentContent";

interface AlignmentViewProps {
  workspaceId: string;
  userId: string;
  userName?: string;
}

export function AlignmentView({ workspaceId, userId, userName }: AlignmentViewProps) {
  const currentWeek = getCurrentISOWeek();
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 pb-6 border-b border-[#d0d7de]">
          <h1 className="text-2xl font-semibold text-[#24292f] mb-2">
            Alignment
          </h1>
          <p className="text-sm text-[#57606a]">
            팀의 계획(Plans)을 기준으로, 특정 주차에 내가 기록한 Snapshot을 겹쳐서 봅니다.
          </p>
          
          {/* Week Selector */}
          <div className="mt-4">
            <WeekSelector
              selectedYear={selectedYear}
              selectedWeek={selectedWeek}
              onWeekChange={(year, week) => {
                setSelectedYear(year);
                setSelectedWeek(week);
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <AlignmentContent
          workspaceId={workspaceId}
          userId={userId}
          year={selectedYear}
          week={selectedWeek}
        />
      </div>
    </div>
  );
}

