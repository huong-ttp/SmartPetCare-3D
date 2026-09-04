"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const PLACEMENT_MAP = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = "top",
  className,
}) => {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={cn(
          "absolute z-[100] whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium",
          "bg-slate-900 text-white shadow-sm",
          "opacity-0 pointer-events-none scale-95 transition-all duration-200",
          "group-hover:opacity-100 group-hover:scale-100",
          PLACEMENT_MAP[placement],
          className
        )}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
