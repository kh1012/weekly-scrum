/**
 * GanttSkeleton 컴포넌트
 * - viewMode 전환 시 표시되는 스켈레톤 UI
 * - 트리 패널과 타임라인 영역을 포함
 */

"use client";

import { TREE_WIDTH } from "./DraftTreePanel";

interface GanttSkeletonProps {
  /** 스켈레톤 타입 */
  type: "detailed" | "summarized";
  /** 컨테이너 높이 (deprecated - inset-0 사용으로 자동 높이) */
  height?: number;
}

export function GanttSkeleton({ type }: GanttSkeletonProps) {
  return (
    <div className="absolute inset-0 flex w-full h-full overflow-hidden bg-white z-50">
      {/* 트리 패널 스켈레톤 */}
      <div
        className="flex-shrink-0 border-r border-gray-200 bg-white"
        style={{ width: TREE_WIDTH }}
      >
        <div className="p-4 space-y-3 animate-pulse">
          {type === "detailed" ? (
            // Detailed 모드: 프로젝트 > 모듈 > 기능 계층 구조
            <>
              {/* 프로젝트 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                {/* 모듈 1-1 */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-28" />
                  </div>
                  {/* 기능 1-1-1 */}
                  <div className="ml-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-28" />
                    </div>
                  </div>
                </div>
                {/* 모듈 1-2 */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                  </div>
                  {/* 기능 1-2-1 */}
                  <div className="ml-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 프로젝트 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-36" />
                </div>
                {/* 모듈 2-1 */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-32" />
                  </div>
                  {/* 기능 2-1-1 */}
                  <div className="ml-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-26" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-28" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Summarized 모드: 프로젝트 > 모듈 만 표시
            <>
              {/* 프로젝트 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                {/* 모듈 1-1 */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-28" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-30" />
                  </div>
                </div>
              </div>

              {/* 프로젝트 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-36" />
                </div>
                {/* 모듈 2-1 */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-3.5 bg-gray-200 rounded w-26" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 타임라인 스켈레톤 */}
      <div className="flex-1 bg-white overflow-hidden">
        <div className="p-4 space-y-3 animate-pulse">
          {type === "detailed" ? (
            // Detailed 모드: 여러 개의 바 형태
            <>
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "20%" }} />
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "15%" }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "25%" }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "18%" }} />
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "22%" }} />
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "30%" }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "20%" }} />
                <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "25%" }} />
              </div>
            </>
          ) : (
            // Summarized 모드: 모듈별 요약 바 형태 (더 넓고 두꺼운 바)
            <>
              <div className="flex items-center gap-4 mt-2">
                <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "45%" }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "38%" }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "52%" }} />
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "42%" }} />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "48%" }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 트리 패널 전용 스켈레톤 (개별 사용 가능)
 */
export function TreePanelSkeleton({ type }: { type: "detailed" | "summarized" }) {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {type === "detailed" ? (
        <>
          {/* Detailed 모드 스켈레톤 (위와 동일) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3.5 bg-gray-200 rounded w-28" />
              </div>
              <div className="ml-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-28" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Summarized 모드 스켈레톤 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3.5 bg-gray-200 rounded w-28" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3.5 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 타임라인 전용 스켈레톤 (개별 사용 가능)
 */
export function TimelineSkeleton({ type }: { type: "detailed" | "summarized" }) {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {type === "detailed" ? (
        <>
          <div className="flex items-center gap-4">
            <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "20%" }} />
            <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "15%" }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "25%" }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "18%" }} />
            <div className="h-10 bg-gray-200 rounded-lg" style={{ width: "22%" }} />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "45%" }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "38%" }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 bg-gray-200 rounded-lg" style={{ width: "52%" }} />
          </div>
        </>
      )}
    </div>
  );
}
