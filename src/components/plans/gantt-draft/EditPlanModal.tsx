/**
 * Edit Plan Modal
 * - 기존 bar의 상세 정보 수정
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, CalendarIcon, UserIcon, TrashIcon, LinkIcon, PlusIcon, ChevronDownIcon } from "@/components/common/Icons";
import type { PlanStatus, DraftAssignee, DraftBar, PlanLink } from "./types";
import type { AssigneeRole } from "@/lib/data/plans";
import type { WorkspaceMemberOption } from "./CreatePlanModal";

const STAGES = [
  "컨셉 기획",
  "상세 기획",
  "UI 디자인",
  "FE 개발",
  "BE 개발",
  "QA 검증",
];

const STATUSES: PlanStatus[] = ["진행중", "완료", "보류", "취소"];

const ROLES: { value: AssigneeRole; label: string; color: string }[] = [
  { value: "planner", label: "기획", color: "#f59e0b" },
  { value: "designer", label: "디자인", color: "#ec4899" },
  { value: "fe", label: "FE", color: "#3b82f6" },
  { value: "be", label: "BE", color: "#10b981" },
  { value: "qa", label: "QA", color: "#8b5cf6" },
];

/**
 * BasicRole(profiles.basic_role) → AssigneeRole 매핑
 */
function mapBasicRoleToAssigneeRole(
  basicRole: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null | undefined
): AssigneeRole | null {
  if (!basicRole) return null;
  const mapping: Record<string, AssigneeRole> = {
    PLANNING: "planner",
    FE: "fe",
    BE: "be",
    DESIGN: "designer",
    QA: "qa",
  };
  return mapping[basicRole] || null;
}

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    stage: string;
    status: PlanStatus;
    assignees: DraftAssignee[];
    description?: string;
    links?: PlanLink[];
  }) => void;
  onDelete: () => void;
  bar: DraftBar | null;
  members?: WorkspaceMemberOption[];
}

export function EditPlanModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  bar,
  members = [],
}: EditPlanModalProps) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("컨셉 기획");
  const [status, setStatus] = useState<PlanStatus>("진행중");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AssigneeRole>("planner");
  const [isRoleManuallyEdited, setIsRoleManuallyEdited] = useState(false);
  const [originalAssigneeId, setOriginalAssigneeId] = useState<string>(""); // 초기 담당자 ID
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<PlanLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // 섹션 접기/펼치기 상태
  const [isRequiredExpanded, setIsRequiredExpanded] = useState(true);
  const [isOptionalExpanded, setIsOptionalExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeSearchRef = useRef<HTMLInputElement>(null);

  // bar가 변경될 때 초기값 설정
  useEffect(() => {
    if (isOpen && bar) {
      setTitle(bar.title);
      setStage(bar.stage);
      setStatus(bar.status);
      setDescription(bar.description || "");
      setLinks(bar.links || []);
      setNewLinkUrl("");
      setNewLinkLabel("");
      setIsAssigneeDropdownOpen(false);
      
      // 첫 번째 담당자 정보
      if (bar.assignees && bar.assignees.length > 0) {
        setSelectedAssignee(bar.assignees[0].userId);
        setSelectedRole(bar.assignees[0].role);
        setOriginalAssigneeId(bar.assignees[0].userId); // 초기 담당자 ID 저장
        setIsRoleManuallyEdited(true); // 기존 담당자는 role 변경 금지
      } else {
        setSelectedAssignee("");
        setSelectedRole("planner");
        setOriginalAssigneeId("");
        setIsRoleManuallyEdited(false);
      }
      
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, bar]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
        setAssigneeSearchQuery("");
        setHighlightedIndex(0);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 드롭다운 열릴 때 검색창 포커스
  useEffect(() => {
    if (isAssigneeDropdownOpen) {
      setTimeout(() => assigneeSearchRef.current?.focus(), 50);
    } else {
      setAssigneeSearchQuery("");
      setHighlightedIndex(0);
    }
  }, [isAssigneeDropdownOpen]);

  // 검색 쿼리로 멤버 필터링
  const filteredMembers = members.filter((member) => {
    if (!assigneeSearchQuery.trim()) return true;
    const query = assigneeSearchQuery.toLowerCase();
    const displayName = (member.displayName || "").toLowerCase();
    const email = (member.email || "").toLowerCase();
    return displayName.includes(query) || email.includes(query);
  });

  /**
   * 담당자 선택 핸들러: 새 담당자인 경우 basic_role 기반 role 자동 설정
   */
  const handleSelectAssignee = (userId: string) => {
    setSelectedAssignee(userId);
    
    // 기존 담당자와 다른 사람을 선택한 경우 (새 담당자로 간주)
    if (userId !== originalAssigneeId) {
      setIsRoleManuallyEdited(false); // 새 담당자이므로 자동 설정 가능
      
      if (userId) {
        const member = members.find((m) => m.userId === userId);
        if (member?.basicRole) {
          const mappedRole = mapBasicRoleToAssigneeRole(member.basicRole);
          if (mappedRole) {
            setSelectedRole(mappedRole);
          }
        }
      }
    }
  };

  /**
   * Role 수동 변경 핸들러
   */
  const handleRoleChange = (role: AssigneeRole) => {
    setSelectedRole(role);
    setIsRoleManuallyEdited(true);
  };

  // 키보드 네비게이션
  const handleAssigneeKeyDown = (e: React.KeyboardEvent) => {
    if (!isAssigneeDropdownOpen) return;

    const hasSearchQuery = assigneeSearchQuery.trim().length > 0;
    const totalOptions = hasSearchQuery ? filteredMembers.length : filteredMembers.length + 1; // 검색어 있으면 "선택 안함" 제외

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case "Enter":
        e.preventDefault();
        if (hasSearchQuery) {
          // 검색어 있을 때: 바로 멤버 선택
          const selectedMember = filteredMembers[highlightedIndex];
          if (selectedMember) {
            handleSelectAssignee(selectedMember.userId);
            setIsAssigneeDropdownOpen(false);
          }
        } else {
          // 검색어 없을 때: 0은 "선택 안함", 1부터 멤버
          if (highlightedIndex === 0) {
            handleSelectAssignee("");
            setIsAssigneeDropdownOpen(false);
          } else {
            const selectedMember = filteredMembers[highlightedIndex - 1];
            if (selectedMember) {
              handleSelectAssignee(selectedMember.userId);
              setIsAssigneeDropdownOpen(false);
            }
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsAssigneeDropdownOpen(false);
        break;
    }
  };

  // 링크 추가
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    setLinks([...links, { url: newLinkUrl.trim(), label: newLinkLabel.trim() || undefined }]);
    setNewLinkUrl("");
    setNewLinkLabel("");
  };

  // 링크 삭제
  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // 담당자 생성
    const assignees: DraftAssignee[] = [];
    if (selectedAssignee) {
      const member = members.find((m) => m.userId === selectedAssignee);
      assignees.push({
        userId: selectedAssignee,
        role: selectedRole,
        displayName: member?.displayName,
      });
    }

    onSave({
      title: title.trim(),
      stage,
      status,
      assignees,
      description: description.trim() || undefined,
      links: links.length > 0 ? links : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleDelete = () => {
    const confirmed = confirm("이 계획을 삭제하시겠습니까?");
    if (confirmed) {
      onDelete();
    }
  };

  const selectedMember = members.find((m) => m.userId === selectedAssignee);

  if (!isOpen || !bar) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* 배경 - Airbnb 스타일: 부드러운 블러 효과 */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0, 0, 0, 0.4)" }}
        onClick={onClose}
      />

      {/* 모달 - Airbnb 스타일 */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        style={{
          background: "white",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* 헤더 - 그라디언트 배경 */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            계획 수정
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-all duration-150 active:scale-95"
              title="삭제"
            >
              <TrashIcon className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-150 active:scale-95"
            >
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 기간 정보 배너 */}
        <div
          className="shrink-0 px-5 py-3 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">기간</div>
            <div className="text-sm font-semibold text-gray-800">
              {bar.startDate} ~ {bar.endDate}
            </div>
          </div>
        </div>

        {/* 폼 - 스크롤 가능 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[60vh]">
          {/* 필수 정보 섹션 */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsRequiredExpanded(!isRequiredExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700">
                필수 정보 <span className="text-red-500">*</span>
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isRequiredExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isRequiredExpanded && (
              <div className="p-4 space-y-4 bg-white">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="계획 제목을 입력하세요"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#1e293b",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
              autoComplete="off"
            />
          </div>

                {/* 스테이지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    스테이지
                  </label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 active:scale-95 ${
                    stage === s
                      ? "text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{
                    background: stage === s 
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" 
                      : "#f1f5f9",
                  }}
                >
                  {s}
                </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 선택사항 섹션 */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsOptionalExpanded(!isOptionalExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-500">
              선택사항 (담당자, 설명, 링크)
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOptionalExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOptionalExpanded && (
            <div className="p-4 space-y-4 bg-white">
              {/* 담당자 - 커스텀 드롭다운 */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4" />
                  담당자
                </label>
            <div className="space-y-3">
              {/* 커스텀 담당자 드롭다운 */}
              <div className="relative" ref={assigneeDropdownRef} onKeyDown={handleAssigneeKeyDown}>
                <button
                  type="button"
                  onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: selectedMember ? "rgba(59, 130, 246, 0.08)" : "#f8fafc",
                    border: selectedMember ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #e2e8f0",
                    color: selectedMember ? "#1e40af" : "#64748b",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {selectedMember ? (
                      <>
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold"
                        >
                          {selectedMember.displayName?.charAt(0) || selectedMember.email?.charAt(0) || "?"}
                        </span>
                        <span className="font-medium text-gray-900">
                          {selectedMember.displayName || selectedMember.email || selectedMember.userId}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                        </span>
                        <span>담당자 선택</span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${isAssigneeDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 드롭다운 목록 */}
                {isAssigneeDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                    style={{
                      background: "white",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* 검색 인풋 */}
                    <div className="p-3 border-b border-gray-100">
                      <input
                        ref={assigneeSearchRef}
                        type="text"
                        value={assigneeSearchQuery}
                        onChange={(e) => {
                          setAssigneeSearchQuery(e.target.value);
                          setHighlightedIndex(0);
                        }}
                        placeholder="이름 또는 이메일로 검색..."
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#1e293b",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    {/* 옵션 목록 */}
                    <div className="max-h-60 overflow-y-auto">
                      {/* 선택 해제 옵션 - 검색어 없을 때만 표시 */}
                      {!assigneeSearchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectAssignee("");
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            highlightedIndex === 0
                              ? "bg-blue-50"
                              : !selectedAssignee
                              ? "bg-gray-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                            <XIcon className="w-4 h-4 text-gray-400" />
                          </span>
                          <span className="text-gray-500">선택 안함</span>
                        </button>
                      )}

                      {/* 멤버 목록 */}
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member, index) => {
                          const hasSearchQuery = assigneeSearchQuery.trim().length > 0;
                          const effectiveIndex = hasSearchQuery ? index : index + 1; // 검색어 있으면 0부터, 없으면 1부터
                          
                          return (
                            <button
                              key={member.userId}
                              type="button"
                              onClick={() => {
                                handleSelectAssignee(member.userId);
                                setIsAssigneeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                                highlightedIndex === effectiveIndex
                                  ? "bg-blue-50"
                                  : member.userId === selectedAssignee
                                  ? "bg-blue-50"
                                  : "hover:bg-gray-50"
                              }`}
                          >
                            <span
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                              style={{
                                background: member.userId === selectedAssignee
                                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                                  : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                              }}
                            >
                              {member.displayName?.charAt(0) || member.email?.charAt(0) || "?"}
                            </span>
                            <div className="flex-1 text-left min-w-0">
                              <div
                                className="font-medium truncate"
                                style={{ color: member.userId === selectedAssignee ? "#1e40af" : "#1e293b" }}
                              >
                                {member.displayName || member.email || member.userId}
                              </div>
                              {member.email && member.displayName && (
                                <div className="text-xs text-gray-400 truncate">{member.email}</div>
                              )}
                            </div>
                            {member.userId === selectedAssignee && (
                              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                          검색 결과가 없습니다
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 역할 선택 - 담당자 선택 시에만 활성화 */}
              <div className="flex gap-1.5">
                {ROLES.map((role) => {
                  const isDisabled = !selectedAssignee;
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => !isDisabled && handleRoleChange(role.value)}
                      disabled={isDisabled}
                      className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                        isDisabled 
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "text-white shadow-md active:scale-95"
                            : "hover:opacity-80 active:scale-95"
                      }`}
                      style={{
                        background: isDisabled 
                          ? "#e5e7eb" 
                          : isSelected 
                            ? role.color 
                            : `${role.color}15`,
                        color: isDisabled 
                          ? "#9ca3af" 
                          : isSelected 
                            ? "white" 
                            : role.color,
                        boxShadow: isSelected && !isDisabled
                          ? `0 0 0 2px white, 0 0 0 4px ${role.color}`
                          : undefined,
                      }}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 선택된 담당자 표시 */}
            {selectedAssignee && selectedMember && (
              <div 
                className="mt-3 flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "#f8fafc" }}
              >
                <span
                  className="px-2.5 py-1 text-xs font-bold rounded-md text-white"
                  style={{
                    background: ROLES.find((r) => r.value === selectedRole)?.color || "#6b7280",
                  }}
                >
                  {ROLES.find((r) => r.value === selectedRole)?.label}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {selectedMember.displayName || selectedMember.email}
                </span>
              </div>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 계획에 대한 상세 설명을 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none resize-none"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#1e293b",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* 링크 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4" />
                관련 링크
              </label>

              {/* 기존 링크 목록 */}
              {links.length > 0 && (
                <div className="space-y-2 mb-3">
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-lg group"
                      style={{ background: "#f8fafc" }}
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate block"
                        >
                          {link.label || link.url}
                        </a>
                        {link.label && (
                          <span className="text-xs text-gray-400 truncate block">
                            {link.url}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 링크 추가 */}
              <div className="space-y-2">
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#1e293b",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    placeholder="링크 설명 (선택)"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#1e293b",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLink();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!newLinkUrl.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    style={{
                      background: newLinkUrl.trim() ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#e5e7eb",
                      color: newLinkUrl.trim() ? "white" : "#9ca3af",
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    추가
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 active:scale-95 hover:bg-gray-100"
              style={{ color: "#64748b" }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              }}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
