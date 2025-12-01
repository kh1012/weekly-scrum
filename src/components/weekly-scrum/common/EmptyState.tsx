"use client";

interface EmptyStateProps {
  message?: string;
  submessage?: string;
}

export function EmptyState({
  message = "데이터가 없습니다",
  submessage,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white rounded-md border border-[#d0d7de]">
      <svg
        className="w-12 h-12 mx-auto mb-3 text-[#8c959f]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <p className="text-[#656d76] font-medium">{message}</p>
      {submessage && (
        <p className="text-sm text-[#8c959f] mt-1">{submessage}</p>
      )}
    </div>
  );
}

