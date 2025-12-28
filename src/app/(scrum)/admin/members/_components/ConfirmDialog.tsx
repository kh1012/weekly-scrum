"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-[#24292f]">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 border-t border-b border-[#d0d7de]">
          <p className="text-sm text-[#57606a]">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#24292f] bg-white hover:bg-[#f6f8fa] border border-[#d0d7de] rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#cf222e] hover:bg-[#a40e26] rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

