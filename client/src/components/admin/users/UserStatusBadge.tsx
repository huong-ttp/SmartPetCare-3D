"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface UserStatusBadgeProps {
  isActive: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  isActive,
  size = "sm",
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          isActive ? "bg-emerald-500" : "bg-slate-400"
        )}
      />
      <span>{isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
    </span>
  );
};

export default UserStatusBadge;
