"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";

type SettingsTab = "integrations" | "notifications" | "preferences";

export function SettingsClient() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>("integrations");
  const [isFigmaConnected, setIsFigmaConnected] = useState(false);
  const [figmaConnectedAt, setFigmaConnectedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    checkFigmaConnection();

    // URL 파라미터 확인하여 성공/실패 메시지 표시
    const figmaSuccess = searchParams.get("figma_success");
    const figmaError = searchParams.get("figma_error");

    if (figmaSuccess === "true") {
      // URL 파라미터 제거 (깨끗한 URL 유지)
      window.history.replaceState({}, "", "/profile/settings");
    } else if (figmaError) {
      alert(`Figma 연동 실패: ${figmaError}`);
      window.history.replaceState({}, "", "/profile/settings");
    }
  }, [searchParams]);

  async function checkFigmaConnection() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("figma_encrypted_tokens, figma_connected_at")
        .eq("user_id", user.id)
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
        .from("profiles")
        .update({
          figma_encrypted_tokens: null,
          figma_user_id: null,
          figma_connected_at: null,
        })
        .eq("user_id", user.id);

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

  const menuItems = [
    { id: "integrations" as SettingsTab, label: "연동", icon: "link" },
    // { id: "notifications" as SettingsTab, label: "알림", icon: "bell", disabled: true },
    // { id: "preferences" as SettingsTab, label: "환경설정", icon: "settings", disabled: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#24292f]">설정</h1>
          <p className="text-sm text-[#57606a] mt-0.5">
            개인 설정 및 연동 관리
          </p>
        </div>

        {/* 레이아웃: 좌측 SNB + 우측 콘텐츠 */}
        <div className="flex gap-6">
          {/* 좌측 SNB */}
          <aside className="w-56 flex-shrink-0 border-r border-[#d0d7de] pr-6">
            <nav className="space-y-0.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? "bg-[#f6f8fa] text-[#24292f]"
                      : "text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#24292f]"
                  }`}
                >
                  {item.icon === "link" && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  )}
                  {item.icon === "bell" && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  )}
                  {item.icon === "settings" && (
                    <svg
                      className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* 우측 콘텐츠 */}
          <main className="flex-1 max-w-3xl">
            {activeTab === "integrations" && (
              <div>
                {/* 연동 관리 섹션 */}
        <div className="bg-white border border-[#d0d7de] rounded-md">
                  <div className="px-4 py-2.5 border-b border-[#d0d7de]">
            <h2 className="text-sm font-semibold text-[#24292f]">연동 관리</h2>
            <p className="text-xs text-[#57606a] mt-0.5">
              외부 서비스 연동
            </p>
          </div>

          <div className="divide-y divide-[#d0d7de]">
                    {/* Figma 연동 */}
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {/* Figma 아이콘 */}
                          <div className="w-9 h-9 rounded bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center flex-shrink-0">
                    <svg
                              className="w-5 h-5"
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

                          {/* 정보 */}
                  <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-semibold text-[#24292f]">
                        Figma
                      </h3>
                      {isLoading ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f6f8fa] text-[#57606a]">
                          확인 중
                        </span>
                      ) : isFigmaConnected ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#dafbe1] text-[#1a7f37] border border-[#1a7f37]/20">
                          연동됨
                        </span>
                      ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]">
                          미연동
                        </span>
                      )}
                    </div>
                            <p className="text-xs text-[#57606a]">
                      Weekly Scrum 사이트와 Figma 계정을 연동하여 Figma REST API 기반의 확장 기능을 활성화합니다.
                    </p>
                    {isFigmaConnected && figmaConnectedAt && (
                              <p className="text-xs text-[#57606a] mt-1">
                                연동일시: {new Date(figmaConnectedAt).toLocaleString("ko-KR", {
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

                        {/* 액션 버튼 */}
                <div className="flex-shrink-0">
                  {isLoading ? (
                    <button
                      disabled
                              className="px-3 py-1.5 text-sm font-medium rounded border border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] cursor-not-allowed"
                    >
                      확인 중
                    </button>
                  ) : isFigmaConnected ? (
                    <button
                      onClick={handleFigmaDisconnect}
                      disabled={isDisconnecting}
                              className="px-3 py-1.5 text-sm font-medium rounded border border-[#d0d7de] text-[#cf222e] hover:bg-[#ffebe9] hover:border-[#cf222e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDisconnecting ? "해제 중" : "연동 해제"}
                    </button>
                  ) : (
                    <button
                      onClick={handleFigmaConnect}
                              className="px-3 py-1.5 text-sm font-medium rounded bg-[#0969da] text-white hover:bg-[#0860ca] transition-colors"
                    >
                      연동하기
                    </button>
                  )}
                </div>
              </div>
            </div>

                    {/* 추후 추가될 연동 서비스 */}
            <div className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center flex-shrink-0">
                  <svg
                            className="w-5 h-5 text-[#57606a]"
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
                          <p className="text-xs text-[#57606a] mt-0.5">
                    Notion, Slack 등 추가 예정
                  </p>
                </div>
              </div>
            </div>
          </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
