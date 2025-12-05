interface StatCardProps {
  value: number | string;
  label: string;
  color?: string;
  highlight?: boolean;
}

export function StatCard({ value, label, color, highlight }: StatCardProps) {
  return (
    <div className={`notion-card p-4 ${highlight ? "ring-2 ring-offset-1 ring-orange-400" : ""}`}>
      <div className="text-2xl font-bold" style={{ color: color || "var(--notion-text)" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

