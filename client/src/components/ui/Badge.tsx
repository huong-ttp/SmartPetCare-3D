"use client";

import React from "react";
import { cn } from "@/utils/cn";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary:   "bg-[#0EA5B7]/15 text-[#0b8fa0] border border-[#0EA5B7]/30",
  secondary: "bg-[#22C55E]/15 text-[#16a34a] border border-[#22C55E]/30",
  accent:    "bg-[#FB923C]/15 text-[#ea580c] border border-[#FB923C]/30",
  success:   "bg-green-100 text-green-700 border border-green-200",
  warning:   "bg-amber-100 text-amber-700 border border-amber-200",
  error:     "bg-red-100 text-red-600 border border-red-200",
  info:      "bg-sky-100 text-sky-700 border border-sky-200",
  neutral:   "bg-slate-100 text-slate-600 border border-slate-200",
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  primary:   "bg-[#0EA5B7]",
  secondary: "bg-[#22C55E]",
  accent:    "bg-[#FB923C]",
  success:   "bg-green-500",
  warning:   "bg-amber-500",
  error:     "bg-red-500",
  info:      "bg-sky-500",
  neutral:   "bg-slate-400",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "sm",
  dot = false,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", DOT_COLORS[variant])} />
      )}
      {children}
    </span>
  );
};

export default Badge;
