"use client";

import { useState, useEffect, useCallback } from "react";
import { MemberEditDialog } from "./MemberEditDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  listMembersAction,
  updateMemberAction,
  deleteMemberAction,
} from "../_actions";
import type { WorkspaceMember } from "@/lib/data/workspaceMembers";

interface MembersManagerProps {
  workspaceId: string;
  initialMembers: WorkspaceMember[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#ffebe9", text: "#cf222e" },
  manager: { bg: "#fbefff", text: "#8250df" },
  member: { bg: "#f6f8fa", text: "#57606a" },
};

export function MembersManager({
  workspaceId,
  initialMembers,
}: MembersManagerProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(
    null
  );
  const [deletingMember, setDeletingMember] =
    useState<WorkspaceMember | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMembersAction(workspaceId);
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
      showToast("멤버 목록을 불러오는데 실패했습니다", "error");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (member: WorkspaceMember) => {
    setEditingMember(member);
  };

  const handleDelete = (member: WorkspaceMember) => {
    setDeletingMember(member);
  };

  const handleEditSubmit = async (data: {
    role: string;
    displayName: string;
  }) => {
    if (!editingMember) return;

    try {
      const result = await updateMemberAction(workspaceId, editingMember.user_id, {
        role: data.role,
        displayName: data.displayName,
      });

      if (result.success) {
        showToast("멤버 정보가 수정되었습니다", "success");
        loadMembers();
      } else {
        showToast(result.error?.message || "수정 실패", "error");
      }
    } catch (error) {
      showToast("수정에 실패했습니다", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;

    try {
      const result = await deleteMemberAction(
        workspaceId,
        deletingMember.user_id
      );

      if (result.success) {
        showToast("멤버가 삭제되었습니다", "success");
        loadMembers();
      } else {
        showToast(result.error?.message || "삭제 실패", "error");
      }
    } catch (error) {
      showToast("삭제에 실패했습니다", "error");
    }
  };

  const filteredMembers = searchTerm
    ? members.filter(
        (m) =>
          m.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#24292f] mb-1">
            Workspace Members
          </h1>
          <p className="text-sm text-[#57606a]">
            워크스페이스 멤버를 관리하세요
          </p>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-[#d0d7de] rounded-md bg-[#f6f8fa] text-[#24292f] placeholder-[#57606a] focus:bg-white focus:border-[#0969da] focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57606a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-md border border-[#d0d7de] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                    멤버
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-[#57606a]">
                        <div className="w-4 h-4 border-2 border-[#0969da] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">불러오는 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <p className="text-sm text-[#57606a]">
                        {searchTerm
                          ? "검색 결과가 없습니다"
                          : "멤버가 없습니다"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.user_id}
                      className="hover:bg-[#f6f8fa] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#ddf4ff] flex items-center justify-center text-sm font-semibold text-[#0969da]">
                            {member.display_name?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-[#24292f]">
                            {member.display_name || "이름 없음"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#57606a]">
                          {member.email || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor:
                              ROLE_COLORS[member.role]?.bg || "#f6f8fa",
                            color:
                              ROLE_COLORS[member.role]?.text || "#57606a",
                          }}
                        >
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#57606a]">
                          {new Date(member.joined_at).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 text-[#57606a] hover:text-[#0969da] hover:bg-[#ddf4ff] rounded transition-colors"
                            title="수정"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 text-[#57606a] hover:text-[#cf222e] hover:bg-[#ffebe9] rounded transition-colors"
                            title="삭제"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 통계 */}
        <div className="mt-4 text-sm text-[#57606a]">
          전체 {members.length}명
          {searchTerm && ` (${filteredMembers.length}명 검색됨)`}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingMember && (
        <MemberEditDialog
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSubmit={handleEditSubmit}
          member={editingMember}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleConfirmDelete}
        title="멤버 삭제"
        message={`정말 "${deletingMember?.display_name || deletingMember?.email}"을(를) 워크스페이스에서 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-scale-in">
          <div
            className={`px-4 py-3 rounded-md border ${
              toast.type === "success"
                ? "bg-[#dafbe1] text-[#1f883d] border-[#1f883d]/20"
                : "bg-[#ffebe9] text-[#cf222e] border-[#ff8182]/20"
            }`}
            style={{
              boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
            }}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

