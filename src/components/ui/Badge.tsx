import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "blue";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-[#f0f0f2] text-[#52525b] border-[#e4e4e7]",
    success: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]",
    warning: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
    error:   "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
    blue:    "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded border leading-none",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
