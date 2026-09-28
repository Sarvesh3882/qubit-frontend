"use client";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "dark";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-1.5 font-medium leading-none " +
      "rounded transition-colors duration-100 " +
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] " +
      "disabled:opacity-40 disabled:cursor-not-allowed select-none";

    const variants: Record<string, string> = {
      primary:   "bg-[#4f46e5] text-white hover:bg-[#4338ca] active:bg-[#3730a3]",
      secondary: "bg-[#f0f0f2] text-[#111118] hover:bg-[#e4e4e7] active:bg-[#d4d4d8]",
      ghost:     "text-[#52525b] hover:bg-[#f0f0f2] hover:text-[#111118] active:bg-[#e4e4e7]",
      outline:   "border border-[#d4d4d8] text-[#111118] hover:bg-[#f0f0f2] active:bg-[#e4e4e7]",
      danger:    "bg-[#dc2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b]",
      dark:      "bg-[#21262d] text-[#e6edf3] border border-[#30363d] hover:bg-[#30363d] active:bg-[#388bfd1a]",
    };

    const sizes: Record<string, string> = {
      xs: "px-2 py-1   text-xs   h-6",
      sm: "px-2.5 py-1.5 text-xs h-7",
      md: "px-3.5 py-2   text-sm  h-8",
      lg: "px-5   py-2.5 text-sm  h-10",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin shrink-0"
            width="12" height="12"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
