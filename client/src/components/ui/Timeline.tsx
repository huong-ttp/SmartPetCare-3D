"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface TimelineItem {
  id: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  time?: string | React.ReactNode;
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "neutral";
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const COLOR_MAP = {
  primary: "bg-[#0EA5B7] border-[#0EA5B7]/30 text-white",
  secondary: "bg-[#22C55E] border-[#22C55E]/30 text-white",
  accent: "bg-[#FB923C] border-[#FB923C]/30 text-white",
  success: "bg-green-500 border-green-200 text-white",
  warning: "bg-amber-500 border-amber-200 text-white",
  error: "bg-red-500 border-red-200 text-white",
  neutral: "bg-slate-300 border-slate-200 text-slate-700",
};

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const colorClass = COLOR_MAP[item.color ?? "primary"];

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-4 shadow-sm z-10 shrink-0",
                  colorClass
                )}
              >
                {item.icon ? (
                  <span className="scale-[0.6]">{item.icon}</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>
              {!isLast && <div className="w-0.5 h-full bg-slate-200 -my-1" />}
            </div>

            {/* Content */}
            <div className="flex flex-col pb-8 pt-1">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                {item.time && (
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    {item.time}
                  </span>
                )}
              </div>
              {item.description && (
                <div className="text-sm text-slate-600">{item.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
