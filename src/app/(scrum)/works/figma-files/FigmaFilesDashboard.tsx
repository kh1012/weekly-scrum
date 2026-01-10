/**
 * Figma Files 대시보드 (Client Component)
 * - 깔끔한 게시판 스타일
 * - 로딩 스피너 적용
 * - 카드형 레이아웃
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { InlineSpinner } from "@/components/weekly-scrum/common/InlineSpinner";
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
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
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
    e.preventDefault();
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

      await fetchFiles();
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
        className="min-h-[400px]"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Figma 미연동 배너 */}
      {isFigmaConnected === false && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-12 h-12 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 38 57">
                <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                <path d="M0 47.5C0 42.26 4.26 38 9.5 38H19V47.5C19 52.74 14.74 57 9.5 57C4.26 57 0 52.74 0 47.5Z" />
                <path d="M19 0V19H28.5C33.74 19 38 14.74 38 9.5C38 4.26 33.74 0 28.5 0H19Z" />
                <path d="M0 9.5C0 14.74 4.26 19 9.5 19H19V0H9.5C4.26 0 0 4.26 0 9.5Z" />
                <path d="M0 28.5C0 33.74 4.26 38 9.5 38H19V19H9.5C4.26 19 0 23.26 0 28.5Z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Figma 연동이 필요합니다</h3>
                <p className="text-sm text-slate-600">
                  Figma를 연동하면 파일에 댓글을 달고 팀원들과 실시간으로 소통할 수 있습니다
                </p>
              </div>
            </div>
            <Link
              href="/profile/settings"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
            >
              연동하기
            </Link>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Figma Files</h1>
          {overview && (
            <p className="text-sm text-slate-600 mt-1">
              {overview.total_files}개 파일
              {overview.unread_comments > 0 && (
                <span className="ml-2 text-blue-600 font-semibold">
                  • {overview.unread_comments}개 새 댓글
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="새로고침"
            aria-label="파일 목록 새로고침"
          >
            {refreshing ? (
              <InlineSpinner size={20} />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
          {isFigmaConnected && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              + 파일 추가
            </button>
          )}
        </div>
      </div>

      {/* 파일 목록 */}
      {files.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-600 mb-4">
            추적 중인 Figma 파일이 없습니다.
          </p>
          {isFigmaConnected && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 파일 추가하기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Link
              key={file.id}
              href={`/works/figma-files/${file.file_key}`}
              className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* 썸네일 */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {file.thumbnail_url ? (
                      <img
                        src={file.thumbnail_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 38 57">
                          <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* 파일 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {file.file_name}
                    </h3>
                    {file.unread_count > 0 && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
                        {file.unread_count}개 새 댓글
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {file.total_comments}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(file.last_activity)}</span>
                  </div>

                  {file.last_comment_preview && (
                    <p className="text-sm text-slate-500 italic truncate">
                      "{file.last_comment_preview}"
                    </p>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Figma에서 열기"
                    aria-label="Figma에서 열기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    disabled={deletingFileId === file.id}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="파일 삭제"
                    aria-label="파일 삭제"
                  >
                    {deletingFileId === file.id ? (
                      <InlineSpinner size={16} />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </Link>
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
