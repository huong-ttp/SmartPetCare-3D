"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
  count?: number;
  gap?: number;
}

const ROUNDED_MAP = {
  sm: "rounded",
  md: "rounded-xl",
  lg: "rounded-2xl",
  full: "rounded-full",
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = "md",
  count = 1,
  gap = 8,
}) => {
  const items = Array.from({ length: count });

  return (
    <div className="flex flex-col" style={{ gap }}>
      {items.map((_, i) => (
        <div
          key={i}
          className={cn("skeleton", ROUNDED_MAP[rounded], className)}
          style={{
            width: width ?? "100%",
            height: height ?? "1rem",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

// ─── Preset skeletons ─────────────────────────────────────────────────────────

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 rounded-2xl bg-white border border-slate-100 space-y-4", className)}>
    <div className="flex items-center gap-3">
      <Skeleton rounded="full" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="60%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
    <Skeleton height={12} count={3} gap={6} />
  </div>
);

export default Skeleton;
