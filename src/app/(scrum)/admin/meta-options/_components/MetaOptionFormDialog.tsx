"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type {
  SnapshotMetaOption,
  MetaOptionCategory,
} from "@/lib/data/snapshotMetaOptions";

interface MetaOptionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  category: MetaOptionCategory;
  editingOption?: SnapshotMetaOption | null;
}

type FormData = {
  value: string;
  label: string;
  description: string;
  order_index: number;
  is_active: boolean;
};

export function MetaOptionFormDialog({
  isOpen,
  onClose,
  onSubmit,
  category,
  editingOption,
}: MetaOptionFormDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    value: "",
    label: "",
    description: "",
    order_index: 0,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && editingOption) {
      setFormData({
        value: editingOption.value,
        label: editingOption.label || "",
        description: editingOption.description || "",
        order_index: editingOption.order_index,
        is_active: editingOption.is_active,
      });
    } else if (isOpen) {
      setFormData({
        value: "",
        label: "",
        description: "",
        order_index: 0,
        is_active: true,
      });
    }
  }, [isOpen, editingOption]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingOption ? "옵션 수정" : "새 옵션 추가"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            카테고리: {category.toUpperCase()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 필수 입력 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              필수 정보
            </h3>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: MOTIIV"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                같은 카테고리 내에서 중복될 수 없습니다
              </p>
            </div>

            {/* Order Index */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Index <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                작은 숫자일수록 먼저 표시됩니다
              </p>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                활성화
              </label>
            </div>
          </div>

          {/* 선택 입력 */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              선택 정보
            </h3>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: MOTIIV - Home"
              />
              <p className="text-xs text-gray-500 mt-1">
                UI에 표시될 레이블 (선택사항)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="설명을 입력하세요"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "처리중..."
                : editingOption
                ? "수정하기"
                : "추가하기"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

