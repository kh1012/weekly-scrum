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
  const [deletingOption, setDeletingOption] = useState<SnapshotMetaOption | null>(
    null
  );
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
        const result = await updateMetaOptionAction(workspaceId, editingOption.id, {
          value: formData.value,
          label: formData.label || undefined,
          description: formData.description || undefined,
          order_index: formData.order_index,
          is_active: formData.is_active,
        });

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
      const result = await deleteMetaOptionAction(workspaceId, deletingOption.id);

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
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 md:mb-3">
            Snapshot{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Meta Options
            </span>
          </h1>
          <p className="text-sm md:text-lg text-gray-500 font-light">
            스냅샷 메타 옵션을 관리하세요
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6 border-b border-gray-200">
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
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 및 추가 버튼 */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by value or label..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            추가
          </button>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              로딩 중...
            </div>
          ) : (
            <MetaOptionsTable
              options={filteredOptions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <MetaOptionFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        editingOption={editingOption}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-scale-in">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
