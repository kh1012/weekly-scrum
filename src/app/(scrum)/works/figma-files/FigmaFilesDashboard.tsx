/**
 * Figma Files 대시보드 (Client Component)
 * - 파일 목록 표시
 * - 썸네일, 읽지 않은 댓글, 마지막 활동 표시
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { AddFileModal } from "./components/AddFileModal";

interface FileData {
  id: string;
  file_key: string;
  file_name: string;
  file_url: string;
  thumbnail_url: string | null;
  total_comments: number;
  unread_count: number;
  last_comment_preview: string | null;
  last_activity: string;
}

interface Overview {
  total_files: number;
  unread_comments: number;
  last_activity: string | null;
}

interface Props {
  workspaceId: string;
  userId: string;
}

export function FigmaFilesDashboard({ workspaceId, userId }: Props) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isFigmaConnected, setIsFigmaConnected] = useState<boolean | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/figma/files?workspace_id=${workspaceId}`);
      const data = await res.json();

      if (res.ok) {
        setFiles(data.files || []);
        setOverview(data.overview || null);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    checkFigmaConnection();
  }, [workspaceId]);

  async function checkFigmaConnection() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("figma_encrypted_tokens")
        .eq("user_id", user.id)
        .single();

      setIsFigmaConnected(!!data?.figma_encrypted_tokens);
    } catch (error) {
      console.error("Failed to check Figma connection:", error);
      setIsFigmaConnected(false);
    }
  }

  async function handleDeleteFile(fileId: string, e: React.MouseEvent) {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation();

    if (!confirm("이 파일을 삭제하시겠습니까?")) return;

    setDeletingFileId(fileId);
    try {
      const res = await fetch(`/api/figma/files?file_id=${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete file");
      }

      // 목록 새로고침
      await fetchFiles();
      alert("파일이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("파일 삭제에 실패했습니다.");
    } finally {
      setDeletingFileId(null);
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  if (loading) {
    return (
      <LogoLoadingSpinner
        title="Figma 파일을 불러오는 중입니다"
        description="잠시만 기다려주세요."
        className="min-h-[400px]"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Figma 미연동 사용자용 히어로 배너 */}
      {isFigmaConnected === false && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 38 57">
                <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                <path d="M0 47.5C0 42.26 4.26 38 9.5 38H19V47.5C19 52.74 14.74 57 9.5 57C4.26 57 0 52.74 0 47.5Z" />
                <path d="M19 0V19H28.5C33.74 19 38 14.74 38 9.5C38 4.26 33.74 0 28.5 0H19Z" />
                <path d="M0 9.5C0 14.74 4.26 19 9.5 19H19V0H9.5C4.26 0 0 4.26 0 9.5Z" />
                <path d="M0 28.5C0 33.74 4.26 38 9.5 38H19V19H9.5C4.26 19 0 23.26 0 28.5Z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-[#24292f] mb-0.5">Figma 연동이 필요합니다</h3>
                <p className="text-xs text-[#57606a]">
                  Figma를 연동하면 파일에 댓글을 달고 팀원들과 실시간으로 소통할 수 있습니다
                </p>
              </div>
            </div>
            <Link
              href="/profile/settings"
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
            >
              연동하기 →
            </Link>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold text-[#24292f]">Figma Files</h1>
        {isFigmaConnected && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1.5 text-sm font-medium text-white bg-[#24292f] rounded-md hover:bg-[#57606a] transition-colors"
          >
            + Add File
          </button>
        )}
      </div>

      {/* Overview */}
      {overview && (
        <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-3 mb-3">
          <div className="flex items-center gap-4 text-xs text-[#57606a]">
            <span>📁 {overview.total_files}개 파일</span>
            {overview.unread_comments > 0 && (
              <span className="text-[#0969da] font-semibold">
                ● {overview.unread_comments}개 읽지 않음
              </span>
            )}
            {overview.last_activity && (
              <span>{formatRelativeTime(overview.last_activity)}</span>
            )}
          </div>
        </div>
      )}

      {/* 파일 목록 */}
      {files.length === 0 ? (
        <div className="text-center py-8 border border-[#d0d7de] rounded-md">
          <p className="text-sm text-[#57606a] mb-3">
            추적 중인 Figma 파일이 없습니다.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-[#24292f] rounded-md hover:bg-[#57606a] transition-colors"
          >
            첫 파일 추가하기
          </button>
        </div>
      ) : (
        <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
          {files.map((file, index) => (
            <div
              key={file.id}
              className={`${index !== 0 ? "border-t border-[#d0d7de]" : ""}`}
            >
              <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#f6f8fa] transition-colors group">
                {/* 좌측: 읽지 않음 표시 + 썸네일 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 읽지 않음 표시 */}
                  <div className="w-1 h-8">
                    {file.unread_count > 0 && (
                      <div className="w-1 h-full bg-blue-500 rounded-full" />
                    )}
                  </div>

                  {/* 썸네일 */}
                  <Link href={`/works/figma-files/${file.file_key}`} className="block flex-shrink-0">
                    <div className="w-10 h-10 bg-[#f6f8fa] border border-[#d0d7de] rounded overflow-hidden">
                      {file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#57606a]">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 38 57">
                            <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* 중앙: 파일 정보 */}
                <div className="flex-1 min-w-0">
                  <Link href={`/works/figma-files/${file.file_key}`} className="block">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-medium text-[#24292f] group-hover:text-blue-600 truncate">
                        {file.file_name}
                      </h3>
                      {file.unread_count > 0 && (
                        <span className="text-xs font-semibold text-blue-600 flex-shrink-0">
                          {file.unread_count}개 새 댓글
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#57606a]">
                      <span className="flex items-center gap-0.5">
                        💬 {file.total_comments}
                      </span>
                      <span>·</span>
                      <span>{formatRelativeTime(file.last_activity)}</span>
                      {file.last_comment_preview && (
                        <>
                          <span>·</span>
                          <span className="truncate italic">
                            "{file.last_comment_preview}"
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                </div>

                {/* 우측: 액션 버튼 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[#57606a] hover:text-[#24292f] hover:bg-[#f6f8fa] rounded transition-colors"
                    title="Figma에서 열기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    disabled={deletingFileId === file.id}
                    className="p-1.5 text-[#57606a] hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="파일 삭제"
                  >
                    {deletingFileId === file.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 파일 추가 모달 */}
      {showAddModal && (
        <AddFileModal
          workspaceId={workspaceId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchFiles();
          }}
        />
      )}
    </div>
  );
}

