export interface ReleaseChange {
  type: "feat" | "fix" | "improve" | "style" | "refactor";
  description: string;
}

export interface Release {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: ReleaseChange[];
}

export const CHANGE_TYPE_LABELS: Record<ReleaseChange["type"], { label: string; color: string; bg: string }> = {
  feat: { label: "기능", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
  fix: { label: "수정", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  improve: { label: "개선", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
  style: { label: "스타일", color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)" },
  refactor: { label: "리팩토링", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
};

