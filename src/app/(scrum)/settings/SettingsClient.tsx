"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";

export function SettingsClient() {
  const [isFigmaConnected, setIsFigmaConnected] = useState(false);
  const [figmaConnectedAt, setFigmaConnectedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    checkFigmaConnection();
  }, []);

  async function checkFigmaConnection() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("figma_encrypted_tokens, figma_connected_at")
        .eq("id", user.id)
        .single();

      setIsFigmaConnected(!!data?.figma_encrypted_tokens);
      setFigmaConnectedAt(data?.figma_connected_at || null);
    } catch (error) {
      console.error("[Figma Connection Check]", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFigmaConnect() {
    window.location.href = "/api/figma/auth";
  }

  async function handleFigmaDisconnect() {
    if (!confirm("Figma 연동을 해제하시겠습니까?")) return;

    setIsDisconnecting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("users")
        .update({
          figma_encrypted_tokens: null,
          figma_user_id: null,
          figma_connected_at: null,
        })
        .eq("id", user.id);

      setIsFigmaConnected(false);
      setFigmaConnectedAt(null);
      alert("Figma 연동이 해제되었습니다.");
    } catch (error) {
      console.error("[Figma Disconnect]", error);
      alert("연동 해제에 실패했습니다.");
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fa]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 헤더 - 컴팩트 */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#0969da] hover:underline mb-3"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            돌아가기
          </Link>
          <h1 className="text-xl font-semibold text-[#24292f]">설정</h1>
          <p className="text-xs text-[#57606a] mt-1">
            연동 관리 및 개인 설정
          </p>
        </div>

        {/* 연동 관리 섹션 - 컴팩트 */}
        <div className="bg-white border border-[#d0d7de] rounded-md">
          <div className="px-4 py-3 border-b border-[#d0d7de]">
            <h2 className="text-sm font-semibold text-[#24292f]">연동 관리</h2>
            <p className="text-xs text-[#57606a] mt-0.5">
              외부 서비스 연동
            </p>
          </div>

          <div className="divide-y divide-[#d0d7de]">
            {/* Figma 연동 - 컴팩트 */}
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Figma 아이콘 - 작게 */}
                  <div className="w-8 h-8 rounded bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 38 57"
                    >
                      <path d="M19 28.5C19 23.26 23.26 19 28.5 19C33.74 19 38 23.26 38 28.5C38 33.74 33.74 38 28.5 38C23.26 38 19 33.74 19 28.5Z" />
                      <path d="M0 47.5C0 42.26 4.26 38 9.5 38H19V47.5C19 52.74 14.74 57 9.5 57C4.26 57 0 52.74 0 47.5Z" />
                      <path d="M19 0V19H28.5C33.74 19 38 14.74 38 9.5C38 4.26 33.74 0 28.5 0H19Z" />
                      <path d="M0 9.5C0 14.74 4.26 19 9.5 19H19V0H9.5C4.26 0 0 4.26 0 9.5Z" />
                      <path d="M0 28.5C0 33.74 4.26 38 9.5 38H19V19H9.5C4.26 19 0 23.26 0 28.5Z" />
                    </svg>
                  </div>

                  {/* 정보 - 컴팩트 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#24292f]">
                        Figma
                      </h3>
                      {isLoading ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f6f8fa] text-[#57606a]">
                          확인 중
                        </span>
                      ) : isFigmaConnected ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#dafbe1] text-[#1a7f37] border border-[#1a7f37]/20">
                          연동됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]">
                          미연동
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#57606a] leading-relaxed">
                      Gantt 차트를 Figma/FigJam으로 업로드
                    </p>
                    {isFigmaConnected && figmaConnectedAt && (
                      <p className="text-[10px] text-[#57606a] mt-1">
                        {new Date(figmaConnectedAt).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 - 작게 */}
                <div className="flex-shrink-0">
                  {isLoading ? (
                    <button
                      disabled
                      className="px-3 py-1.5 text-xs font-medium rounded border border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] cursor-not-allowed"
                    >
                      확인 중
                    </button>
                  ) : isFigmaConnected ? (
                    <button
                      onClick={handleFigmaDisconnect}
                      disabled={isDisconnecting}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-[#d0d7de] text-[#cf222e] hover:bg-[#ffebe9] hover:border-[#cf222e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDisconnecting ? "해제 중" : "연동 해제"}
                    </button>
                  ) : (
                    <button
                      onClick={handleFigmaConnect}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-[#0969da] text-white hover:bg-[#0860ca] transition-colors"
                    >
                      연동하기
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 추후 추가될 연동 서비스 - 컴팩트 */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-[#57606a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#57606a]">
                    추가 연동 서비스
                  </h3>
                  <p className="text-xs text-[#57606a]">
                    Notion, Slack 등 추가 예정
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

