import { TrendingUp, TrendingDown } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface StatCardProps {
  label: string;
  value: number | string;
  trend?: "up" | "down" | number;
  trendValue?: string;
  unit?: string;
  positiveIsGood?: boolean;
}

export default function StatCard({ label, value, trend, trendValue, unit, positiveIsGood = true }: StatCardProps) {
  const numericTrend = typeof trend === "number" ? trend : 0;
  const isUp = typeof trend === "number" ? numericTrend >= 0 : trend === "up";
  const isGood = typeof trend === "number"
    ? (positiveIsGood ? numericTrend >= 0 : numericTrend < 0)
    : isUp;
  const trendColor = isGood ? "var(--success)" : "var(--danger)";
  const displayTrendValue = trendValue ?? (typeof trend === "number" ? `${isUp ? "+" : ""}${numericTrend}%` : undefined);

  return (
    <GlassCard className="flex flex-col gap-3">
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-din text-3xl font-bold animate-number-flip" style={{ color: "var(--text-primary)" }}>
            {value}
          </span>
          {unit && (
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {unit}
            </span>
          )}
        </div>

        {trend !== undefined && displayTrendValue && (
          <div className="flex items-center gap-0.5 text-xs font-medium" style={{ color: trendColor }}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {displayTrendValue}
          </div>
        )}
      </div>

      <div
        className="h-6 rounded-sm overflow-hidden"
        style={{ background: "var(--accent-dim)" }}
      >
        <div
          className="h-full rounded-sm"
          style={{
            width: "60%",
            background: `linear-gradient(90deg, var(--accent-dim), var(--accent))`,
            opacity: 0.6,
          }}
        />
      </div>
    </GlassCard>
  );
}
