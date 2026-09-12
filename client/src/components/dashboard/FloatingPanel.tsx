"use client";

import React from "react";
import { motion } from "framer-motion";
import { Dog, CalendarClock, BellRing, ReceiptText, ChevronRight } from "lucide-react";
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
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="absolute top-6 left-6 z-10 w-72 md:w-80 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-slate-800/50 backdrop-blur-md animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Thú cưng",
      value: totalPets,
      desc: "Hồ sơ đang quản lý",
      icon: <Dog className="text-emerald-400" size={24} />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/pets"
    },
    {
      title: "Lịch hẹn sắp tới",
      value: upcomingApptsCount,
      desc: "Chưa hoàn thành",
      icon: <CalendarClock className="text-blue-400" size={24} />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/appointments"
    },
    {
      title: "Thông báo",
      value: unreadNotifsCount,
      desc: "Chưa đọc",
      icon: <BellRing className={unreadNotifsCount > 0 ? "text-amber-400" : "text-slate-400"} size={24} />,
      bg: unreadNotifsCount > 0 ? "bg-amber-500/10" : "bg-slate-500/10",
      border: unreadNotifsCount > 0 ? "border-amber-500/20" : "border-slate-500/20",
      href: "/notifications" // Or a modal trigger
    },
    {
      title: "Hóa đơn",
      value: unpaidInvoicesCount,
      desc: "Chưa thanh toán",
      icon: <ReceiptText className={unpaidInvoicesCount > 0 ? "text-red-400" : "text-slate-400"} size={24} />,
      bg: unpaidInvoicesCount > 0 ? "bg-red-500/10" : "bg-slate-500/10",
      border: unpaidInvoicesCount > 0 ? "border-red-500/20" : "border-slate-500/20",
      href: "/invoices"
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="absolute top-6 left-6 z-10 w-72 md:w-80 space-y-3 max-h-[calc(100%-3rem)] overflow-y-auto hidden-scrollbar"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Tổng quan</h2>
        <p className="text-sm text-slate-300 drop-shadow">Trạng thái hiện tại</p>
      </div>

      {items.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <Link 
            href={item.href}
            className={cn(
              "block p-4 rounded-2xl backdrop-blur-xl border border-white/10 bg-slate-900/40 hover:bg-slate-800/60 transition-all group",
              "shadow-lg shadow-black/20"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110", item.bg, item.border, "border")}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-medium uppercase tracking-wider">{item.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{item.value}</span>
                  <span className="text-xs text-slate-400 truncate">{item.desc}</span>
                </div>
              </div>
              <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FloatingPanel;
