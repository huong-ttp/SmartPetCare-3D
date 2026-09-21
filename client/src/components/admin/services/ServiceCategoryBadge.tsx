"use client";

import React from "react";
import { Stethoscope, Syringe, Scissors, Sparkles, Package } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ServiceCategoryBadgeProps {
  category?: string;
  className?: string;
}

export function getCategoryConfig(category?: string) {
  const cat = (category || "").toLowerCase().trim();
  switch (cat) {
    case "examination":
      return {
        label: "Khám bệnh",
        icon: <Stethoscope size={13} className="shrink-0" />,
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/80",
        dotClass: "bg-sky-500",
      };
    case "vaccination":
      return {
        label: "Tiêm chủng",
        icon: <Syringe size={13} className="shrink-0" />,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80",
        dotClass: "bg-emerald-500",
      };
    case "surgery":
      return {
        label: "Phẫu thuật",
        icon: <Scissors size={13} className="shrink-0" />,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/80",
        dotClass: "bg-amber-500",
      };
    case "grooming":
      return {
        label: "Spa & Grooming",
        icon: <Sparkles size={13} className="shrink-0" />,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/80",
        dotClass: "bg-purple-500",
      };
    case "other":
    default:
      return {
        label: "Khác",
        icon: <Package size={13} className="shrink-0" />,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80",
        dotClass: "bg-slate-400",
      };
  }
}

export const ServiceCategoryBadge: React.FC<ServiceCategoryBadgeProps> = ({
  category,
  className,
}) => {
  const config = getCategoryConfig(category);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        config.badgeClass,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default ServiceCategoryBadge;
