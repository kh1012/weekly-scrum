"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import type { CreatePlanActionInput } from "@/lib/actions/plans";
import type { PlanType, PlanStatus, AssigneeRole } from "@/lib/data/plans";
import type { WorkspaceMember } from "@/lib/data/members";

const DEFAULT_WORKSPACE_ID = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

interface PlanFormData extends CreatePlanActionInput {
  id?: string;
}

interface PlanFormProps {
  initialData?: Partial<CreatePlanActionInput> & {
    id?: string;
    assignees?: Array<{ user_id: string; role: AssigneeRole }>;
  };
  onSubmit: (data: PlanFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  submitLabel: string;
  cancelHref: string;
}

const TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: "feature", label: "기능 (Feature)" },
  { value: "sprint", label: "스프린트 (Sprint)" },
  { value: "release", label: "릴리즈 (Release)" },
];

const STATUS_OPTIONS: { value: PlanStatus; label: string }[] = [
  { value: "진행중", label: "진행중" },
  { value: "완료", label: "완료" },
  { value: "보류", label: "보류" },
  { value: "취소", label: "취소" },
];

const STAGE_OPTIONS = [
  "컨셉 기획",
  "상세 기획",
  "디자인",
  "BE 개발",
  "FE 개발",
  "QA",
];

const ROLE_OPTIONS: { value: AssigneeRole; label: string }[] = [
  { value: "planner", label: "기획" },
  { value: "fe", label: "FE" },
  { value: "be", label: "BE" },
  { value: "designer", label: "디자인" },
  { value: "qa", label: "검증" },
];

interface AssigneeEntry {
  user_id: string;
  role: AssigneeRole;
}

/**
 * Plan 생성/수정 폼 컴포넌트
 */
export function PlanForm({
  initialData,
  onSubmit,
  isLoading,
  error,
  submitLabel,
  cancelHref,
}: PlanFormProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);

  const [formData, setFormData] = useState({
    type: initialData?.type || ("feature" as PlanType),
    title: initialData?.title || "",
    stage: initialData?.stage || "컨셉 기획",
    status: initialData?.status || ("진행중" as PlanStatus),
    project: initialData?.project || "",
    module: initialData?.module || "",
    feature: initialData?.feature || "",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
  });

  const [assignees, setAssignees] = useState<AssigneeEntry[]>(
    initialData?.assignees || []
  );

  // 멤버 목록 로드 (별도 쿼리 방식 - FK 관계 없이 안전하게 조회)
  useEffect(() => {
    async function loadMembers() {
      try {
        if (!DEFAULT_WORKSPACE_ID) {
          console.error("DEFAULT_WORKSPACE_ID is not set");
          return;
        }

        const supabase = createClient();

        // 1. workspace_members 먼저 조회
        const { data: membersData, error: membersError } = await supabase
          .from("workspace_members")
          .select("user_id, role")
          .eq("workspace_id", DEFAULT_WORKSPACE_ID);

        if (membersError) throw membersError;
        if (!membersData || membersData.length === 0) {
          setMembers([]);
          return;
        }

        // 타입 정의
        interface MemberRow {
          user_id: string;
          role: string;
        }
        interface ProfileRow {
          user_id: string;
          display_name: string | null;
          email: string | null;
        }

        // 2. profiles 별도 조회
        const userIds = (membersData as MemberRow[]).map((m) => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds);

        if (profilesError) {
          console.error("Failed to fetch profiles:", profilesError);
        }

        // 3. 조합
        const profileMap = new Map<string, { display_name: string | null; email: string | null }>();
        for (const p of (profilesData || []) as ProfileRow[]) {
          profileMap.set(p.user_id, {
            display_name: p.display_name,
            email: p.email,
          });
        }

        const memberList = (membersData as MemberRow[]).map((m) => {
          const profile = profileMap.get(m.user_id);
          return {
            user_id: m.user_id,
            display_name: profile?.display_name || null,
            email: profile?.email || null,
            role: m.role as "admin" | "leader" | "member",
          };
        });

        setMembers(memberList);
      } catch (err) {
        console.error("Failed to load members:", err);
      } finally {
        setIsMembersLoading(false);
      }
    }

    loadMembers();
  }, []);

  const isFeatureType = formData.type === "feature";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // feature type 검증 (프로젝트/모듈/기능만 필수)
    if (isFeatureType) {
      if (!formData.project || !formData.module || !formData.feature) {
        alert("feature 타입 계획은 프로젝트, 모듈, 기능이 모두 필수입니다.");
        return;
      }
    }

    // 날짜 검증
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        alert("종료일은 시작일보다 이후여야 합니다.");
        return;
      }
    }

    await onSubmit({
      type: formData.type,
      title: formData.title,
      // stage는 feature 타입에서만 사용
      stage: isFeatureType ? formData.stage : "",
      status: formData.status,
      // 위계정보는 feature 타입에서만 사용
      project: isFeatureType ? formData.project || undefined : undefined,
      module: isFeatureType ? formData.module || undefined : undefined,
      feature: isFeatureType ? formData.feature || undefined : undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      // 담당자는 feature 타입에서만 사용
      assignees: isFeatureType && assignees.length > 0 ? assignees : undefined,
    });
  };

  // 담당자 추가
  const addAssignee = () => {
    if (members.length === 0) return;
    setAssignees([...assignees, { user_id: members[0].user_id, role: "fe" }]);
  };

  // 담당자 제거
  const removeAssignee = (index: number) => {
    setAssignees(assignees.filter((_, i) => i !== index));
  };

  // 담당자 업데이트
  const updateAssignee = (index: number, field: keyof AssigneeEntry, value: string) => {
    const updated = [...assignees];
    updated[index] = { ...updated[index], [field]: value };
    setAssignees(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <div
        className="p-6 rounded-2xl space-y-4"
        style={{
          background: "var(--notion-bg-elevated)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--notion-text-muted)" }}>
          기본 정보
        </h2>

        {/* 타입 & 상태 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
              타입 *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PlanType })}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
              style={{
                background: "var(--notion-bg)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text)",
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
              상태 *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
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
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
            제목 *
          </label>
          <input
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
            placeholder={
              formData.type === "release" ? "예: 26.1" : 
              formData.type === "sprint" ? "예: Sprint 2025-W01" : 
              "계획 제목을 입력하세요"
            }
          />
        </div>

        {/* 단계 (feature 타입에서만) */}
        {isFeatureType && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
              단계 *
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
              style={{
                background: "var(--notion-bg)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text)",
              }}
            >
              {STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 위계 정보 (feature type만) */}
      {isFeatureType && (
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: "var(--notion-bg-elevated)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--notion-text-muted)" }}>
            위계 정보
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}
            >
              Feature 타입 필수
            </span>
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
                릴리즈 *
              </label>
              <input
                type="text"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
                placeholder="예: 26.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
                스프린트 *
              </label>
              <input
                type="text"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
                placeholder="예: 2025-W01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
                기능 *
              </label>
              <input
                type="text"
                value={formData.feature}
                onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
                placeholder="예: 메쉬 생성"
              />
            </div>
          </div>
        </div>
      )}

      {/* 일정 */}
      <div
        className="p-6 rounded-2xl space-y-4"
        style={{
          background: "var(--notion-bg-elevated)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--notion-text-muted)" }}>
          일정
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
              시작일
            </label>
            <input
              type="date"
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
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--notion-text)" }}>
              종료일
            </label>
            <input
              type="date"
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
      </div>

      {/* 담당자 (feature 타입에서만) */}
      {isFeatureType && (
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{
            background: "var(--notion-bg-elevated)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--notion-text-muted)" }}>
              담당자
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                기획 / FE / BE / 디자인 / 검증
              </span>
            </h2>
            <button
              type="button"
              onClick={addAssignee}
              disabled={isMembersLoading}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-blue-50"
              style={{ color: "#3b82f6" }}
            >
              + 담당자 추가
            </button>
          </div>

          {isMembersLoading ? (
            <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
              멤버 목록 로딩 중...
            </p>
          ) : assignees.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
              담당자가 없습니다. 위의 버튼을 클릭하여 추가하세요.
            </p>
          ) : (
            <div className="space-y-2">
              {assignees.map((assignee, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={assignee.user_id}
                    onChange={(e) => updateAssignee(index, "user_id", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                    style={{
                      background: "var(--notion-bg)",
                      borderColor: "var(--notion-border)",
                      color: "var(--notion-text)",
                    }}
                  >
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.display_name || m.email || m.user_id}
                      </option>
                    ))}
                  </select>
                  <select
                    value={assignee.role}
                    onChange={(e) => updateAssignee(index, "role", e.target.value)}
                    className="w-28 px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                    style={{
                      background: "var(--notion-bg)",
                      borderColor: "var(--notion-border)",
                      color: "var(--notion-text)",
                    }}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAssignee(index)}
                    className="p-2 rounded-lg transition-colors hover:bg-red-50"
                    style={{ color: "#ef4444" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          {isLoading ? "처리 중..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
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
  );
}

