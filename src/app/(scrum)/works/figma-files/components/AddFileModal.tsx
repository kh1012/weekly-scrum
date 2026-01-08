/**
 * Figma 파일 추가 모달
 * - Figma 파일 URL 입력
 * - 파일 등록 + Webhook 구독
 */

"use client";

import { useState } from "react";

interface Props {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFileModal({ workspaceId, onClose, onSuccess }: Props) {
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fileUrl.trim()) {
      setError("Figma 파일 URL을 입력해주세요.");
      return;
    }

    if (!fileUrl.includes("figma.com")) {
      setError("올바른 Figma URL이 아닙니다.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/figma/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, workspaceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[Add File Modal] Error:", data);

        // 에러 타입에 따른 상세 안내
        if (data.errorType === "ACCESS_DENIED") {
          const suggestions = data.suggestions?.join("\n• ") || "";
          throw new Error(`${data.error}\n\n해결 방법:\n• ${suggestions}`);
        }

        if (data.errorType === "NOT_FOUND") {
          throw new Error("파일을 찾을 수 없습니다.\nURL을 다시 확인해주세요.");
        }

        throw new Error(data.error || "파일 등록에 실패했습니다.");
      }

      // 성공 시 권한 안내
      if (data.has_comment_access === false) {
        alert(
          "✅ 파일이 추가되었습니다!\n\n⚠️ 읽기 전용 파일입니다.\n댓글 기능은 사용할 수 없습니다."
        );
      }

      onSuccess();
    } catch (err) {
      console.error("[Add File Modal] Catch error:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-xl max-w-lg w-full border border-[#d0d7de]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d0d7de]">
            <h2 className="text-base font-semibold text-[#24292f]">
              Figma 파일 추가
            </h2>
            <button
              onClick={onClose}
              className="text-[#57606a] hover:text-[#24292f]"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-3">
            <div className="mb-3">
              <label className="block text-xs font-medium text-[#24292f] mb-1.5">
                Figma 파일 URL
              </label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]"
                disabled={loading}
              />
              <p className="text-xs text-[#57606a] mt-1.5">
                Figma 파일의 URL을 입력하세요. 댓글이 실시간으로 동기화됩니다.
              </p>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-800 whitespace-pre-line">
                  {error}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 text-sm font-medium text-[#24292f] bg-white border border-[#d0d7de] rounded-md hover:bg-[#f6f8fa] transition-colors"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-2.5 py-1.5 text-sm font-medium text-white bg-[#24292f] rounded-md hover:bg-[#57606a] disabled:opacity-50 transition-colors"
                disabled={loading}
              >
                {loading ? "등록 중..." : "추가"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
