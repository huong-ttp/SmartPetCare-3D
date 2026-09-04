"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type="date"
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200",
            "bg-white/80 backdrop-blur-sm text-slate-900",
            "border-slate-200",
            "focus:border-[#0EA5B7] focus:ring-2 focus:ring-[#0EA5B7]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400 focus:border-red-500",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
        {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
export default DatePicker;
