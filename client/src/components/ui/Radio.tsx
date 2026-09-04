"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const radioId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1 w-full">
        <label
          htmlFor={radioId}
          className={cn(
            "flex items-start gap-3 relative group cursor-pointer w-fit",
            props.disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="radio"
              id={radioId}
              ref={ref}
              className={cn(
                "peer appearance-none w-5 h-5 rounded-full border-2 border-slate-300 transition-all duration-200",
                "bg-white checked:border-[#0EA5B7]",
                "hover:border-[#0EA5B7]/60",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5B7]/30 focus-visible:ring-offset-1",
                error && "border-red-400 checked:border-red-500",
                className
              )}
              {...props}
            />
            <span
              className={cn(
                "absolute w-2.5 h-2.5 rounded-full bg-[#0EA5B7] pointer-events-none opacity-0 scale-50 transition-all duration-200",
                "peer-checked:opacity-100 peer-checked:scale-100",
                error && "bg-red-500"
              )}
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

Radio.displayName = "Radio";
export default Radio;
