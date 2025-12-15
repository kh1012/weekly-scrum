"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPlan } from "@/lib/actions/plans";

// 상태 옵션
const STATUS_OPTIONS = [
  { value: "planned", label: "계획됨" },
  { value: "in_progress", label: "진행 중" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

/**
 * 새 Plan 생성 페이지
 */
export default function NewPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: "planned" | "in_progress" | "completed" | "cancelled";
    priority: number;
  }>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "planned",
    priority: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createPlan({
      title: formData.title,
      description: formData.description || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      priority: formData.priority,
    });

    setIsLoading(false);

    if (result.success) {
      router.push("/admin/plans");
    } else {
      setError(result.error || "생성에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/plans"
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-2xl">📆</span>
        <h1 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
          새 계획 생성
        </h1>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: "var(--notion-bg-elevated)",
            border: "1px solid var(--notion-border)",
          }}
        >
          {/* 제목 */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--notion-text)" }}
            >
              제목 *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
              style={{
                background: "var(--notion-bg)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              placeholder="계획 제목을 입력하세요"
            />
          </div>

          {/* 설명 */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--notion-text)" }}
            >
              설명
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40 resize-none"
              style={{
                background: "var(--notion-bg)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              placeholder="계획에 대한 설명 (선택)"
            />
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--notion-text)" }}
              >
                시작일 *
              </label>
              <input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--notion-text)" }}
              >
                종료일 *
              </label>
              <input
                id="end_date"
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              />
            </div>
          </div>

          {/* 상태 & 우선순위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--notion-text)" }}
              >
                상태
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "planned" | "in_progress" | "completed" | "cancelled",
                  })
                }
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--notion-text)" }}
              >
                우선순위
              </label>
              <input
                id="priority"
                type="number"
                min={1}
                max={10}
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              />
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(247, 109, 87, 0.08), rgba(249, 235, 178, 0.05))",
              border: "1px solid rgba(247, 109, 87, 0.2)",
              color: "#c94a3a",
            }}
          >
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-[#F76D57]/20"
            style={{
              background: "linear-gradient(135deg, #F76D57, #f9a88b)",
              color: "white",
            }}
          >
            {isLoading ? "생성 중..." : "생성하기"}
          </button>
          <Link
            href="/admin/plans"
            className="px-6 py-3 rounded-xl font-medium transition-colors"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}

