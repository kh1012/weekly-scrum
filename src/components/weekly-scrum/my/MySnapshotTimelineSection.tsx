/**
 * My Snapshot Timeline Section (서버 컴포넌트)
 * 
 * Personal Dashboard에서 사용할 타임라인 섹션
 * - 데이터 fetching (서버 사이드)
 * - 클라이언트 컴포넌트로 전달
 */

import { getMySnapshotEntries } from "@/lib/data/snapshots";
import { MySnapshotTimelineClient } from "./MySnapshotTimelineClient";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { Suspense } from "react";

interface MySnapshotTimelineSectionProps {
  workspaceId: string;
  userId: string;
  /** 주차 범위 (8/12/16) - 기본 12주 */
  weeksRange?: 8 | 12 | 16;
}

/**
 * 현재 주차 기준으로 from/to 계산
 */
function calculateWeekRange(weeksRange: number = 12): { fromWeek: string; toWeek: string } {
  const now = new Date();
  
  // ISO 주차 계산
  const getISOWeek = (date: Date) => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const jan4 = new Date(target.getFullYear(), 0, 4);
    const dayDiff = (target.getTime() - jan4.getTime()) / 86400000;
    const weekNr = 1 + Math.ceil(dayDiff / 7);
    return { year: target.getFullYear(), week: weekNr };
  };

  const currentWeek = getISOWeek(now);
  
  // 이전 주차들 계산 (weeksRange만큼)
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - weeksRange * 7);
  const fromWeek = getISOWeek(fromDate);

  const formatWeek = (year: number, week: number) =>
    `${year}-W${week.toString().padStart(2, "0")}`;

  return {
    fromWeek: formatWeek(fromWeek.year, fromWeek.week),
    toWeek: formatWeek(currentWeek.year, currentWeek.week),
  };
}

async function TimelineContent({ workspaceId, userId, weeksRange = 12 }: MySnapshotTimelineSectionProps) {
  const { fromWeek, toWeek } = calculateWeekRange(weeksRange);

  const entries = await getMySnapshotEntries({
    workspaceId,
    userId,
    fromWeek,
    toWeek,
  });

  return (
    <MySnapshotTimelineClient
      entries={entries}
      workspaceId={workspaceId}
      userId={userId}
    />
  );
}

export function MySnapshotTimelineSection(props: MySnapshotTimelineSectionProps) {
  return (
    <div className="w-full border-t-2 border-[#d0d7de] bg-[#f6f8fa] py-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mb-6">
        <h2 className="text-lg font-semibold text-[#24292f] mb-1">
          나의 스냅샷 타임라인
        </h2>
        <p className="text-sm text-[#57606a]">
          주차별 스냅샷 엔트리를 Gantt 형태로 시각화하고 연속성을 확인하세요
        </p>
      </div>

      <Suspense
        fallback={
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
              <div className="bg-white border border-[#d0d7de] rounded-md p-12">
                <LogoLoadingSpinner />
              </div>
            </div>
          </div>
        }
      >
        <TimelineContent {...props} />
      </Suspense>
    </div>
  );
}

