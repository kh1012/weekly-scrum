/**
 * Figma 파일 추가 모달
 * - 실시간 URL 검증
 * - 중복 파일 체크
 * - 구조화된 에러 처리
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { InlineSpinner } from "@/components/weekly-scrum/common/InlineSpinner";
import { validateFigmaUrl } from "@/lib/figma/validation";
import { checkDuplicateFile, debounce } from "@/lib/figma/duplicateCheck";

interface Props {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ValidationState = "idle" | "checking" | "valid" | "invalid" | "duplicate";

type ErrorInfo = {
  type: string;
  title: string;
  message: string;
  suggestions: string[];
  retryable?: boolean;
};

type WarningInfo = {
  type: string;
  message: string;
};

export function AddFileModal({ workspaceId, onClose, onSuccess }: Props) {
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [warnings, setWarnings] = useState<WarningInfo[]>([]);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationMessage, setValidationMessage] = useState("");

  // 실시간 URL 검증 (debounced)
  const validateUrl = useCallback(
    debounce(async (url: string) => {
      if (!url.trim()) {
        setValidationState("idle");
        setValidationMessage("");
        return;
      }

      setValidationState("checking");

      const result = validateFigmaUrl(url);
      if (!result.valid) {
        setValidationState("invalid");
        setValidationMessage(result.error || "");
        return;
      }

      // 중복 체크
      if (result.fileKey) {
        const duplicateResult = await checkDuplicateFile(result.fileKey, workspaceId);
        if (duplicateResult.isDuplicate) {
          setValidationState("duplicate");
          setValidationMessage(
            `"${duplicateResult.existingFile?.file_name}" 파일이 이미 등록되어 있습니다`
          );
          return;
        }
      }

      setValidationState("valid");
      setValidationMessage("올바른 Figma URL입니다");
    }, 500),
    [workspaceId]
  );

  useEffect(() => {
    validateUrl(fileUrl);
  }, [fileUrl, validateUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarnings([]);

    // 클라이언트 측 검증
    const result = validateFigmaUrl(fileUrl);
    if (!result.valid) {
      setError({
        type: "CLIENT_VALIDATION",
        title: "입력 오류",
        message: result.error || "",
        suggestions: ["올바른 Figma 파일 URL을 입력해주세요"],
      });
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
        setError({
          type: data.errorType || "SERVER",
          title: getErrorTitle(data.errorType),
          message: data.error || "파일 등록에 실패했습니다",
          suggestions: data.suggestions || [],
          retryable: isRetryable(data.errorType),
        });
        return;
      }

      // 경고 메시지 처리
      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      // 성공
      setTimeout(() => {
        onSuccess();
      }, warnings.length > 0 ? 2000 : 0);
    } catch (err) {
      console.error("[Add File Modal] Catch error:", err);
      setError({
        type: "NETWORK",
        title: "네트워크 오류",
        message: "파일 등록 중 오류가 발생했습니다",
        suggestions: ["인터넷 연결을 확인해주세요", "잠시 후 다시 시도해주세요"],
        retryable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Figma 파일 추가
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-5 h-5"
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
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Figma 파일 URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    validationState === "valid"
                      ? "border-green-300 focus:ring-green-500"
                      : validationState === "invalid" || validationState === "duplicate"
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                  aria-invalid={validationState === "invalid" || validationState === "duplicate"}
                  aria-describedby={validationMessage ? "url-validation" : undefined}
                />
                {validationState === "checking" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <InlineSpinner size={16} className="text-slate-400" />
                  </div>
                )}
                {validationState === "valid" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* 실시간 검증 피드백 */}
              {validationMessage && (
                <p 
                  id="url-validation"
                  className={`text-xs mt-2 flex items-center gap-1 ${
                    validationState === "valid" 
                      ? "text-green-600" 
                      : validationState === "invalid" || validationState === "duplicate"
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {validationMessage}
                </p>
              )}
              
              <p className="text-xs text-slate-500 mt-2">
                Figma 파일의 URL을 입력하세요. 댓글이 실시간으로 동기화됩니다.
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div 
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      {error.title}
                    </h3>
                    <p className="text-sm text-red-800 mb-2">
                      {error.message}
                    </p>
                    {error.suggestions.length > 0 && (
                      <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                        {error.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 경고 메시지 */}
            {warnings.length > 0 && (
              <div 
                className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                      파일이 추가되었습니다
                    </h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                취소
              </button>
              {error && error.retryable ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && <InlineSpinner size={16} />}
                  다시 시도
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  disabled={loading || validationState === "invalid" || validationState === "duplicate"}
                  aria-busy={loading}
                >
                  {loading && <InlineSpinner size={16} />}
                  {loading ? "등록 중..." : "추가"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function getErrorTitle(errorType: string): string {
  const titles: Record<string, string> = {
    CLIENT_VALIDATION: "입력 오류",
    AUTH: "인증 필요",
    PERMISSION: "권한 없음",
    NOT_FOUND: "파일을 찾을 수 없음",
    CONFLICT: "중복된 파일",
    RATE_LIMIT: "요청 한도 초과",
    SERVER: "서버 오류",
    NETWORK: "네트워크 오류",
    TIMEOUT: "요청 시간 초과",
  };
  return titles[errorType] || "오류 발생";
}

function isRetryable(errorType: string): boolean {
  return ["RATE_LIMIT", "SERVER", "NETWORK", "TIMEOUT"].includes(errorType);
}
