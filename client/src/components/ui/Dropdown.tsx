"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  placement?: "bottom-left" | "bottom-right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  placement = "bottom-right",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={ref}>
      <div onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-100 py-1",
            "animate-in fade-in zoom-in-95 duration-100",
            placement === "bottom-right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                item.disabled
                  ? "opacity-50 cursor-not-allowed text-slate-400"
                  : item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {item.icon && <span className={cn("shrink-0", item.danger ? "text-red-500" : "text-slate-400")}>{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
