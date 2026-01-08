/**
 * GitHub 스타일 컴팩트 확인 모달
 */

"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  variant = "warning",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "⚠️",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: "⚠️",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      icon: "ℹ️",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const style = variantStyles[variant];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-xl max-w-md w-full border border-[#d0d7de]">
          {/* Header */}
          <div className="flex items-start gap-3 px-4 py-3 border-b border-[#d0d7de]">
            <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-xl">{style.icon}</span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-base font-semibold text-[#24292f]">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#57606a] hover:text-[#24292f] flex-shrink-0"
              disabled={loading}
            >
              <svg
                className="w-5 h-5"
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

          {/* Body */}
          <div className="px-4 py-3">
            <p className="text-sm text-[#57606a] whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 bg-[#f6f8fa] border-t border-[#d0d7de] rounded-b-md">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-[#24292f] bg-white border border-[#d0d7de] rounded-md hover:bg-[#f6f8fa] transition-colors"
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${style.button}`}
              disabled={loading}
            >
              {loading ? "처리 중..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

