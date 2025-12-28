"use client";

import { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import type { WorkspaceMember } from "@/lib/data/workspaceMembers";

interface MemberEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { role: string; displayName: string }) => Promise<void>;
  member: WorkspaceMember;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
];

export function MemberEditDialog({
  isOpen,
  onClose,
  onSubmit,
  member,
}: MemberEditDialogProps) {
  const [role, setRole] = useState(member.role);
  const [displayName, setDisplayName] = useState(member.display_name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const roleDropdownId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRole(member.role);
      setDisplayName(member.display_name || "");
      setIsRoleDropdownOpen(false);
    }
  }, [isOpen, member]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isRoleDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (roleButtonRef.current && !roleButtonRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById(`dropdown-${roleDropdownId}`);
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setIsRoleDropdownOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRoleDropdownOpen, roleDropdownId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({ role, displayName });
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedRole = ROLE_OPTIONS.find((opt) => opt.value === role);

  // Role dropdown content (portal)
  const roleDropdownContent = isRoleDropdownOpen && roleButtonRef.current ? (
    <div
      id={`dropdown-${roleDropdownId}`}
      style={{
        position: "fixed",
        top: `${roleButtonRef.current.getBoundingClientRect().bottom + 4}px`,
        left: `${roleButtonRef.current.getBoundingClientRect().left}px`,
        width: `${roleButtonRef.current.getBoundingClientRect().width}px`,
        zIndex: 9999,
      }}
      className="bg-white border border-[#d0d7de] rounded-md shadow-lg max-h-60 overflow-y-auto"
    >
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setRole(option.value);
            setIsRoleDropdownOpen(false);
          }}
          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
            option.value === role
              ? "bg-[#ddf4ff] text-[#0969da] font-medium"
              : "text-[#24292f] hover:bg-[#f6f8fa]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d0d7de]">
          <h2 className="text-xl font-semibold text-[#24292f]">멤버 정보 수정</h2>
          <p className="text-sm text-[#57606a] mt-1">
            멤버의 권한과 표시 이름을 수정합니다
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              이메일
            </label>
            <input
              type="text"
              value={member.email || ""}
              disabled
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-[#f6f8fa] text-[#57606a] cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              표시 이름 *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="표시 이름을 입력하세요"
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              권한 *
            </label>
            <button
              type="button"
              ref={roleButtonRef}
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da] flex items-center justify-between"
            >
              <span className="text-[#24292f]">{selectedRole?.label || "선택"}</span>
              <svg
                className={`w-4 h-4 text-[#57606a] transition-transform ${
                  isRoleDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <p className="text-xs text-[#57606a] mt-1">
              Admin: 모든 권한 / Manager: 관리 권한 / Member: 일반 사용자
            </p>
          </div>

          {/* User ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              User ID
            </label>
            <input
              type="text"
              value={member.user_id}
              disabled
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-[#f6f8fa] text-[#57606a] font-mono text-xs cursor-not-allowed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#d0d7de] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-[#24292f] bg-white hover:bg-[#f6f8fa] border border-[#d0d7de] rounded-md transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0550ae] rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* Role Dropdown Portal */}
      {mounted && createPortal(roleDropdownContent, document.body)}
    </div>
  );
}

