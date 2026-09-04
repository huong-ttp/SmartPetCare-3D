"use client";

import React, { useState } from "react";
import { cn } from "@/utils/cn";

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  variant?: "underline" | "pill";
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey,
  onChange,
  variant = "underline",
  className,
}) => {
  const [internal, setInternal] = useState(items[0]?.key ?? "");
  const active = activeKey ?? internal;

  const handleClick = (key: string) => {
    setInternal(key);
    onChange?.(key);
  };

  return (
    <div
      className={cn(
        "flex",
        variant === "underline"
          ? "border-b border-slate-200 gap-1"
          : "bg-slate-100 rounded-xl p-1 gap-1",
        className
      )}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.key}
          role="tab"
          aria-selected={active === item.key}
          disabled={item.disabled}
          onClick={() => !item.disabled && handleClick(item.key)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none rounded-t",
            ...(variant === "underline" ? [
              "border-b-2 -mb-[2px]",
              active === item.key
                ? "border-[#0EA5B7] text-[#0EA5B7]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            ] : []),
            ...(variant === "pill" ? [
              "rounded-lg",
              active === item.key
                ? "bg-white shadow text-[#0EA5B7] font-semibold"
                : "text-slate-500 hover:text-slate-700",
            ] : []),
            item.disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
