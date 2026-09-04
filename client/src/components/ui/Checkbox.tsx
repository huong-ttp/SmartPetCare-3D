"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const cbId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1 w-full">
        <label
          htmlFor={cbId}
          className={cn(
            "flex items-start gap-3 relative group cursor-pointer w-fit",
            props.disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              id={cbId}
              ref={ref}
              className={cn(
                "peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 transition-all duration-200",
                "bg-white checked:bg-[#0EA5B7] checked:border-[#0EA5B7]",
                "hover:border-[#0EA5B7]/60",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5B7]/30 focus-visible:ring-offset-1",
                error && "border-red-400 checked:bg-red-500 checked:border-red-500",
                className
              )}
              {...props}
            />
            <Check
              size={14}
              strokeWidth={3}
              className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 transition-all duration-200"
            />
          </div>
          {label && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700 select-none">
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {!error && hint && (
                <span className="text-xs text-slate-500 select-none mt-0.5">
                  {hint}
                </span>
              )}
            </div>
          )}
        </label>
        {error && <p className="text-xs text-red-500 ml-8">⚠ {error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
