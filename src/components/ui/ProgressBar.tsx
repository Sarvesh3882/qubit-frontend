import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  color?: "brand" | "success" | "warning";
  size?: "xs" | "sm" | "md";
  label?: boolean;
}

export default function ProgressBar({ value, className, color = "brand", size = "sm", label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const fills: Record<string, string> = {
    brand:   "bg-[#4f46e5]",
    success: "bg-[#16a34a]",
    warning: "bg-[#d97706]",
  };

  const heights: Record<string, string> = {
    xs: "h-0.5",
    sm: "h-1",
    md: "h-1.5",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-[#e4e4e7] rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", fills[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label && (
        <span className="text-[11px] text-[#71717a] tabular-nums w-8 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
