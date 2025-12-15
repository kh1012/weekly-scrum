"use client";

/**
 * 스냅샷 상세 편집 폼 - Airbnb 스타일
 *
 * v2 스키마 기준으로 모든 필드를 편집할 수 있습니다.
 * Tab으로 순차적으로 필드 이동 가능합니다.
 */

import { useState, useCallback } from "react";
import type { TempSnapshot } from "./types";
import type { PastWeekTask, Collaborator, Relation } from "@/types/scrum";
import {
  DOMAIN_OPTIONS,
  PROJECT_OPTIONS,
  MODULE_OPTIONS,
  ALL_MODULE_OPTIONS,
  FEATURE_OPTIONS,
  NAME_OPTIONS,
  RELATION_OPTIONS,
  RISK_LEVEL_OPTIONS,
  CUSTOM_INPUT_VALUE,
} from "@/lib/snapshotMetaOptions";

// 섹션 타입 (PlainTextPreview와 동일)
export type FormSection = 
  | "meta" 
  | "pastWeek" 
  | "pastWeek.tasks" 
  | "pastWeek.risks" 
  | "pastWeek.riskLevel" 
  | "pastWeek.collaborators" 
  | "thisWeek" 
  | "thisWeek.tasks";

interface SnapshotEditFormProps {
  snapshot: TempSnapshot;
  onUpdate: (updates: Partial<TempSnapshot>) => void;
  /** 컴팩트 모드: padding/margin 30~40% 축소 */
  compact?: boolean;
  /** 1열 레이아웃 모드: 좁은 화면에서 메타 필드를 1열로 배치 */
  singleColumn?: boolean;
  /** 섹션 포커스 콜백 */
  onFocusSection?: (section: FormSection | null) => void;
}

// 공통 입력 스타일 (일반 모드)
const inputStyles = `
  w-full px-4 py-3 
  border border-gray-200 rounded-xl 
  text-sm text-gray-900 placeholder-gray-400
  bg-white
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
  hover:border-gray-300
`;

// 컴팩트 입력 스타일
const inputStylesCompact = `
  w-full px-3 py-2 
  border border-gray-200 rounded-lg 
  text-xs text-gray-900 placeholder-gray-400
  bg-white
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
  hover:border-gray-300
`;

const selectStyles = `
  ${inputStyles}
  appearance-none cursor-pointer
  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] 
  bg-[length:1.5rem_1.5rem] bg-[right_0.75rem_center] bg-no-repeat pr-12
`;

const selectStylesCompact = `
  ${inputStylesCompact}
  appearance-none cursor-pointer
  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] 
  bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10
`;

/**
 * 콤보박스 + 사용자 정의 입력 컴포넌트
 */
function MetaField({
  label,
  value,
  options,
  onChange,
  placeholder,
  tabIndex,
  compact,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  tabIndex?: number;
  compact?: boolean;
}) {
  const [isCustom, setIsCustom] = useState(
    !options.includes(value as never) && value !== ""
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === CUSTOM_INPUT_VALUE) {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  const inputClass = compact ? inputStylesCompact : inputStyles;
  const selectClass = compact ? selectStylesCompact : selectStyles;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className={`block font-medium text-gray-700 ${compact ? "text-xs" : "text-sm"}`}>
        {label}
      </label>
      {isCustom ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || `${label} 입력...`}
            tabIndex={tabIndex}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            tabIndex={-1}
            className={`font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 ${
              compact ? "px-2.5 py-2 text-xs rounded-lg" : "px-4 py-3 text-sm rounded-xl"
            }`}
          >
            목록
          </button>
        </div>
      ) : (
        <select
          value={options.includes(value as never) ? value : ""}
          onChange={handleSelectChange}
          tabIndex={tabIndex}
          className={selectClass}
        >
          <option value="">선택...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value={CUSTOM_INPUT_VALUE}>직접 입력...</option>
        </select>
      )}
    </div>
  );
}

/**
 * Task 편집 컴포넌트 (Past Week) - 25% 단위 슬라이더 포함
 */
function TaskEditor({
  tasks,
  onChange,
  baseTabIndex,
  compact,
}: {
  tasks: PastWeekTask[];
  onChange: (tasks: PastWeekTask[]) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const addTask = () => {
    onChange([...tasks, { title: "", progress: 0 }]);
  };

  const updateTask = (index: number, field: keyof PastWeekTask, value: string | number) => {
    const newTasks = [...tasks];
    if (field === "title") {
      newTasks[index] = { ...newTasks[index], title: value as string };
    } else {
      newTasks[index] = { ...newTasks[index], progress: Math.min(100, Math.max(0, Number(value))) };
    }
    onChange(newTasks);
  };

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  // 슬라이더 값을 25% 단위로 스냅
  const snapToStep = (value: number) => Math.round(value / 25) * 25;

  return (
    <div className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden ${compact ? "rounded-lg" : "rounded-xl"}`}>
      {tasks.map((task, index) => (
        <div key={index} className={`group bg-white hover:bg-gray-50 transition-colors ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}>
          {/* 상단: 제목 + 삭제 */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(index, "title", e.target.value)}
              placeholder="작업 내용..."
              tabIndex={baseTabIndex + index * 2}
              className={`flex-1 bg-transparent border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${
                compact ? "px-2 py-1.5 rounded text-xs" : "px-3 py-2 rounded-lg text-sm"
              }`}
            />
            <button
              type="button"
              onClick={() => removeTask(index)}
              tabIndex={-1}
              className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ${compact ? "p-1" : "p-2"}`}
            >
              <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 하단: 프로그레스바 + 진행률 선택 - 한 줄 컴팩트 */}
          <div className={`flex items-center gap-2 ${compact ? "mt-2" : "mt-3"}`}>
            {/* 프로그레스바 (클릭/드래그 가능) */}
            <div 
              className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100 / 25) * 25;
                updateTask(index, "progress", Math.max(0, Math.min(100, percent)));
              }}
              onMouseDown={(e) => {
                const bar = e.currentTarget;
                const handleDrag = (moveEvent: MouseEvent) => {
                  const rect = bar.getBoundingClientRect();
                  const percent = Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100 / 25) * 25;
                  updateTask(index, "progress", Math.max(0, Math.min(100, percent)));
                };
                const handleUp = () => {
                  document.removeEventListener("mousemove", handleDrag);
                  document.removeEventListener("mouseup", handleUp);
                };
                document.addEventListener("mousemove", handleDrag);
                document.addEventListener("mouseup", handleUp);
              }}
            >
              <div 
                className={`h-full rounded-full transition-all duration-150 ${
                  task.progress === 100 ? 'bg-emerald-500' : 'bg-gray-900'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            
            {/* 반응형: 넓으면 버튼, 좁으면 셀렉트 */}
            {/* 버튼 그룹 (md 이상) */}
            <div className="hidden md:flex items-center gap-0.5 shrink-0">
              {[0, 25, 50, 75, 100].map((value) => {
                const isSelected = task.progress === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateTask(index, "progress", value)}
                    tabIndex={-1}
                    className={`
                      px-2 py-1 text-xs font-medium rounded transition-all
                      ${isSelected
                        ? task.progress === 100
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-900 text-white"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }
                    `}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            
            {/* 셀렉트 (md 미만) */}
            <select
              value={snapToStep(task.progress)}
              onChange={(e) => updateTask(index, "progress", Number(e.target.value))}
              tabIndex={baseTabIndex + index * 2 + 1}
              className={`md:hidden shrink-0 bg-gray-100 border-0 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                task.progress === 100
                  ? "text-emerald-600"
                  : "text-gray-700"
              } ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
            >
              {[0, 25, 50, 75, 100].map((value) => (
                <option key={value} value={value}>{value}%</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addTask}
        tabIndex={-1}
        className={`w-full flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${
          compact ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
      >
        <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        작업 추가
      </button>
    </div>
  );
}

/**
 * This Week Task 편집 컴포넌트
 */
function ThisWeekTaskEditor({
  tasks,
  onChange,
  baseTabIndex,
  compact,
}: {
  tasks: string[];
  onChange: (tasks: string[]) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const addTask = () => {
    onChange([...tasks, ""]);
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    onChange(newTasks);
  };

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden ${compact ? "rounded-lg" : "rounded-xl"}`}>
      {tasks.map((task, index) => (
        <div key={index} className={`group flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}>
          <div className={`rounded-full bg-emerald-400 shrink-0 ${compact ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
          <input
            type="text"
            value={task}
            onChange={(e) => updateTask(index, e.target.value)}
            placeholder="계획 작업..."
            tabIndex={baseTabIndex + index}
            className={`flex-1 bg-transparent border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${
              compact ? "px-2 py-1.5 rounded text-xs" : "px-3 py-2 rounded-lg text-sm"
            }`}
          />
          <button
            type="button"
            onClick={() => removeTask(index)}
            tabIndex={-1}
            className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ${compact ? "p-1" : "p-2"}`}
          >
            <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTask}
        tabIndex={-1}
        className={`w-full flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${
          compact ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
      >
        <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        계획 추가
      </button>
    </div>
  );
}

/**
 * Risk 편집 컴포넌트 - 리스크 추가 버튼 기본 제공
 * - 리스크 없으면: Risks: None, RiskLevel: None
 * - 리스크 추가 시: RiskLevel 선택 가능 (기본값 0)
 */
function RiskEditor({
  risks,
  riskLevel,
  onChange,
  onRiskLevelChange,
  baseTabIndex,
  compact,
}: {
  risks: string[] | null;
  riskLevel: 0 | 1 | 2 | 3 | null;
  onChange: (risks: string[] | null) => void;
  onRiskLevelChange?: (level: 0 | 1 | 2 | 3 | null) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const actualRisks = risks || [];
  const hasRisks = actualRisks.length > 0;

  const addRisk = () => {
    const newRisks = [...actualRisks, ""];
    onChange(newRisks);
    // 리스크 추가 시 RiskLevel을 0 (없음)으로 설정
    if (actualRisks.length === 0) {
      onRiskLevelChange?.(0);
    }
  };

  const updateRisk = (index: number, value: string) => {
    const newRisks = [...actualRisks];
    newRisks[index] = value;
    onChange(newRisks);
  };

  const removeRisk = (index: number) => {
    const newRisks = actualRisks.filter((_, i) => i !== index);
    if (newRisks.length === 0) {
      // 모든 리스크 삭제 시 null로 설정
      onChange(null);
      onRiskLevelChange?.(null);
    } else {
      onChange(newRisks);
    }
  };

  const RISK_LEVELS = [
    { value: 0, label: "없음", color: "bg-emerald-500" },
    { value: 1, label: "경미", color: "bg-yellow-500" },
    { value: 2, label: "중간", color: "bg-orange-500" },
    { value: 3, label: "심각", color: "bg-rose-500" },
  ];

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {/* 리스크 목록 */}
      {hasRisks ? (
        <>
          {actualRisks.map((risk, index) => (
            <div key={index} className={`group flex items-center gap-2 bg-orange-50 hover:bg-orange-100 transition-colors ${compact ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}>
              <div className={`rounded-full bg-orange-400 shrink-0 ${compact ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
              <input
                type="text"
                value={risk}
                onChange={(e) => updateRisk(index, e.target.value)}
                placeholder="리스크 내용..."
                tabIndex={baseTabIndex + index}
                className={`flex-1 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                  compact ? "px-2 py-1.5 rounded text-xs" : "px-3 py-2 rounded-lg text-sm"
                }`}
              />
              <button
                type="button"
                onClick={() => removeRisk(index)}
                tabIndex={-1}
                className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ${compact ? "p-1" : "p-2"}`}
              >
                <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {/* RiskLevel 선택 (리스크가 있을 때만) */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`text-gray-500 ${compact ? "text-xs" : "text-sm"}`}>Level:</span>
            {RISK_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onRiskLevelChange?.(level.value as 0 | 1 | 2 | 3)}
                className={`
                  ${compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"} 
                  rounded font-medium transition-all
                  ${riskLevel === level.value
                    ? `${level.color} text-white`
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }
                `}
              >
                {level.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* 리스크 추가 버튼 (항상 표시) */}
      <button
        type="button"
        onClick={addRisk}
        tabIndex={-1}
        className={`flex items-center gap-2 font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-100 transition-colors ${
          compact ? "px-2.5 py-1.5 text-xs rounded-lg" : "px-4 py-2.5 text-sm rounded-xl"
        }`}
      >
        <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        + 리스크 추가
      </button>
    </div>
  );
}

// Relation 아이콘 및 설명
const RELATION_INFO: Record<Relation, { icon: React.ReactNode; label: string; description: string; color: string; activeColor: string }> = {
  pair: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    label: "페어",
    description: "실시간 공동 협업 (pair partner)",
    color: "bg-gray-100 text-gray-500 hover:bg-gray-200",
    activeColor: "bg-purple-600 text-white",
  },
  pre: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    ),
    label: "사전",
    description: "앞단 협업자 - 내 작업에 필요한 선행 입력 제공",
    color: "bg-gray-100 text-gray-500 hover:bg-gray-200",
    activeColor: "bg-blue-600 text-white",
  },
  post: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
    label: "사후",
    description: "후단 협업자 - 내 결과물을 받아 다음 단계 수행",
    color: "bg-gray-100 text-gray-500 hover:bg-gray-200",
    activeColor: "bg-emerald-600 text-white",
  },
};

/**
 * Collaborator 편집 컴포넌트 - 아이콘 + 툴팁 + 체크박스 형태
 */
function CollaboratorEditor({
  collaborators,
  onChange,
  baseTabIndex,
  compact,
}: {
  collaborators: Collaborator[];
  onChange: (collaborators: Collaborator[]) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const [customModes, setCustomModes] = useState<Record<number, boolean>>({});

  const addCollaborator = () => {
    // relation과 relations 둘 다 설정 (하위 호환성)
    onChange([...collaborators, { name: "", relation: "pair", relations: ["pair"] }]);
  };

  const updateName = (index: number, name: string) => {
    const newCollaborators = [...collaborators];
    newCollaborators[index] = { ...newCollaborators[index], name };
    onChange(newCollaborators);
  };

  const toggleRelation = (index: number, rel: Relation) => {
    const newCollaborators = [...collaborators];
    const currentRelations = newCollaborators[index].relations || [newCollaborators[index].relation];
    
    let newRelations: Relation[];
    if (currentRelations.includes(rel)) {
      // 이미 선택되어 있으면 제거 (최소 1개는 유지)
      if (currentRelations.length > 1) {
        newRelations = currentRelations.filter((r) => r !== rel);
      } else {
        newRelations = currentRelations;
      }
    } else {
      // 선택되어 있지 않으면 추가
      newRelations = [...currentRelations, rel];
    }
    
    // relation과 relations 둘 다 업데이트 (하위 호환성)
    newCollaborators[index] = {
      ...newCollaborators[index],
      relation: newRelations[0], // 첫 번째 값을 기본 relation으로
      relations: newRelations,
    };
    onChange(newCollaborators);
  };

  const toggleCustomMode = (index: number, enable: boolean) => {
    setCustomModes((prev) => ({ ...prev, [index]: enable }));
    if (enable) {
      updateName(index, "");
    }
  };

  const removeCollaborator = (index: number) => {
    onChange(collaborators.filter((_, i) => i !== index));
    setCustomModes((prev) => {
      const newModes: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key, 10);
        if (k < index) newModes[k] = prev[k];
        else if (k > index) newModes[k - 1] = prev[k];
      });
      return newModes;
    });
  };

  const isCustomMode = (index: number, name: string) => {
    if (customModes[index] !== undefined) return customModes[index];
    return name !== "" && !NAME_OPTIONS.includes(name as never);
  };

  return (
    <div className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden ${compact ? "rounded-lg" : "rounded-xl"}`}>
      {collaborators.map((collab, index) => {
        const relations = collab.relations || [];
        
        return (
          <div key={index} className={`group flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}>
            {/* 이름 */}
            <div className="flex-1 min-w-0">
              {isCustomMode(index, collab.name) ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={collab.name}
                    onChange={(e) => updateName(index, e.target.value)}
                    placeholder="협업자 이름..."
                    tabIndex={baseTabIndex + index}
                    className={`flex-1 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                      compact ? "px-2 py-1.5 rounded text-xs" : "px-3 py-2 rounded-lg text-sm"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleCustomMode(index, false)}
                    tabIndex={-1}
                    className={`text-gray-600 border border-gray-200 hover:bg-white ${
                      compact ? "px-2 py-1.5 text-xs rounded" : "px-3 py-2 text-sm rounded-lg"
                    }`}
                  >
                    목록
                  </button>
                </div>
              ) : (
                <select
                  value={NAME_OPTIONS.includes(collab.name as never) ? collab.name : ""}
                  onChange={(e) => {
                    if (e.target.value === CUSTOM_INPUT_VALUE) {
                      toggleCustomMode(index, true);
                    } else {
                      updateName(index, e.target.value);
                    }
                  }}
                  tabIndex={baseTabIndex + index}
                  className={`w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10 ${
                    compact ? "px-2 py-1.5 rounded text-xs" : "px-3 py-2 rounded-lg text-sm"
                  }`}
                >
                  <option value="">선택...</option>
                  {NAME_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value={CUSTOM_INPUT_VALUE}>직접 입력...</option>
                </select>
              )}
            </div>

            {/* 관계 - 아이콘 + 툴팁 + 체크박스 형태 */}
            <div className="flex items-center gap-1 shrink-0">
              {RELATION_OPTIONS.map((rel) => {
                const isSelected = relations.includes(rel);
                const info = RELATION_INFO[rel];
                return (
                  <div key={rel} className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => toggleRelation(index, rel)}
                      tabIndex={-1}
                      className={`
                        flex items-center justify-center gap-1 rounded-lg transition-all
                        ${compact ? "w-8 h-8" : "w-10 h-10"}
                        ${isSelected ? info.activeColor : info.color}
                      `}
                      aria-label={info.label}
                    >
                      {info.icon}
                    </button>
                    {/* 툴팁 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="font-semibold">{info.label}</div>
                      <div className="text-gray-300 text-[10px]">{info.description}</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => removeCollaborator(index)}
              tabIndex={-1}
              className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ${compact ? "p-1" : "p-2"}`}
            >
              <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addCollaborator}
        tabIndex={-1}
        className={`w-full flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${
          compact ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
      >
        <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        협업자 추가
      </button>
    </div>
  );
}

export function SnapshotEditForm({ snapshot, onUpdate, compact = false, singleColumn = false, onFocusSection }: SnapshotEditFormProps) {
  const moduleOptions = snapshot.project && MODULE_OPTIONS[snapshot.project]
    ? MODULE_OPTIONS[snapshot.project]
    : ALL_MODULE_OPTIONS;

  const handleMetaChange = useCallback(
    (field: keyof TempSnapshot, value: string) => {
      onUpdate({ [field]: value } as Partial<TempSnapshot>);
    },
    [onUpdate]
  );

  const handlePastWeekChange = useCallback(
    (field: keyof TempSnapshot["pastWeek"], value: PastWeekTask[] | string[] | Collaborator[] | number | null) => {
      onUpdate({
        pastWeek: { ...snapshot.pastWeek, [field]: value },
      });
    },
    [onUpdate, snapshot.pastWeek]
  );

  const handleThisWeekChange = useCallback(
    (tasks: string[]) => {
      onUpdate({ thisWeek: { tasks } });
    },
    [onUpdate]
  );

  // 컴팩트 모드 스타일
  const contentPadding = compact ? "p-4 space-y-6" : "p-8 space-y-10";
  const sectionSpace = compact ? "space-y-4" : "space-y-6";
  const innerSpace = compact ? "space-y-5" : "space-y-8";
  const gridGap = compact ? "gap-3" : "gap-5";
  const labelMargin = compact ? "mb-2" : "mb-3";
  const labelSize = compact ? "text-xs" : "text-sm";
  const barHeight = compact ? "h-5" : "h-6";
  
  // 1열/2열 그리드 레이아웃
  const gridCols = singleColumn ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 - h-12 통일 */}
      <div className="h-12 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center shrink-0">
        <span className="text-sm font-semibold text-gray-800">스냅샷 편집</span>
      </div>

      {/* 콘텐츠 영역 - 스크롤 가능 */}
      <div className={`flex-1 overflow-y-auto ${contentPadding} ${compact ? "max-w-2xl" : "max-w-3xl"}`}>
        {/* 메타 영역 */}
        <section 
          className={sectionSpace}
          onFocus={() => onFocusSection?.("meta")}
        >
          <div className="flex items-center gap-2">
            <div className={`w-1 ${barHeight} rounded-full bg-gray-900`} />
            <h3 className={`${labelSize} font-bold text-gray-900 uppercase tracking-wider`}>메타 정보</h3>
          </div>
          <div className={`grid ${gridCols} ${gridGap}`}>
            <MetaField label="Name" value={snapshot.name} options={NAME_OPTIONS} onChange={(v) => handleMetaChange("name", v)} placeholder="작성자 이름" tabIndex={1} compact={compact} />
            <MetaField label="Domain" value={snapshot.domain} options={DOMAIN_OPTIONS} onChange={(v) => handleMetaChange("domain", v)} tabIndex={2} compact={compact} />
            <MetaField label="Project" value={snapshot.project} options={PROJECT_OPTIONS} onChange={(v) => handleMetaChange("project", v)} tabIndex={3} compact={compact} />
            <MetaField label="Module" value={snapshot.module} options={moduleOptions} onChange={(v) => handleMetaChange("module", v)} tabIndex={4} compact={compact} />
            <div className={singleColumn ? "" : "col-span-2"}>
              <MetaField label="Feature" value={snapshot.feature} options={FEATURE_OPTIONS} onChange={(v) => handleMetaChange("feature", v)} placeholder="기능명 (예: Rich-note)" tabIndex={5} compact={compact} />
            </div>
          </div>
        </section>

        {/* Past Week */}
        <section className={sectionSpace}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-1 ${barHeight} rounded-full bg-blue-500`} />
              <h3 className={`${labelSize} font-bold text-gray-900 uppercase tracking-wider`}>Past Week</h3>
            </div>
            
            {/* This Week → Past Week 덮어쓰기 버튼 */}
            {snapshot.thisWeek.tasks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  // This Week tasks를 Past Week tasks 형태로 변환 (progress 0%)
                  const newTasks = snapshot.thisWeek.tasks.map((title) => ({
                    title,
                    progress: 0,
                  }));
                  handlePastWeekChange("tasks", newTasks);
                }}
                className={`flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors ${
                  compact ? "px-2 py-1 text-[10px] rounded-md" : "px-3 py-1.5 text-xs rounded-lg"
                }`}
                title="This Week 작업을 Past Week로 복사합니다"
              >
                <svg className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                This Week에서 가져오기
              </button>
            )}
          </div>

          <div className={innerSpace}>
            <div onFocus={() => onFocusSection?.("pastWeek.tasks")}>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Tasks</label>
              <TaskEditor tasks={snapshot.pastWeek.tasks} onChange={(tasks) => handlePastWeekChange("tasks", tasks)} baseTabIndex={10} compact={compact} />
            </div>

            <div onFocus={() => onFocusSection?.("pastWeek.risks")}>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Risks</label>
              <RiskEditor 
                risks={snapshot.pastWeek.risk}
                riskLevel={snapshot.pastWeek.riskLevel}
                onChange={(risks) => handlePastWeekChange("risk", risks)} 
                onRiskLevelChange={(level) => handlePastWeekChange("riskLevel", level)}
                baseTabIndex={50} 
                compact={compact} 
              />
            </div>

            <div onFocus={() => onFocusSection?.("pastWeek.collaborators")}>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Collaborators</label>
              <CollaboratorEditor collaborators={snapshot.pastWeek.collaborators} onChange={(collabs) => handlePastWeekChange("collaborators", collabs)} baseTabIndex={70} compact={compact} />
            </div>
          </div>
        </section>

        {/* This Week */}
        <section 
          className={sectionSpace}
          onFocus={() => onFocusSection?.("thisWeek")}
        >
          <div className="flex items-center gap-2">
            <div className={`w-1 ${barHeight} rounded-full bg-emerald-500`} />
            <h3 className={`${labelSize} font-bold text-gray-900 uppercase tracking-wider`}>This Week</h3>
          </div>

          <div onFocus={() => onFocusSection?.("thisWeek.tasks")}>
            <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Tasks</label>
            <ThisWeekTaskEditor tasks={snapshot.thisWeek.tasks} onChange={handleThisWeekChange} baseTabIndex={100} compact={compact} />
          </div>
        </section>
      </div>
    </div>
  );
}
