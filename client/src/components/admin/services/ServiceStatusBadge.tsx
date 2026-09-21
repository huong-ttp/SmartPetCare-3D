"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface ServiceStatusBadgeProps {
  isActive: boolean;
  className?: string;
  showDot?: boolean;
}

export const ServiceStatusBadge: React.FC<ServiceStatusBadgeProps> = ({
  isActive,
  className,
  showDot = true,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
          : "bg-slate-100 text-slate-600 border-slate-200",
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isActive ? "bg-emerald-500" : "bg-slate-400"
            )}
          />
        </span>
      )}
      <span>{isActive ? "Hoạt động" : "Tạm dừng"}</span>
    </span>
  );
};

export default ServiceStatusBadge;
