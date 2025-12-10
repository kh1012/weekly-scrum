"use client";

/**
 * 스냅샷 상세 편집 폼
 *
 * v2 스키마 기준으로 모든 필드를 편집할 수 있습니다.
 * 메타 필드는 콤보박스 + 사용자 정의 입력을 지원합니다.
 */

import { useState, useEffect, useCallback } from "react";
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

/**
 * 콤보박스 + 사용자 정의 입력 컴포넌트
 */
function MetaField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {isCustom ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder || `${label} 입력...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록
          </button>
        </div>
      ) : (
        <select
          value={options.includes(value as never) ? value : ""}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
        >
          <option value="">선택...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value={CUSTOM_INPUT_VALUE}>사용자 정의...</option>
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
}: {
  tasks: PastWeekTask[];
  onChange: (tasks: PastWeekTask[]) => void;
}) {
  const addTask = () => {
    onChange([...tasks, { title: "", progress: 0 }]);
  };

  const updateTask = (
    index: number,
    field: keyof PastWeekTask,
    value: string | number
  ) => {
    const newTasks = [...tasks];
    if (field === "title") {
      newTasks[index] = { ...newTasks[index], title: value as string };
    } else {
      newTasks[index] = {
        ...newTasks[index],
        progress: Math.min(100, Math.max(0, Number(value))),
      };
    }
    onChange(newTasks);
  };

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(index, "title", e.target.value)}
            placeholder="작업 내용..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex items-center gap-1 w-24">
            <input
              type="number"
              value={task.progress}
              onChange={(e) => updateTask(index, "progress", e.target.value)}
              min={0}
              max={100}
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <button
            type="button"
            onClick={() => removeTask(index)}
            className="p-2 text-gray-400 hover:text-red-500 rounded"
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
      ))}
      <button
        type="button"
        onClick={addTask}
        className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
            d="M12 4v16m8-8H4"
          />
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
}: {
  tasks: string[];
  onChange: (tasks: string[]) => void;
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
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={task}
            onChange={(e) => updateTask(index, e.target.value)}
            placeholder="계획 작업..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => removeTask(index)}
            className="p-2 text-gray-400 hover:text-red-500 rounded"
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
      ))}
      <button
        type="button"
        onClick={addTask}
        className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
            d="M12 4v16m8-8H4"
          />
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
}: {
  risks: string[] | null;
  onChange: (risks: string[] | null) => void;
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
    <div className="space-y-2">
      {actualRisks.map((risk, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={risk}
            onChange={(e) => updateRisk(index, e.target.value)}
            placeholder="리스크 내용..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => removeRisk(index)}
            className="p-2 text-gray-400 hover:text-red-500 rounded"
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
      ))}
      <button
        type="button"
        onClick={addRisk}
        className="flex items-center gap-1 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        리스크 추가
      </button>
    </div>
  );
}

/**
 * Collaborator 편집 컴포넌트
 * - 이름: 콤보박스 + 직접 입력 지원
 * - 관계: 체크박스로 다중 선택 (현재 타입상 단일 relation 유지)
 */
function CollaboratorEditor({
  collaborators,
  onChange,
}: {
  collaborators: Collaborator[];
  onChange: (collaborators: Collaborator[]) => void;
}) {
  // 각 협업자별 직접 입력 모드 상태
  const [customModes, setCustomModes] = useState<Record<number, boolean>>({});

  const addCollaborator = () => {
    onChange([...collaborators, { name: "", relation: "pair" }]);
  };

  const updateCollaborator = (
    index: number,
    field: keyof Collaborator,
    value: string
  ) => {
    const newCollaborators = [...collaborators];
    if (field === "name") {
      newCollaborators[index] = { ...newCollaborators[index], name: value };
    } else {
      newCollaborators[index] = {
        ...newCollaborators[index],
        relation: value as Relation,
      };
    }
    onChange(newCollaborators);
  };

  const toggleCustomMode = (index: number, enable: boolean) => {
    setCustomModes((prev) => ({ ...prev, [index]: enable }));
    if (enable) {
      updateCollaborator(index, "name", "");
    }
  };

  const removeCollaborator = (index: number) => {
    onChange(collaborators.filter((_, i) => i !== index));
    // customModes 정리
    setCustomModes((prev) => {
      const newModes: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key, 10);
        if (k < index) {
          newModes[k] = prev[k];
        } else if (k > index) {
          newModes[k - 1] = prev[k];
        }
      });
      return newModes;
    });
  };

  // 값이 옵션에 없으면 자동으로 직접 입력 모드
  const isCustomMode = (index: number, name: string) => {
    if (customModes[index] !== undefined) return customModes[index];
    return name !== "" && !NAME_OPTIONS.includes(name as never);
  };

  return (
    <div className="space-y-3">
      {collaborators.map((collab, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
        >
          {/* 이름 입력 */}
          <div className="flex-1 min-w-0">
            {isCustomMode(index, collab.name) ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={collab.name}
                  onChange={(e) =>
                    updateCollaborator(index, "name", e.target.value)
                  }
                  placeholder="협업자 이름 입력..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleCustomMode(index, false)}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-white"
                >
                  목록
                </button>
              </div>
            ) : (
              <select
                value={
                  NAME_OPTIONS.includes(collab.name as never) ? collab.name : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === CUSTOM_INPUT_VALUE) {
                    toggleCustomMode(index, true);
                  } else {
                    updateCollaborator(index, "name", val);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10 bg-white"
              >
                <option value="">이름 선택...</option>
                {NAME_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value={CUSTOM_INPUT_VALUE}>직접 입력...</option>
              </select>
            )}
          </div>

          {/* 관계 선택 - 체크박스 형태 */}
          <div className="flex items-center gap-2 shrink-0">
            {RELATION_OPTIONS.map((rel) => (
              <label
                key={rel}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  collab.relation === rel
                    ? rel === "pair"
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : rel === "pre"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-green-100 text-green-700 border border-green-300"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={collab.relation === rel}
                  onChange={() => updateCollaborator(index, "relation", rel)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-xs font-medium">{rel}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => removeCollaborator(index)}
            className="p-2 text-gray-400 hover:text-red-500 rounded shrink-0"
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
      ))}
      <button
        type="button"
        onClick={addCollaborator}
        className="flex items-center gap-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        협업자 추가
      </button>
    </div>
  );
}

export function SnapshotEditForm({
  snapshot,
  onUpdate,
}: SnapshotEditFormProps) {
  // 프로젝트에 따른 모듈 옵션
  const moduleOptions =
    snapshot.project && MODULE_OPTIONS[snapshot.project]
      ? MODULE_OPTIONS[snapshot.project]
      : ALL_MODULE_OPTIONS;

  const handleMetaChange = useCallback(
    (field: keyof TempSnapshot, value: string) => {
      onUpdate({ [field]: value } as Partial<TempSnapshot>);
    },
    [onUpdate]
  );

  const handlePastWeekChange = useCallback(
    (
      field: keyof TempSnapshot["pastWeek"],
      value: PastWeekTask[] | string[] | Collaborator[] | number | null
    ) => {
      onUpdate({
        pastWeek: {
          ...snapshot.pastWeek,
          [field]: value,
        },
      });
    },
    [onUpdate, snapshot.pastWeek]
  );

  const handleThisWeekChange = useCallback(
    (tasks: string[]) => {
      onUpdate({
        thisWeek: { tasks },
      });
    },
    [onUpdate]
  );

  return (
    <div className="p-6 space-y-8 max-w-3xl rounded-br-2xl">
      {/* 헤더 */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">스냅샷 편집</h2>
        <p className="text-sm text-gray-500 mt-1">v2 스키마 기준 편집 폼</p>
      </div>

      {/* 메타 영역 */}
      <section>
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">
          메타 정보
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <MetaField
            label="Name"
            value={snapshot.name}
            options={NAME_OPTIONS}
            onChange={(v) => handleMetaChange("name", v)}
            placeholder="작성자 이름"
          />
          <MetaField
            label="Domain"
            value={snapshot.domain}
            options={DOMAIN_OPTIONS}
            onChange={(v) => handleMetaChange("domain", v)}
          />
          <MetaField
            label="Project"
            value={snapshot.project}
            options={PROJECT_OPTIONS}
            onChange={(v) => handleMetaChange("project", v)}
          />
          <MetaField
            label="Module"
            value={snapshot.module}
            options={moduleOptions}
            onChange={(v) => handleMetaChange("module", v)}
          />
          <div className="col-span-2">
            <MetaField
              label="Feature"
              value={snapshot.feature}
              options={FEATURE_OPTIONS}
              onChange={(v) => handleMetaChange("feature", v)}
              placeholder="기능명 (예: Rich-note)"
            />
          </div>
        </div>
      </section>

      {/* Past Week */}
      <section>
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">
          Past Week
        </h3>

        <div className="space-y-6">
          {/* Tasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasks (진행률 포함)
            </label>
            <TaskEditor
              tasks={snapshot.pastWeek.tasks}
              onChange={(tasks) => handlePastWeekChange("tasks", tasks)}
            />
          </div>

          {/* Risk */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk
            </label>
            <RiskEditor
              risks={snapshot.pastWeek.risk}
              onChange={(risks) => handlePastWeekChange("risk", risks)}
            />
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Level
            </label>
            <div className="flex gap-2">
              {RISK_LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handlePastWeekChange(
                      "riskLevel",
                      option.value as 0 | 1 | 2 | 3
                    )
                  }
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    snapshot.pastWeek.riskLevel === option.value
                      ? option.value === 0
                        ? "bg-green-100 text-green-700 border-green-300"
                        : option.value === 1
                        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                        : option.value === 2
                        ? "bg-orange-100 text-orange-700 border-orange-300"
                        : "bg-red-100 text-red-700 border-red-300"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                  title={option.description}
                >
                  {option.value}: {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePastWeekChange("riskLevel", null)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  snapshot.pastWeek.riskLevel === null
                    ? "bg-gray-200 text-gray-700 border-gray-300"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                None
              </button>
            </div>
          </div>

          {/* Collaborators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collaborators
            </label>
            <CollaboratorEditor
              collaborators={snapshot.pastWeek.collaborators}
              onChange={(collabs) =>
                handlePastWeekChange("collaborators", collabs as Collaborator[])
              }
            />
          </div>
        </div>
      </section>

      {/* This Week */}
      <section>
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">
          This Week
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tasks (계획)
          </label>
          <ThisWeekTaskEditor
            tasks={snapshot.thisWeek.tasks}
            onChange={handleThisWeekChange}
          />
        </div>
      </section>
    </div>
  );
}
