"use client";

/**
 * CreatePlanPopover - 계획 등록 팝오버 컴포넌트
 * 
 * 기능:
 * - 버튼 클릭 시 아래쪽에 팝오버 형태로 표시
 * - PlanForm을 포함하여 빠른 계획 생성
 * - 외부 클릭 시 닫기
 * - Esc 키로 닫기
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createPlanAction } from "@/lib/actions/plans";
import type { CreatePlanActionInput } from "@/lib/actions/plans";
import type { PlanType } from "@/lib/data/plans";
import { SearchableSelect } from "@/components/common";
import { createClient } from "@/lib/supabase/browser";

const DEFAULT_WORKSPACE_ID = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

const TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: "feature", label: "기능 (Feature)" },
  { value: "sprint", label: "스프린트 (Sprint)" },
  { value: "release", label: "릴리즈 (Release)" },
];

const STAGE_OPTIONS = [
  "컨셉 기획",
  "상세 기획",
  "디자인",
  "BE 개발",
  "FE 개발",
  "QA",
];

interface CreatePlanPopoverProps {
  /** 최소화된 헤더용 압축 모드 */
  compact?: boolean;
}

export function CreatePlanPopover({ compact = false }: CreatePlanPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // 폼 상태
  const [formData, setFormData] = useState({
    type: "feature" as PlanType,
    title: "",
    stage: "컨셉 기획",
    project: "",
    module: "",
    feature: "",
    start_date: "",
    end_date: "",
  });

  // 필터 옵션
  const [loadedOptions, setLoadedOptions] = useState<{
    projects: string[];
    modules: string[];
    features: string[];
  }>({ projects: [], modules: [], features: [] });

  // 옵션 로드
  useEffect(() => {
    async function loadOptions() {
      try {
        const supabase = createClient();
        const { data: plansData } = await supabase
          .from("v_plans_with_assignees")
          .select("project, module, feature")
          .eq("workspace_id", DEFAULT_WORKSPACE_ID);

        if (plansData && plansData.length > 0) {
          const projects = new Set<string>();
          const modules = new Set<string>();
          const features = new Set<string>();

          for (const row of plansData) {
            if (row.project) projects.add(row.project);
            if (row.module) modules.add(row.module);
            if (row.feature) features.add(row.feature);
          }

          setLoadedOptions({
            projects: Array.from(projects).sort(),
            modules: Array.from(modules).sort(),
            features: Array.from(features).sort(),
          });
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // 팝오버 위치 계산
  const calculatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 480;
      const popoverHeight = 520;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < popoverHeight && rect.top > spaceBelow;

      // 우측 정렬
      let left = rect.right - popoverWidth;
      if (left < 16) left = 16;

      setPopoverStyle({
        position: "fixed",
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 8 }
          : { top: rect.bottom + 8 }),
        left,
        width: popoverWidth,
        zIndex: 9999,
      });
    }
  }, []);

  // 열기/닫기
  const handleOpen = () => {
    calculatePosition();
    setIsOpen(true);
    setError(null);
    // 폼 초기화
    setFormData({
      type: "feature",
      title: "",
      stage: "컨셉 기획",
      project: "",
      module: "",
      feature: "",
      start_date: "",
      end_date: "",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Esc 키 감지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (isOpen) {
      const handleScrollOrResize = () => calculatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, calculatePosition]);

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const isFeatureType = formData.type === "feature";

    // 검증
    if (isFeatureType && (!formData.project || !formData.module || !formData.feature)) {
      setError("프로젝트, 모듈, 기능명을 모두 입력해주세요.");
      setIsLoading(false);
      return;
    }

    if (!formData.title) {
      setError("제목을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    const payload: CreatePlanActionInput = {
      type: formData.type,
      title: formData.title,
      stage: isFeatureType ? formData.stage : "",
      project: isFeatureType ? formData.project : undefined,
      module: isFeatureType ? formData.module : undefined,
      feature: isFeatureType ? formData.feature : undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    };

    const result = await createPlanAction(payload);
    setIsLoading(false);

    if (result.success) {
      handleClose();
      router.refresh();
    } else {
      setError(result.error || "생성에 실패했습니다.");
    }
  };

  const isFeatureType = formData.type === "feature";

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className={`flex items-center transition-all duration-200 hover:shadow-lg hover:shadow-[#F76D57]/20 ${
          compact
            ? "gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
            : "gap-2 px-4 py-2 rounded-xl text-sm font-medium"
        }`}
        style={{
          background: "linear-gradient(135deg, #F76D57, #f9a88b)",
          color: "white",
        }}
        title={compact ? "계획 등록" : undefined}
      >
        <svg
          className={compact ? "w-3 h-3" : "w-4 h-4"}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {compact ? "등록" : "계획 등록"}
      </button>

      {/* 팝오버 */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              ...popoverStyle,
              background: "var(--notion-bg)",
              borderColor: "var(--notion-border)",
            }}
          >
            {/* 헤더 */}
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: "var(--notion-border)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📆</span>
                <h2 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
                  새 계획 등록
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                style={{ color: "var(--notion-text-muted)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* 타입 & 제목 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text)" }}>
                    타입 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PlanType })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
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
                {isFeatureType && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text)" }}>
                      단계 *
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
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

              {/* 제목 */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text)" }}>
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    formData.type === "release" ? "예: 26.1" :
                    formData.type === "sprint" ? "예: Sprint 2025-W01" :
                    "계획 제목을 입력하세요"
                  }
                  className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                  }}
                  autoFocus
                />
              </div>

              {/* 위계 정보 (feature만) */}
              {isFeatureType && (
                <div className="grid grid-cols-3 gap-3">
                  <SearchableSelect
                    label="프로젝트"
                    value={formData.project}
                    options={loadedOptions.projects}
                    onChange={(v) => setFormData({ ...formData, project: v })}
                    placeholder="선택..."
                    required
                    notionStyle
                    compact
                  />
                  <SearchableSelect
                    label="모듈"
                    value={formData.module}
                    options={loadedOptions.modules}
                    onChange={(v) => setFormData({ ...formData, module: v })}
                    placeholder="선택..."
                    required
                    notionStyle
                    compact
                  />
                  <SearchableSelect
                    label="기능명"
                    value={formData.feature}
                    options={loadedOptions.features}
                    onChange={(v) => setFormData({ ...formData, feature: v })}
                    placeholder="선택..."
                    required
                    notionStyle
                    compact
                  />
                </div>
              )}

              {/* 일정 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text)" }}>
                    시작일
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40 cursor-pointer"
                    style={{
                      background: "var(--notion-bg)",
                      borderColor: "var(--notion-border)",
                      color: "var(--notion-text)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text)" }}>
                    종료일
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40 cursor-pointer"
                    style={{
                      background: "var(--notion-bg)",
                      borderColor: "var(--notion-border)",
                      color: "var(--notion-text)",
                    }}
                  />
                </div>
              </div>

              {/* 에러 */}
              {error && (
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                  }}
                >
                  {error}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-[#F76D57]/20"
                  style={{
                    background: "linear-gradient(135deg, #F76D57, #f9a88b)",
                    color: "white",
                  }}
                >
                  {isLoading ? "생성 중..." : "생성하기"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: "var(--notion-bg-secondary)",
                    color: "var(--notion-text-muted)",
                  }}
                >
                  취소
                </button>
              </div>
            </form>

            {/* 힌트 */}
            <div
              className="px-5 py-3 border-t flex items-center justify-between text-[10px]"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text-muted)",
              }}
            >
              <span>💡 더 자세한 설정은 생성 후 편집에서</span>
              <span>Esc로 닫기</span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

