"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { setActiveWorkspaceId } from "@/lib/supabase/mode";
import { getCurrentUserClient } from "@/lib/auth/auth-helpers";
import { Logo } from "@/components/weekly-scrum/common";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

interface Workspace {
  id: string;
  name: string;
}

export default function SelectWorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const user = await getCurrentUserClient();
      if (!user) {
        router.push("/login");
        return;
      }

      const supabase = createClient();

      // 사용자가 속한 workspace 조회
      const { data, error: fetchError } = await supabase
        .from("workspace_members")
        .select(
          `
          workspace_id,
          workspaces (
            id,
            name
          )
        `
        )
        .eq("user_id", user.id);

      if (fetchError) {
        throw fetchError;
      }

      // workspaces 데이터 추출
      const workspaceList = (data || [])
        .map((item: any) => item.workspaces)
        .filter(Boolean) as Workspace[];

      setWorkspaces(workspaceList);

      // 1개만 있으면 자동 선택
      if (workspaceList.length === 1) {
        handleSelectWorkspace(workspaceList[0].id);
      } else if (workspaceList.length === 0) {
        setError("소속된 워크스페이스가 없습니다. 관리자에게 문의하세요.");
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
      setError("워크스페이스를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    router.push("/");
  };

  if (isLoading) {
    return (
      <LogoLoadingSpinner
        title="워크스페이스 로딩 중..."
        description="잠시만 기다려주세요."
        className="min-h-screen bg-gray-50"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <Logo size={56} className="mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-gray-900">
                워크스페이스 선택
              </h1>
            </div>

            <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>

            <button
              onClick={() => router.push("/login")}
              className="mt-6 w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <Logo size={56} className="mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">
              워크스페이스 선택
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              작업할 워크스페이스를 선택하세요
            </p>
          </div>

          {/* Workspace List */}
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace.id)}
                className="w-full p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-rose-600">
                      {workspace.name}
                    </h3>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-rose-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © 2026 Weekly Scrum
        </p>
      </div>
    </div>
  );
}
