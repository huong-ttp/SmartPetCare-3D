"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Dog, 
  Calendar, 
  AlertCircle, 
  DollarSign, 
  Syringe, 
  BarChart3, 
  Minimize2,
  Maximize2,
  Activity
} from "lucide-react";
import { AdminOverview } from "@/services/adminService";
import { cn } from "@/utils/cn";

interface AdminFloatingOverviewProps {
  overview?: AdminOverview;
  isLoading: boolean;
  onOpenAnalytics?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminFloatingOverview: React.FC<AdminFloatingOverviewProps> = ({
  overview,
  isLoading,
  onOpenAnalytics,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
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
      <div className="absolute top-5 left-5 z-20 w-64 space-y-2.5 pointer-events-none">
        <div className="h-10 w-44 rounded-xl bg-slate-800/60 backdrop-blur-md animate-pulse border border-white/5" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-slate-800/40 backdrop-blur-md animate-pulse border border-white/5"
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
      icon: <Users className="text-blue-400" size={17} />,
      bg: "bg-blue-500/15",
      border: "border-blue-500/25",
    },
    {
      title: "Thú cưng",
      value: overview?.totalPets ?? 0,
      desc: "Hồ sơ quản lý",
      icon: <Dog className="text-emerald-400" size={17} />,
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/25",
    },
    {
      title: "Lịch hôm nay",
      value: overview?.todayAppointments ?? 0,
      desc: `${overview?.completedAppointments ?? 0} đã xong tháng này`,
      icon: <Calendar className="text-cyan-400" size={17} />,
      bg: "bg-cyan-500/15",
      border: "border-cyan-500/25",
    },
    {
      title: "Doanh thu tháng",
      value: formatCurrency(overview?.revenue?.month ?? 0),
      desc: `Tổng: ${formatCurrency(overview?.revenue?.total ?? 0)}`,
      icon: <DollarSign className="text-amber-400" size={17} />,
      bg: "bg-amber-500/15",
      border: "border-amber-500/25",
      isMoney: true,
    },
    {
      title: "Vắc xin đến hạn",
      value: overview?.vaccinesDue ?? 0,
      desc: "Trong vòng 7 ngày tới",
      icon: <Syringe className="text-purple-400" size={17} />,
      bg: "bg-purple-500/15",
      border: "border-purple-500/25",
    },
    {
      title: "Hóa đơn chưa thu",
      value: overview?.unpaidInvoices ?? 0,
      desc: "Cần thanh toán",
      icon: <AlertCircle className="text-rose-400" size={17} />,
      bg: "bg-rose-500/15",
      border: "border-rose-500/25",
    },
  ];

  return (
    <div className="absolute top-5 left-5 z-20 pointer-events-auto">
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.button
            key="hud-collapsed-dock"
            initial={{ opacity: 0, scale: 0.9, x: -15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -15 }}
            transition={{ duration: 0.2 }}
            onClick={toggleCollapse}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl backdrop-blur-xl border border-cyan-500/30 bg-slate-950/80 hover:bg-slate-900/95 text-white shadow-2xl hover:border-cyan-400/60 hover:shadow-cyan-500/20 transition-all cursor-pointer ring-1 ring-white/5"
            title="Mở rộng HUD chỉ số KPI"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-100 tracking-wide">HUD Quản Trị</span>
            <span className="text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
              6 KPI
            </span>
            <Maximize2 size={14} className="text-slate-400 group-hover:text-cyan-400 transition-colors ml-0.5" />
          </motion.button>
        ) : (
          <motion.div
            key="hud-expanded-panel"
            initial={{ opacity: 0, scale: 0.95, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -20 }}
            transition={{ duration: 0.22 }}
            className="w-64 md:w-72 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1 hidden-scrollbar"
          >
            {/* Header with Collapse and 2D switch */}
            <div className="p-3 rounded-xl backdrop-blur-2xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/40 ring-1 ring-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-white tracking-wide truncate flex items-center gap-1.5">
                      <span>Admin 3D HUD</span>
                      <Activity size={12} className="text-cyan-400" />
                    </h2>
                    <p className="text-[10px] text-slate-400 leading-tight truncate">Trung tâm chỉ huy số</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onOpenAnalytics && (
                    <button
                      onClick={onOpenAnalytics}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-colors cursor-pointer"
                      title="Chuyển sang Biểu đồ 2D"
                    >
                      <BarChart3 size={13} />
                    </button>
                  )}
                  <button
                    onClick={toggleCollapse}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-colors cursor-pointer"
                    title="Thu gọn HUD để mở rộng không gian 3D"
                  >
                    <Minimize2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Items */}
            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2.5 rounded-xl backdrop-blur-xl border border-white/10 bg-slate-950/75 hover:bg-slate-900/90 transition-all",
                    "shadow-lg shadow-black/30 group"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "p-2 rounded-lg flex-shrink-0 border",
                        item.bg,
                        item.border
                      )}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider truncate">
                        {item.title}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "font-bold text-white leading-tight",
                            item.isMoney ? "text-sm" : "text-base"
                          )}
                        >
                          {item.value}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFloatingOverview;
