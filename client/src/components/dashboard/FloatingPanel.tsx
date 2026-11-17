"use client";

import React from "react";
import { motion } from "framer-motion";
import { Dog, CalendarClock, BellRing, ReceiptText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface FloatingPanelProps {
  totalPets: number;
  upcomingApptsCount: number;
  unreadNotifsCount: number;
  unpaidInvoicesCount: number;
  isLoading: boolean;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  totalPets,
  upcomingApptsCount,
  unreadNotifsCount,
  unpaidInvoicesCount,
  isLoading
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const items = [
    {
      title: "Thú cưng",
      value: totalPets,
      desc: "Hồ sơ đang quản lý",
      icon: <Dog className="text-emerald-600" size={22} />,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-100/70",
      accentBar: "bg-emerald-500",
      href: "/pets"
    },
    {
      title: "Lịch hẹn",
      value: upcomingApptsCount,
      desc: "Lịch hẹn sắp tới",
      icon: <CalendarClock className="text-blue-600" size={22} />,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-100/70",
      accentBar: "bg-blue-500",
      href: "/appointments"
    },
    {
      title: "Thông báo",
      value: unreadNotifsCount,
      desc: "Tin nhắn chưa đọc",
      icon: <BellRing className={unreadNotifsCount > 0 ? "text-amber-600 animate-bounce" : "text-slate-400"} size={22} />,
      badgeColor: unreadNotifsCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200",
      iconBg: unreadNotifsCount > 0 ? "bg-amber-100/70" : "bg-slate-100",
      accentBar: unreadNotifsCount > 0 ? "bg-amber-500" : "bg-slate-300",
      href: "/notifications"
    },
    {
      title: "Hóa đơn",
      value: unpaidInvoicesCount,
      desc: "Chưa thanh toán",
      icon: <ReceiptText className={unpaidInvoicesCount > 0 ? "text-rose-600" : "text-slate-400"} size={22} />,
      badgeColor: unpaidInvoicesCount > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-600 border-slate-200",
      iconBg: unpaidInvoicesCount > 0 ? "bg-rose-100/70" : "bg-slate-100",
      accentBar: unpaidInvoicesCount > 0 ? "bg-rose-500" : "bg-slate-300",
      href: "/invoices"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i} 
            className="h-24 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm animate-pulse flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-5 w-10 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full"
    >
      {items.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <Link 
            href={item.href}
            className={cn(
              "relative group block p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/80 hover:border-slate-300",
              "shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
            )}
          >
            {/* Top subtle accent bar */}
            <div className={cn("absolute top-0 left-0 right-0 h-1", item.accentBar)} />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105", item.iconBg)}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {item.title}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {item.value}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                      {item.desc}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0">
                <ArrowUpRight size={16} />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FloatingPanel;
