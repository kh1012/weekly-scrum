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
}

// 공통 입력 스타일
const inputStyles = `
  w-full px-4 py-3 
  border border-gray-200 rounded-xl 
  text-sm text-gray-900 placeholder-gray-400
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
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  tabIndex?: number;
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
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
            className={inputStyles}
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            tabIndex={-1}
            className="px-4 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
          >
            목록
          </button>
        </div>
      ) : (
        <select
          value={options.includes(value as never) ? value : ""}
          onChange={handleSelectChange}
          tabIndex={tabIndex}
          className={selectStyles}
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
}: {
  tasks: PastWeekTask[];
  onChange: (tasks: PastWeekTask[]) => void;
  baseTabIndex: number;
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
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div key={index} className="group flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(index, "title", e.target.value)}
            placeholder="작업 내용..."
            tabIndex={baseTabIndex + index * 2}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              value={task.progress}
              onChange={(e) => updateTask(index, "progress", e.target.value)}
              min={0}
              max={100}
              tabIndex={baseTabIndex + index * 2 + 1}
              className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <button
            type="button"
            onClick={() => removeTask(index)}
            tabIndex={-1}
            className="p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTask}
        tabIndex={-1}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
}: {
  tasks: string[];
  onChange: (tasks: string[]) => void;
  baseTabIndex: number;
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
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div key={index} className="group flex items-center gap-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <input
            type="text"
            value={task}
            onChange={(e) => updateTask(index, e.target.value)}
            placeholder="계획 작업..."
            tabIndex={baseTabIndex + index}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => removeTask(index)}
            tabIndex={-1}
            className="p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTask}
        tabIndex={-1}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
}: {
  risks: string[] | null;
  onChange: (risks: string[] | null) => void;
  baseTabIndex: number;
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
    <div className="space-y-3">
      {actualRisks.map((risk, index) => (
        <div key={index} className="group flex items-center gap-3 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
          <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          <input
            type="text"
            value={risk}
            onChange={(e) => updateRisk(index, e.target.value)}
            placeholder="리스크 내용..."
            tabIndex={baseTabIndex + index}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => removeRisk(index)}
            tabIndex={-1}
            className="p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRisk}
        tabIndex={-1}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
}: {
  collaborators: Collaborator[];
  onChange: (collaborators: Collaborator[]) => void;
  baseTabIndex: number;
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
    <div className="space-y-3">
      {collaborators.map((collab, index) => {
        const relations = collab.relations || [];
        
        return (
          <div key={index} className="group flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
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
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleCustomMode(index, false)}
                    tabIndex={-1}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white"
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
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                >
                  <option value="">선택...</option>
                  {NAME_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value={CUSTOM_INPUT_VALUE}>직접 입력...</option>
                </select>
              )}
            </div>

            {/* 관계 - 복수 선택 체크박스 */}
            <div className="flex items-center gap-1.5 shrink-0">
              {RELATION_OPTIONS.map((rel) => {
                const isSelected = relations.includes(rel);
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => toggleRelation(index, rel)}
                    tabIndex={-1}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5
                      ${isSelected
                        ? rel === "pair"
                          ? "bg-purple-600 text-white"
                          : rel === "pre"
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-600 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {rel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => removeCollaborator(index)}
              tabIndex={-1}
              className="p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        협업자 추가
      </button>
    </div>
  );
}

export function SnapshotEditForm({ snapshot, onUpdate }: SnapshotEditFormProps) {
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

  return (
    <div className="p-8 space-y-10 max-w-3xl">
      {/* 헤더 - Airbnb 스타일 */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">스냅샷 편집</h2>
            <p className="text-sm text-gray-500">v2 스키마 기준</p>
          </div>
        </div>
      </div>

      {/* 메타 영역 */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-gray-900" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">메타 정보</h3>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <MetaField label="Name" value={snapshot.name} options={NAME_OPTIONS} onChange={(v) => handleMetaChange("name", v)} placeholder="작성자 이름" tabIndex={1} />
          <MetaField label="Domain" value={snapshot.domain} options={DOMAIN_OPTIONS} onChange={(v) => handleMetaChange("domain", v)} tabIndex={2} />
          <MetaField label="Project" value={snapshot.project} options={PROJECT_OPTIONS} onChange={(v) => handleMetaChange("project", v)} tabIndex={3} />
          <MetaField label="Module" value={snapshot.module} options={moduleOptions} onChange={(v) => handleMetaChange("module", v)} tabIndex={4} />
          <div className="col-span-2">
            <MetaField label="Feature" value={snapshot.feature} options={FEATURE_OPTIONS} onChange={(v) => handleMetaChange("feature", v)} placeholder="기능명 (예: Rich-note)" tabIndex={5} />
          </div>
        </div>
      </section>

      {/* Past Week */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Past Week</h3>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tasks</label>
            <TaskEditor tasks={snapshot.pastWeek.tasks} onChange={(tasks) => handlePastWeekChange("tasks", tasks)} baseTabIndex={10} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Risks</label>
            <RiskEditor risks={snapshot.pastWeek.risk} onChange={(risks) => handlePastWeekChange("risk", risks)} baseTabIndex={50} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Risk Level</label>
            <div className="flex flex-wrap gap-2">
              {RISK_LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePastWeekChange("riskLevel", option.value as 0 | 1 | 2 | 3)}
                  tabIndex={-1}
                  className={`
                    px-4 py-2.5 text-sm font-medium rounded-xl transition-all
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
                  px-4 py-2.5 text-sm font-medium rounded-xl transition-all
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Collaborators</label>
            <CollaboratorEditor collaborators={snapshot.pastWeek.collaborators} onChange={(collabs) => handlePastWeekChange("collaborators", collabs)} baseTabIndex={70} />
          </div>
        </div>
      </section>

      {/* This Week */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">This Week</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tasks</label>
          <ThisWeekTaskEditor tasks={snapshot.thisWeek.tasks} onChange={handleThisWeekChange} baseTabIndex={100} />
        </div>
      </section>
    </div>
  );
}
