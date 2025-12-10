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

interface SnapshotEditFormProps {
  snapshot: TempSnapshot;
  onUpdate: (updates: Partial<TempSnapshot>) => void;
  /** 컴팩트 모드: padding/margin 30~40% 축소 */
  compact?: boolean;
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
 * Task 편집 컴포넌트 (Past Week)
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

  return (
    <div className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden ${compact ? "rounded-lg" : "rounded-xl"}`}>
      {tasks.map((task, index) => (
        <div key={index} className={`group flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors ${compact ? "px-2.5 py-2" : "px-4 py-3"}`}>
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
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              value={task.progress}
              onChange={(e) => updateTask(index, "progress", e.target.value)}
              min={0}
              max={100}
              tabIndex={baseTabIndex + index * 2 + 1}
              className={`bg-transparent border border-gray-200 text-center focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${
                compact ? "w-12 px-1.5 py-1.5 rounded text-xs" : "w-16 px-2 py-2 rounded-lg text-sm"
              }`}
            />
            <span className={compact ? "text-xs text-gray-500" : "text-sm text-gray-500"}>%</span>
          </div>
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
 * Risk 편집 컴포넌트
 */
function RiskEditor({
  risks,
  onChange,
  baseTabIndex,
  compact,
}: {
  risks: string[] | null;
  onChange: (risks: string[] | null) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const actualRisks = risks || [];

  const addRisk = () => {
    onChange([...actualRisks, ""]);
  };

  const updateRisk = (index: number, value: string) => {
    const newRisks = [...actualRisks];
    newRisks[index] = value;
    onChange(newRisks.length > 0 ? newRisks : null);
  };

  const removeRisk = (index: number) => {
    const newRisks = actualRisks.filter((_, i) => i !== index);
    onChange(newRisks.length > 0 ? newRisks : null);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
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
        리스크 추가
      </button>
    </div>
  );
}

/**
 * Collaborator 편집 컴포넌트 - relations 배열로 복수 선택 지원
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

            {/* 관계 - 복수 선택 체크박스 (사이즈 고정) */}
            <div className="flex items-center gap-1 shrink-0">
              {RELATION_OPTIONS.map((rel) => {
                const isSelected = relations.includes(rel);
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => toggleRelation(index, rel)}
                    tabIndex={-1}
                    className={`
                      font-medium rounded-md transition-all text-center
                      ${compact ? "w-10 py-1 text-[10px]" : "w-12 py-1.5 text-xs"}
                      ${isSelected
                        ? rel === "pair"
                          ? "bg-purple-600 text-white"
                          : rel === "pre"
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }
                    `}
                  >
                    {rel}
                  </button>
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

export function SnapshotEditForm({ snapshot, onUpdate, compact = false }: SnapshotEditFormProps) {
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
  const headerPadding = compact ? "px-4 pt-4 pb-3" : "px-8 pt-8 pb-6";
  const contentPadding = compact ? "p-4 space-y-6" : "p-8 space-y-10";
  const sectionSpace = compact ? "space-y-4" : "space-y-6";
  const innerSpace = compact ? "space-y-5" : "space-y-8";
  const gridGap = compact ? "gap-3" : "gap-5";
  const labelMargin = compact ? "mb-2" : "mb-3";
  const labelSize = compact ? "text-xs" : "text-sm";
  const iconSize = compact ? "w-8 h-8" : "w-10 h-10";
  const titleSize = compact ? "text-lg" : "text-xl";
  const barHeight = compact ? "h-5" : "h-6";
  const buttonPadding = compact ? "px-3 py-1.5" : "px-4 py-2.5";
  const buttonText = compact ? "text-xs" : "text-sm";
  const buttonRadius = compact ? "rounded-lg" : "rounded-xl";

  return (
    <div className="h-full">
      {/* 헤더 - 가로폭 100% */}
      <div className={`${headerPadding} border-b border-gray-100`}>
        <div className="flex items-center gap-3">
          <div className={`${iconSize} rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center`}>
            <svg className={compact ? "w-4 h-4 text-white" : "w-5 h-5 text-white"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className={`${titleSize} font-bold text-gray-900`}>스냅샷 편집</h2>
            <p className={`${labelSize} text-gray-500`}>v2 스키마 기준</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 - max-width 적용 */}
      <div className={`${contentPadding} ${compact ? "max-w-2xl" : "max-w-3xl"}`}>
        {/* 메타 영역 */}
        <section className={sectionSpace}>
          <div className="flex items-center gap-2">
            <div className={`w-1 ${barHeight} rounded-full bg-gray-900`} />
            <h3 className={`${labelSize} font-bold text-gray-900 uppercase tracking-wider`}>메타 정보</h3>
          </div>
          <div className={`grid grid-cols-2 ${gridGap}`}>
            <MetaField label="Name" value={snapshot.name} options={NAME_OPTIONS} onChange={(v) => handleMetaChange("name", v)} placeholder="작성자 이름" tabIndex={1} compact={compact} />
            <MetaField label="Domain" value={snapshot.domain} options={DOMAIN_OPTIONS} onChange={(v) => handleMetaChange("domain", v)} tabIndex={2} compact={compact} />
            <MetaField label="Project" value={snapshot.project} options={PROJECT_OPTIONS} onChange={(v) => handleMetaChange("project", v)} tabIndex={3} compact={compact} />
            <MetaField label="Module" value={snapshot.module} options={moduleOptions} onChange={(v) => handleMetaChange("module", v)} tabIndex={4} compact={compact} />
            <div className="col-span-2">
              <MetaField label="Feature" value={snapshot.feature} options={FEATURE_OPTIONS} onChange={(v) => handleMetaChange("feature", v)} placeholder="기능명 (예: Rich-note)" tabIndex={5} compact={compact} />
            </div>
          </div>
        </section>

        {/* Past Week */}
        <section className={sectionSpace}>
          <div className="flex items-center gap-2">
            <div className={`w-1 ${barHeight} rounded-full bg-blue-500`} />
            <h3 className={`${labelSize} font-bold text-gray-900 uppercase tracking-wider`}>Past Week</h3>
          </div>

          <div className={innerSpace}>
            <div>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Tasks</label>
              <TaskEditor tasks={snapshot.pastWeek.tasks} onChange={(tasks) => handlePastWeekChange("tasks", tasks)} baseTabIndex={10} compact={compact} />
            </div>

            <div>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Risks</label>
              <RiskEditor risks={snapshot.pastWeek.risk} onChange={(risks) => handlePastWeekChange("risk", risks)} baseTabIndex={50} compact={compact} />
            </div>

            <div>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Risk Level</label>
              <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
                {RISK_LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePastWeekChange("riskLevel", option.value as 0 | 1 | 2 | 3)}
                    tabIndex={-1}
                    className={`
                      ${buttonPadding} ${buttonText} font-medium ${buttonRadius} transition-all
                      ${snapshot.pastWeek.riskLevel === option.value
                        ? option.value === 0
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : option.value === 1
                          ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/25"
                          : option.value === 2
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
                    `}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePastWeekChange("riskLevel", null)}
                  tabIndex={-1}
                  className={`
                    ${buttonPadding} ${buttonText} font-medium ${buttonRadius} transition-all
                    ${snapshot.pastWeek.riskLevel === null
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  None
                </button>
              </div>
            </div>

            <div>
              <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Collaborators</label>
              <CollaboratorEditor collaborators={snapshot.pastWeek.collaborators} onChange={(collabs) => handlePastWeekChange("collaborators", collabs)} baseTabIndex={70} compact={compact} />
            </div>
          </div>
        </section>

        {/* This Week */}
        <section className={sectionSpace}>
          <div className="flex items-center gap-2">
            <div className={`w-1 ${barHeight} rounded-full bg-emerald-500`} />
            <h3 className={`${labelSize} font-bold text-gray-900 uppercase tracking-wider`}>This Week</h3>
          </div>

          <div>
            <label className={`block ${labelSize} font-medium text-gray-700 ${labelMargin}`}>Tasks</label>
            <ThisWeekTaskEditor tasks={snapshot.thisWeek.tasks} onChange={handleThisWeekChange} baseTabIndex={100} compact={compact} />
          </div>
        </section>
      </div>
    </div>
  );
}
