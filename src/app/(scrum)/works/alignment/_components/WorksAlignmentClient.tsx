"use client";

import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

interface WorksAlignmentClientProps {
  workspaceId: string;
}

/**
 * Works Alignment Client Component
 * 
 * Workspace-wide alignment view
 * - 모든 Plans + 모든 사용자의 Snapshot Entries
 * - 개인별 연결 화살표 표시
 * - 읽기 전용
 */
export function WorksAlignmentClient({
  workspaceId,
}: WorksAlignmentClientProps) {
  // TODO: Implement workspace-wide data fetch
  // For now, show loading state
  return (
    <div className="h-full flex items-center justify-center">
      <LogoLoadingSpinner
        title="Workspace Alignment 준비 중입니다"
        description="곧 제공될 예정입니다."
      />
    </div>
  );
}

