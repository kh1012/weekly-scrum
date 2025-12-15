"use client";

/**
 * 스냅샷 관리 메인 뷰
 * 
 * - 좌측/상단: 연도 + ISO 주차 선택 UI
 * - 중앙: 스냅샷 목록 (Pinterest/리스트 토글)
 * - 우측: 주차 메타데이터 요약 (접힘/더보기)
 * - 우측 상단: 주차별 편집하기 / 새로 작성하기 버튼
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WeekSelector } from "./WeekSelector";
import { SnapshotList } from "./SnapshotList";
import { WeekMetaPanel } from "./WeekMetaPanel";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import {
  getCurrentISOWeek,
  getWeekStartDateString,
  formatWeekRange,
} from "@/lib/date/isoWeek";

interface SnapshotsMainViewProps {
  userId: string;
  workspaceId: string;
}

export interface SnapshotSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  entriesCount: number;
  entries: {
    project: string;
    module: string | null;
    feature: string | null;
  }[];
}

export interface WeekStatsData {
  projectCount: number;
  moduleCount: number;
  featureCount: number;
  avgProgress: number | null;
  domainDistribution: Record<string, number>;
  totalEntries: number;
}

export function SnapshotsMainView({ userId, workspaceId }: SnapshotsMainViewProps) {
  const router = useRouter();
  const currentWeek = getCurrentISOWeek();
  
  // 주차 선택 상태
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);
  
  // 뷰 모드
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // 스냅샷 목록
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 메타데이터
  const [weekStats, setWeekStats] = useState<WeekStatsData | null>(null);
  const [isMetaPanelExpanded, setIsMetaPanelExpanded] = useState(false);

  // 스냅샷 목록 조회
  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    navigationProgress.start(); // 프로그레스바 시작
    try {
      const weekStartDate = getWeekStartDateString(selectedYear, selectedWeek);
      const response = await fetch(
        `/api/manage/snapshots?workspaceId=${workspaceId}&userId=${userId}&weekStartDate=${weekStartDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
        setWeekStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch snapshots:", error);
    } finally {
      setIsLoading(false);
      navigationProgress.done(); // 프로그레스바 완료
    }
  }, [selectedYear, selectedWeek, workspaceId, userId]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // 주차별 편집하기
  const handleEditWeek = () => {
    navigationProgress.start();
    router.push(`/manage/snapshots/${selectedYear}/${selectedWeek}/edit`);
  };

  // 새로 작성하기
  const handleNewSnapshot = () => {
    navigationProgress.start();
    router.push(`/manage/snapshots/${selectedYear}/${selectedWeek}/new`);
  };

  const weekRange = formatWeekRange(selectedYear, selectedWeek);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col border border-gray-200 rounded-3xl overflow-hidden shadow-sm bg-white">
      {/* 헤더 영역 */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* 좌측: 주차 선택 */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">스냅샷 관리</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                주차별 스냅샷 조회 및 관리
              </p>
            </div>
            
            <div className="h-8 w-px bg-gray-200" />
            
            <WeekSelector
              year={selectedYear}
              week={selectedWeek}
              onYearChange={setSelectedYear}
              onWeekChange={setSelectedWeek}
            />
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">{weekRange}</span>
            </div>
          </div>

          {/* 우측: 액션 버튼 */}
          <div className="flex items-center gap-3">
            {/* 뷰 모드 토글 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="그리드 보기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="리스트 보기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={handleEditWeek}
              disabled={snapshots.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              주차별 편집하기
            </button>

            <button
              onClick={handleNewSnapshot}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새로 작성하기
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* 스냅샷 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          <SnapshotList
            snapshots={snapshots}
            isLoading={isLoading}
            viewMode={viewMode}
            onRefresh={fetchSnapshots}
          />
        </div>

        {/* 우측 메타데이터 패널 */}
        <WeekMetaPanel
          stats={weekStats}
          isExpanded={isMetaPanelExpanded}
          onToggle={() => setIsMetaPanelExpanded(!isMetaPanelExpanded)}
          snapshotCount={snapshots.length}
        />
      </div>
    </div>
  );
}

