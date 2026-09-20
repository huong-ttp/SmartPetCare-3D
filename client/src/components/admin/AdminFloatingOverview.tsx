"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Dog, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Syringe, 
  BarChart3, 
  ChevronRight 
} from "lucide-react";
import { AdminOverview } from "@/services/adminService";
import { cn } from "@/utils/cn";

interface AdminFloatingOverviewProps {
  overview?: AdminOverview;
  isLoading: boolean;
  onOpenAnalytics?: () => void;
}

export const AdminFloatingOverview: React.FC<AdminFloatingOverviewProps> = ({
  overview,
  isLoading,
  onOpenAnalytics,
}) => {
  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="absolute top-6 left-6 z-10 w-72 md:w-80 space-y-3">
        <div className="h-12 w-48 rounded-xl bg-slate-800/60 backdrop-blur-md animate-pulse border border-white/5" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-slate-800/40 backdrop-blur-md animate-pulse border border-white/5"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Người dùng",
      value: overview?.totalUsers ?? 0,
      desc: "Tài khoản hệ thống",
      icon: <Users className="text-blue-400" size={20} />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Thú cưng",
      value: overview?.totalPets ?? 0,
      desc: "Hồ sơ đang quản lý",
      icon: <Dog className="text-emerald-400" size={20} />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Lịch hôm nay",
      value: overview?.todayAppointments ?? 0,
      desc: `${overview?.completedAppointments ?? 0} đã xong tháng này`,
      icon: <Calendar className="text-cyan-400" size={20} />,
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      title: "Doanh thu tháng",
      value: formatCurrency(overview?.revenue?.month ?? 0),
      desc: `Tổng: ${formatCurrency(overview?.revenue?.total ?? 0)}`,
      icon: <DollarSign className="text-amber-400" size={20} />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      isMoney: true,
    },
    {
      title: "Vắc xin sắp đến hạn",
      value: overview?.vaccinesDue ?? 0,
      desc: "Trong vòng 7 ngày tới",
      icon: <Syringe className="text-purple-400" size={20} />,
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "Hóa đơn chưa thu",
      value: overview?.unpaidInvoices ?? 0,
      desc: "Cần thanh toán",
      icon: <AlertCircle className="text-rose-400" size={20} />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="absolute top-6 left-6 z-10 w-72 md:w-84 space-y-2.5 max-h-[calc(100%-3rem)] overflow-y-auto pr-1 hidden-scrollbar"
    >
      {/* Header with Quick Analytics CTA */}
      <div className="p-4 rounded-2xl backdrop-blur-xl border border-white/10 bg-slate-900/60 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-lg font-bold text-white tracking-tight">Admin 3D HUD</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Trung tâm chỉ huy toàn hệ thống</p>
          </div>
          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <BarChart3 size={14} />
              <span>Biểu đồ 2D</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating HUD Cards */}
      {items.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <div
            className={cn(
              "p-3 rounded-xl backdrop-blur-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/70 transition-all",
              "shadow-lg shadow-black/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-xl flex-shrink-0 border",
                  item.bg,
                  item.border
                )}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={cn(
                      "font-bold text-white leading-tight",
                      item.isMoney ? "text-base" : "text-xl"
                    )}
                  >
                    {item.value}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">{item.desc}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AdminFloatingOverview;
