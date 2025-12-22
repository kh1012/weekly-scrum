/**
 * 새 Row(기능) 추가 모달
 * - 프로젝트/모듈/기능 선택
 * - snapshotMetaOptions 기반 자동완성
 * - 키보드 네비게이션 지원
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { XIcon, FolderIcon, CubeIcon, CodeIcon } from "@/components/common/Icons";
import {
  PROJECT_OPTIONS,
  MODULE_OPTIONS,
  ALL_MODULE_OPTIONS,
  FEATURE_OPTIONS,
} from "@/lib/snapshotMetaOptions";

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: string, module: string, feature: string) => void;
  existingProjects?: string[];
  existingModules?: string[];
}

export function AddRowModal({
  isOpen,
  onClose,
  onAdd,
  existingProjects = [],
  existingModules = [],
}: AddRowModalProps) {
  const [project, setProject] = useState("");
  const [module, setModule] = useState("");
  const [feature, setFeature] = useState("");

  // 드롭다운 상태
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);

  // 선택 인덱스
  const [projectIndex, setProjectIndex] = useState(-1);
  const [moduleIndex, setModuleIndex] = useState(-1);
  const [featureIndex, setFeatureIndex] = useState(-1);

  // Refs
  const projectInputRef = useRef<HTMLInputElement>(null);
  const moduleInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);

  // 프로젝트 옵션: snapshotMetaOptions + 기존 프로젝트
  const projectOptions = useMemo(() => {
    const set = new Set([...PROJECT_OPTIONS, ...existingProjects]);
    const query = project.toLowerCase();
    return Array.from(set).filter((p) => p.toLowerCase().includes(query));
  }, [existingProjects, project]);

  // 모듈 옵션: 선택된 프로젝트에 따른 옵션 + 기존 모듈
  const moduleOptions = useMemo(() => {
    // 프로젝트별 모듈이 있고 비어있지 않으면 사용, 아니면 전체 모듈 사용
    const projectModules =
      project && MODULE_OPTIONS[project] && MODULE_OPTIONS[project].length > 0
        ? MODULE_OPTIONS[project]
        : ALL_MODULE_OPTIONS;
    const set = new Set([...projectModules, ...existingModules]);
    const query = module.toLowerCase();
    return Array.from(set).filter((m) => m.toLowerCase().includes(query));
  }, [project, existingModules, module]);

  // 기능 옵션
  const featureOptions = useMemo(() => {
    const query = feature.toLowerCase();
    return [...FEATURE_OPTIONS].filter((f) => f.toLowerCase().includes(query));
  }, [feature]);

  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 모달 열릴 때 초기화 및 프로젝트 필드 포커스
  useEffect(() => {
    if (isOpen) {
      setProject("");
      setModule("");
      setFeature("");
      setShowProjectDropdown(false);
      setShowModuleDropdown(false);
      setShowFeatureDropdown(false);
      setProjectIndex(-1);
      setModuleIndex(-1);
      setFeatureIndex(-1);
      // 약간의 딜레이 후 포커스 (모달 애니메이션 고려)
      setTimeout(() => {
        projectInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!project.trim() || !module.trim() || !feature.trim()) return;

      onAdd(project.trim(), module.trim(), feature.trim());
      onClose();
    },
    [project, module, feature, onAdd, onClose]
  );

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      options: string[],
      index: number,
      setIndex: (i: number) => void,
      setValue: (v: string) => void,
      showDropdown: boolean,
      setShowDropdown: (show: boolean) => void,
      nextRef?: React.RefObject<HTMLInputElement | null>
    ) => {
      if (!showDropdown && e.key === "ArrowDown") {
        e.preventDefault();
        setShowDropdown(true);
        setIndex(0);
        return;
      }

      if (showDropdown) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setIndex(Math.min(index + 1, options.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setIndex(Math.max(index - 1, 0));
        } else if (e.key === "Enter" && index >= 0 && index < options.length) {
          e.preventDefault();
          setValue(options[index]);
          setShowDropdown(false);
          setIndex(-1);
          // 다음 필드로 포커스 이동
          setTimeout(() => nextRef?.current?.focus(), 50);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowDropdown(false);
          setIndex(-1);
        } else if (e.key === "Tab") {
          // Tab 시 현재 선택된 항목 적용
          if (index >= 0 && index < options.length) {
            setValue(options[index]);
          }
          setShowDropdown(false);
          setIndex(-1);
        }
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--notion-bg)" }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "var(--notion-text)" }}>
            새 기능 추가
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XIcon className="w-5 h-5" style={{ color: "var(--notion-text-muted)" }} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 프로젝트 */}
          <div className="relative">
            <label
              className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
              style={{ color: "var(--notion-text)" }}
            >
              <FolderIcon className="w-4 h-4" style={{ color: "#f59e0b" }} />
              프로젝트
            </label>
            <input
              ref={projectInputRef}
              type="text"
              value={project}
              onChange={(e) => {
                setProject(e.target.value);
                if (e.target.value.trim()) {
                  setShowProjectDropdown(true);
                  setProjectIndex(0);
                }
              }}
              onFocus={() => {
                // focus만으로는 드롭다운을 표시하지 않음
                if (project.trim()) {
                  setShowProjectDropdown(true);
                  setProjectIndex(projectOptions.length > 0 ? 0 : -1);
                }
              }}
              onBlur={() => setTimeout(() => setShowProjectDropdown(false), 150)}
              onKeyDown={(e) =>
                handleKeyDown(
                  e,
                  projectOptions,
                  projectIndex,
                  setProjectIndex,
                  setProject,
                  showProjectDropdown,
                  setShowProjectDropdown,
                  moduleInputRef
                )
              }
              placeholder="예: MOTIIV"
              className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: showProjectDropdown ? "#3b82f6" : "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              autoComplete="off"
              required
            />
            {/* 프로젝트 드롭다운 */}
            {showProjectDropdown && projectOptions.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 py-1 rounded-lg border shadow-lg max-h-40 overflow-y-auto"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                }}
              >
                {projectOptions.map((p, idx) => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setProject(p);
                      setShowProjectDropdown(false);
                      setTimeout(() => moduleInputRef.current?.focus(), 10);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-blue-500/10 ${
                      idx === projectIndex ? "bg-blue-500/10" : ""
                    }`}
                    style={{ color: "var(--notion-text)" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 모듈 */}
          <div className="relative">
            <label
              className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
              style={{ color: "var(--notion-text)" }}
            >
              <CubeIcon className="w-4 h-4" style={{ color: "#8b5cf6" }} />
              모듈
            </label>
            <input
              ref={moduleInputRef}
              type="text"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                if (e.target.value.trim()) {
                  setShowModuleDropdown(true);
                  setModuleIndex(0);
                }
              }}
              onFocus={() => {
                // focus만으로는 드롭다운을 표시하지 않음
                if (module.trim()) {
                  setShowModuleDropdown(true);
                  setModuleIndex(moduleOptions.length > 0 ? 0 : -1);
                }
              }}
              onBlur={() => setTimeout(() => setShowModuleDropdown(false), 150)}
              onKeyDown={(e) =>
                handleKeyDown(
                  e,
                  moduleOptions,
                  moduleIndex,
                  setModuleIndex,
                  setModule,
                  showModuleDropdown,
                  setShowModuleDropdown,
                  featureInputRef
                )
              }
              placeholder="예: Spreadsheet"
              className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: showModuleDropdown ? "#3b82f6" : "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              autoComplete="off"
              required
            />
            {/* 모듈 드롭다운 */}
            {showModuleDropdown && moduleOptions.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 py-1 rounded-lg border shadow-lg max-h-40 overflow-y-auto"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                }}
              >
                {moduleOptions.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setModule(m);
                      setShowModuleDropdown(false);
                      setTimeout(() => featureInputRef.current?.focus(), 10);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-blue-500/10 ${
                      idx === moduleIndex ? "bg-blue-500/10" : ""
                    }`}
                    style={{ color: "var(--notion-text)" }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 기능 */}
          <div className="relative">
            <label
              className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
              style={{ color: "var(--notion-text)" }}
            >
              <CodeIcon className="w-4 h-4" style={{ color: "#10b981" }} />
              기능
            </label>
            <input
              ref={featureInputRef}
              type="text"
              value={feature}
              onChange={(e) => {
                setFeature(e.target.value);
                if (e.target.value.trim()) {
                  setShowFeatureDropdown(true);
                  setFeatureIndex(0);
                }
              }}
              onFocus={() => {
                // focus만으로는 드롭다운을 표시하지 않음
                if (feature.trim()) {
                  setShowFeatureDropdown(true);
                  setFeatureIndex(featureOptions.length > 0 ? 0 : -1);
                }
              }}
              onBlur={() => setTimeout(() => setShowFeatureDropdown(false), 150)}
              onKeyDown={(e) => {
                handleKeyDown(
                  e,
                  featureOptions,
                  featureIndex,
                  setFeatureIndex,
                  setFeature,
                  showFeatureDropdown,
                  setShowFeatureDropdown,
                  undefined
                );
                // Enter로 폼 제출
                if (e.key === "Enter" && !showFeatureDropdown && feature.trim()) {
                  handleSubmit(e);
                }
              }}
              placeholder="예: Rich Note"
              className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: showFeatureDropdown ? "#3b82f6" : "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              autoComplete="off"
              required
            />
            {/* 기능 드롭다운 */}
            {showFeatureDropdown && featureOptions.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 py-1 rounded-lg border shadow-lg max-h-40 overflow-y-auto"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                }}
              >
                {featureOptions.map((f, idx) => (
                  <button
                    key={f}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFeature(f);
                      setShowFeatureDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-blue-500/10 ${
                      idx === featureIndex ? "bg-blue-500/10" : ""
                    }`}
                    style={{ color: "var(--notion-text)" }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 힌트 */}
          <p
            className="text-xs"
            style={{ color: "var(--notion-text-muted)" }}
          >
            💡 방향키(↓)로 목록 탐색, Enter로 선택, Tab으로 다음 필드 이동
          </p>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: "var(--notion-bg-tertiary)",
                color: "var(--notion-text)",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!project.trim() || !module.trim() || !feature.trim()}
              className="flex-1 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#3b82f6",
                color: "white",
              }}
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
