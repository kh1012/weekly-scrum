"use client";

/**
 * Admin Snapshots View
 * 
 * 관리자 전용 스냅샷 목록 뷰
 * - Summary Bar로 현재 조건 표시
 * - 다중 선택 + 일괄 삭제
 * - 편집 링크
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SummaryBar } from "@/components/SummaryBar";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { deleteSnapshotsBulkAction } from "../_actions";
import type { AdminSnapshotListItem } from "@/lib/data/adminSnapshots";
import type { GnbParams } from "@/lib/ui/gnbParams";

interface AdminSnapshotsViewProps {
  snapshots: AdminSnapshotListItem[];
  error?: string;
  gnbParams: GnbParams;
  workspaceId: string;
}

export function AdminSnapshotsView({
  snapshots,
  error,
  gnbParams,
  workspaceId,
}: AdminSnapshotsViewProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === snapshots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(snapshots.map((s) => s.id)));
    }
  }, [selectedIds.size, snapshots]);

  // 개별 선택
  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 선택 삭제
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(
      `선택한 ${selectedIds.size}개의 스냅샷을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteSnapshotsBulkAction({
        snapshotIds: Array.from(selectedIds),
        workspaceId,
      });

      if (result.success) {
        setSelectedIds(new Set());
        navigationProgress.start();
        router.refresh();
      } else {
        setDeleteError(result.error || "삭제 실패");
      }
    } catch (err) {
      setDeleteError("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, workspaceId, router]);

  // 필터 초기화
  const handleReset = useCallback(() => {
    navigationProgress.start();
    router.push("/admin/snapshots");
  }, [router]);

  const isAllSelected = snapshots.length > 0 && selectedIds.size === snapshots.length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            onClick={() => navigationProgress.start()}
            className="p-2 rounded-md transition-colors hover:bg-[#f6f8fa] text-[#57606a]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-2xl">📋</span>
          <div>
            <h1 className="text-xl font-semibold text-[#24292f]">
              All Snapshots
            </h1>
            <p className="text-sm mt-1 text-[#57606a]">
              워크스페이스 전체 스냅샷 ({snapshots.length}개)
            </p>
          </div>
        </div>

        {/* 선택 삭제 버튼 */}
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#d73a49] hover:bg-[#b03139] disabled:opacity-60 rounded-md transition-colors"
          >
            {isDeleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {selectedIds.size}개 삭제
          </button>
        )}
      </div>

      {/* Summary Bar */}
      <SummaryBar
        params={gnbParams}
        totalCount={snapshots.length}
        onReset={handleReset}
      />

      {/* 에러 표시 */}
      {(error || deleteError) && (
        <div className="p-4 rounded-md text-sm border border-[#d73a49] bg-[#ffebe9] text-[#d73a49]">
          <p className="font-medium">{deleteError ? "삭제 실패" : "데이터 조회 실패"}</p>
          <p className="mt-1 opacity-90">{deleteError || error}</p>
        </div>
      )}

      {/* 스냅샷 목록 */}
      {snapshots.length > 0 ? (
        <div className="space-y-2">
          {/* 전체 선택 헤더 */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#f6f8fa] rounded-md">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 text-[#0969da] border-[#d0d7de] rounded focus:ring-[#0969da]"
            />
            <span className="text-sm text-[#57606a]">
              {selectedIds.size > 0
                ? `${selectedIds.size}개 선택됨`
                : "전체 선택"}
            </span>
          </div>

          {/* 스냅샷 리스트 */}
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className={`flex items-center gap-4 p-4 rounded-md transition-all duration-200 ${
                selectedIds.has(snapshot.id)
                  ? "bg-[#ddf4ff] border border-[#54aeff]"
                  : "bg-white border border-[#d0d7de] hover:border-[#0969da]"
              }`}
            >
              {/* 체크박스 */}
              <input
                type="checkbox"
                checked={selectedIds.has(snapshot.id)}
                onChange={() => handleSelect(snapshot.id)}
                className="w-4 h-4 text-[#0969da] border-[#d0d7de] rounded focus:ring-[#0969da] shrink-0"
              />

              {/* 주차 배지 */}
              <div className="w-12 h-12 rounded-md flex items-center justify-center text-sm font-semibold shrink-0 bg-[#ddf4ff] text-[#0969da]">
                {snapshot.week}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#24292f]">
                    {snapshot.year}년 {snapshot.week}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6f8fa] text-[#57606a]">
                    {snapshot.week_start_date} ~ {snapshot.week_end_date}
                  </span>
                  {snapshot.entriesCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#dafbe1] text-[#1a7f37]">
                      {snapshot.entriesCount}개 엔트리
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#57606a] mt-1">
                  작성자: {snapshot.authorName || snapshot.created_by?.slice(0, 8) || "알 수 없음"}
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/snapshots/${snapshot.id}`}
                  onClick={() => navigationProgress.start()}
                  className="p-2 text-[#57606a] hover:text-[#24292f] hover:bg-[#f6f8fa] rounded-md transition-colors"
                  title="상세 보기"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                <Link
                  href={`/admin/snapshots/${snapshot.id}/edit`}
                  onClick={() => navigationProgress.start()}
                  className="p-2 text-[#57606a] hover:text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors"
                  title="편집"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="text-center py-16 bg-[#f6f8fa] rounded-md">
            <span className="text-4xl">📋</span>
            <p className="mt-4 text-lg font-medium text-[#24292f]">스냅샷이 없습니다</p>
            <p className="mt-2 text-sm text-[#57606a]">
              조건을 변경하거나 새 스냅샷을 생성해 주세요.
            </p>
          </div>
        )
      )}
    </div>
  );
}





















