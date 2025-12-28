"use client";

import Link from "next/link";
import type { SnapshotEntryListItem } from "@/lib/data/entries";

interface EntryCardProps {
  entry: SnapshotEntryListItem;
}

/**
 * 간단한 상대시간 표시 함수
 */
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "방금 전";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(months / 12);
  return `${years}년 전`;
}

/**
 * 개별 엔트리 카드 (GitHub 스타일)
 */
export function EntryCard({ entry }: EntryCardProps) {
  const timeAgo = getTimeAgo(entry.created_at);

  return (
    <div className="group p-4 bg-white border border-[#d0d7de] rounded-md hover:border-[#0969da] hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Entry info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Status badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                entry.status === "completed"
                  ? "bg-[#dafbe1] text-[#1f883d]"
                  : entry.status === "in_progress"
                  ? "bg-[#ddf4ff] text-[#0969da]"
                  : "bg-[#f6f8fa] text-[#57606a]"
              }`}
            >
              {entry.status === "completed"
                ? "✓ 완료"
                : entry.status === "in_progress"
                ? "⏳ 진행중"
                : "📝 계획"}
            </span>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {entry.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]"
                  >
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="text-xs text-[#57606a]">
                    +{entry.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Entry name */}
          <Link
            href={`/manage/snapshots/${entry.snapshot_id}`}
            className="block font-medium text-[#24292f] hover:text-[#0969da] hover:underline truncate group-hover:text-[#0969da] transition-colors"
          >
            {entry.name}
          </Link>

          {/* Description */}
          {entry.description && (
            <p className="mt-1 text-sm text-[#57606a] line-clamp-2">
              {entry.description}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-2 flex items-center gap-3 text-xs text-[#57606a]">
            {/* Author */}
            {entry.author_name && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.25a5.001 5.001 0 0 1 4.995 4.75H3.005A5.001 5.001 0 0 1 8 9.25Z" />
                </svg>
                {entry.author_name}
              </span>
            )}

            {/* Time */}
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
              </svg>
              {timeAgo}
            </span>

            {/* Collaborators */}
            {entry.collaborators && entry.collaborators.length > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Z" />
                </svg>
                {entry.collaborators.length}명 협업
              </span>
            )}
          </div>
        </div>

        {/* Right: Link to snapshot */}
        <Link
          href={`/manage/snapshots/${entry.snapshot_id}`}
          className="shrink-0 p-2 text-[#57606a] hover:text-[#0969da] hover:bg-[#f6f8fa] rounded-md transition-colors"
          title="스냅샷 보기"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1Z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

