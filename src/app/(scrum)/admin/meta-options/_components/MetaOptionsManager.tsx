"use client";

import { useState, useEffect, useCallback } from "react";
import { MetaOptionsTable } from "./MetaOptionsTable";
import { MetaOptionFormDialog } from "./MetaOptionFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  listMetaOptionsAction,
  createMetaOptionAction,
  updateMetaOptionAction,
  deleteMetaOptionAction,
  toggleMetaOptionActiveAction,
} from "../_actions";
import type { SnapshotMetaOption } from "@/lib/data/snapshotMetaOptions";

const CATEGORIES = ["project", "module", "feature"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  project: "Project",
  module: "Module",
  feature: "Feature",
};

interface MetaOptionsManagerProps {
  workspaceId: string;
}

export function MetaOptionsManager({ workspaceId }: MetaOptionsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("project");
  const [options, setOptions] = useState<SnapshotMetaOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SnapshotMetaOption | null>(
    null
  );
  const [deletingOption, setDeletingOption] =
    useState<SnapshotMetaOption | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMetaOptionsAction(
        workspaceId,
        selectedCategory,
        searchTerm || undefined
      );
      setOptions(data);
    } catch (error) {
      console.error("Failed to load options:", error);
      showToast("옵션 목록을 불러오는데 실패했습니다", "error");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, selectedCategory, searchTerm]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = () => {
    setEditingOption(null);
    setIsFormOpen(true);
  };

  const getNextOrderIndex = () => {
    if (options.length === 0) return 0;
    return Math.max(...options.map((opt) => opt.order_index)) + 1;
  };

  const handleEdit = (option: SnapshotMetaOption) => {
    setEditingOption(option);
    setIsFormOpen(true);
  };

  const handleDelete = (option: SnapshotMetaOption) => {
    setDeletingOption(option);
  };

  const handleFormSubmit = async (formData: {
    value: string;
    label: string;
    description: string;
    order_index: number;
    is_active: boolean;
  }) => {
    try {
      if (editingOption) {
        const result = await updateMetaOptionAction(
          workspaceId,
          editingOption.id,
          {
            value: formData.value,
            label: formData.label || undefined,
            description: formData.description || undefined,
            order_index: formData.order_index,
            is_active: formData.is_active,
          }
        );

        if (result.success) {
          showToast("옵션이 수정되었습니다", "success");
          loadOptions();
        } else {
          showToast(result.error.message, "error");
        }
      } else {
        const result = await createMetaOptionAction(workspaceId, {
          category: selectedCategory,
          value: formData.value,
          label: formData.label || undefined,
          description: formData.description || undefined,
          order_index: formData.order_index,
          is_active: formData.is_active,
        });

        if (result.success) {
          showToast("옵션이 추가되었습니다", "success");
          loadOptions();
        } else {
          showToast(result.error.message, "error");
        }
      }
    } catch (error) {
      showToast("작업에 실패했습니다", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOption) return;

    try {
      const result = await deleteMetaOptionAction(
        workspaceId,
        deletingOption.id
      );

      if (result.success) {
        showToast("옵션이 삭제되었습니다", "success");
        loadOptions();
      } else {
        showToast(result.error.message, "error");
      }
    } catch (error) {
      showToast("삭제에 실패했습니다", "error");
    }
  };

  const handleToggleActive = async (
    option: SnapshotMetaOption,
    isActive: boolean
  ) => {
    try {
      const result = await toggleMetaOptionActiveAction(
        workspaceId,
        option.id,
        isActive
      );

      if (result.success) {
        showToast(
          isActive ? "옵션이 활성화되었습니다" : "옵션이 비활성화되었습니다",
          "success"
        );
        loadOptions();
      } else {
        showToast(result.error.message, "error");
      }
    } catch (error) {
      showToast("상태 변경에 실패했습니다", "error");
    }
  };

  const filteredOptions = searchTerm
    ? options.filter(
        (opt) =>
          opt.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.label?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 헤더 - GitHub 스타일 */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#24292f] mb-1">
            Snapshot Meta Options
          </h1>
          <p className="text-sm text-[#57606a]">
            스냅샷 메타 옵션을 관리하세요
          </p>
        </div>

        {/* 카테고리 탭 - GitHub 스타일 */}
        <div className="mb-6 border-b border-[#d0d7de]">
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSearchTerm("");
                }}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                  selectedCategory === category
                    ? "border-[#0969da] text-[#0969da]"
                    : "border-transparent text-[#57606a] hover:text-[#24292f] hover:border-[#d0d7de]"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 및 추가 버튼 - GitHub 스타일 */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by value or label..."
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
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0860ca] rounded-md transition-colors flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            추가
          </button>
        </div>

        {/* 테이블 - GitHub 스타일 */}
        <div className="bg-white rounded-md border border-[#d0d7de] overflow-hidden">
          <MetaOptionsTable
            options={filteredOptions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Form Dialog */}
      <MetaOptionFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        editingOption={editingOption}
        defaultOrderIndex={getNextOrderIndex()}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingOption}
        onClose={() => setDeletingOption(null)}
        onConfirm={handleConfirmDelete}
        title="옵션 삭제"
        message={`정말 "${deletingOption?.value}" 옵션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
      />

      {/* Toast - GitHub 스타일 */}
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
