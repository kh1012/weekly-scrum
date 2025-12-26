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
  defaultOrderIndex: number;
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
  defaultOrderIndex,
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
  const [isOptionalExpanded, setIsOptionalExpanded] = useState(false);

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
      setIsOptionalExpanded(true);
    } else if (isOpen) {
      setFormData({
        value: "",
        label: "",
        description: "",
        order_index: defaultOrderIndex,
        is_active: true,
      });
      setIsOptionalExpanded(false);
    }
  }, [isOpen, editingOption, defaultOrderIndex]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingOption ? "옵션 수정" : "새 옵션 추가"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                카테고리: <span className="font-semibold text-blue-600">{category.toUpperCase()}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

          {/* 선택 입력 (Collapsible) */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOptionalExpanded(!isOptionalExpanded)}
              className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isOptionalExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                선택 정보
              </h3>
              <span className="text-xs text-gray-500">
                {isOptionalExpanded ? "접기" : "펼치기"}
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOptionalExpanded ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    placeholder="설명을 입력하세요"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  처리중...
                </>
              ) : editingOption ? (
                "수정하기"
              ) : (
                "추가하기"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

