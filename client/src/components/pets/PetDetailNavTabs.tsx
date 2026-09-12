"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Syringe, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface NavTabItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

interface PetDetailNavTabsProps {
  petId: string;
}

export const PetDetailNavTabs: React.FC<PetDetailNavTabsProps> = ({ petId }) => {
  const tabs: NavTabItem[] = [
    {
      id: "medical-records",
      label: "Hồ sơ bệnh án",
      description: "Lịch sử khám bệnh, chẩn đoán và điều trị",
      icon: <FileText size={22} />,
      href: `/pets/${petId}/medical-records`,
      accentBg: "bg-sky-50",
      accentText: "text-sky-600",
      accentBorder: "border-sky-200 group-hover:border-sky-400",
    },
    {
      id: "vaccinations",
      label: "Tiêm phòng",
      description: "Lịch sử tiêm phòng và vắc xin sắp đến hạn",
      icon: <Syringe size={22} />,
      href: `/pets/${petId}/vaccinations`,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      accentBorder: "border-emerald-200 group-hover:border-emerald-400",
    },
    {
      id: "health-logs",
      label: "Nhật ký sức khỏe",
      description: "Theo dõi cân nặng, nhiệt độ, triệu chứng hàng ngày",
      icon: <Activity size={22} />,
      href: `/pets/${petId}/health-logs`,
      accentBg: "bg-violet-50",
      accentText: "text-violet-600",
      accentBorder: "border-violet-200 group-hover:border-violet-400",
    },
  ];

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900 mb-3 px-1">Hồ sơ & Theo dõi</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tabs.map((tab, i) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link
              id={`pet-nav-${tab.id}`}
              href={tab.href}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-2xl bg-white border shadow-sm",
                "hover:shadow-md transition-all duration-200",
                tab.accentBorder
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  tab.accentBg, tab.accentText
                )}
              >
                {tab.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm transition-colors group-hover:text-primary", tab.accentText)}>
                  {tab.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tab.description}</p>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={18}
                className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PetDetailNavTabs;
