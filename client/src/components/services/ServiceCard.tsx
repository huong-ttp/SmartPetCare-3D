"use client";

import React from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Syringe, 
  Scissors, 
  Sparkles, 
  Layers, 
  Clock, 
  ArrowRight,
  CalendarCheck
} from "lucide-react";
import type { Service, ServiceCategory } from "@/types/service.type";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";

export interface CategoryMeta {
  key: ServiceCategory;
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
  dotClass: string;
  accentBorder: string;
}

export const CATEGORY_META: Record<ServiceCategory, CategoryMeta> = {
  Examination: {
    key: "Examination",
    label: "Khám bệnh",
    icon: <Stethoscope size={14} className="shrink-0" />,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/70",
    dotClass: "bg-sky-500",
    accentBorder: "group-hover:border-sky-300",
  },
  Vaccination: {
    key: "Vaccination",
    label: "Tiêm chủng",
    icon: <Syringe size={14} className="shrink-0" />,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70",
    dotClass: "bg-emerald-500",
    accentBorder: "group-hover:border-emerald-300",
  },
  Surgery: {
    key: "Surgery",
    label: "Phẫu thuật",
    icon: <Scissors size={14} className="shrink-0" />,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70",
    dotClass: "bg-amber-500",
    accentBorder: "group-hover:border-amber-300",
  },
  Grooming: {
    key: "Grooming",
    label: "Spa & Làm đẹp",
    icon: <Sparkles size={14} className="shrink-0" />,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/70",
    dotClass: "bg-purple-500",
    accentBorder: "group-hover:border-purple-300",
  },
  Other: {
    key: "Other",
    label: "Dịch vụ khác",
    icon: <Layers size={14} className="shrink-0" />,
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/70",
    dotClass: "bg-indigo-500",
    accentBorder: "group-hover:border-indigo-300",
  },
};

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "30 phút";
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `${days * 24}h (${days} ngày)`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours}h ${rest}p` : `${hours} giờ (${minutes}p)`;
  }
  return `${minutes} phút`;
}

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, className }) => {
  const cat = (service.category && CATEGORY_META[service.category])
    ? CATEGORY_META[service.category]
    : CATEGORY_META.Other;

  const bookingUrl = `/appointments/create?service_id=${service.id}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#0EA5B7]/40",
        cat.accentBorder,
        className
      )}
    >
      {/* Top row: Category Badge + Duration Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
            cat.badgeClass
          )}
        >
          {cat.icon}
          <span>{cat.label}</span>
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
          <Clock size={12} className="text-slate-400" />
          <span>{formatDuration(service.duration_minutes)}</span>
        </span>
      </div>

      {/* Main info */}
      <div className="flex-1 flex flex-col mb-4">
        <h3
          className="text-base font-bold text-slate-900 group-hover:text-[#0EA5B7] transition-colors line-clamp-1 mb-1.5"
          title={service.name}
        >
          {service.name}
        </h3>
        <p
          className="text-xs text-slate-600 leading-relaxed line-clamp-3 min-h-[48px]"
          title={service.description}
        >
          {service.description || "Dịch vụ chăm sóc thú cưng chuyên nghiệp tại phòng khám SmartPetCare."}
        </p>
      </div>

      {/* Footer: Price & Booking Action */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-400">Chi phí dịch vụ:</span>
          <span className="text-base font-extrabold text-[#0EA5B7] tracking-tight">
            {formatCurrency(service.price)}
          </span>
        </div>

        <Link
          href={bookingUrl}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#0EA5B7] active:scale-[0.98] transition-all duration-200 shadow-xs group-hover:shadow-md group-hover:shadow-[#0EA5B7]/20"
        >
          <CalendarCheck size={15} />
          <span>Đặt lịch với dịch vụ này</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
