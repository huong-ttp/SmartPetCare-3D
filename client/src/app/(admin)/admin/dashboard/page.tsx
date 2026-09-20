"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  adminService, 
  AdminDashboardData 
} from "@/services/adminService";
import { useAuth } from "@/lib/auth-context";
import { AdminFloatingOverview } from "@/components/admin/AdminFloatingOverview";
import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards";
import { AdminChartsPanel } from "@/components/admin/AdminChartsPanel";
import { 
  Box, 
  BarChart3, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  Layers,
  Sparkles,
  Maximize2
} from "lucide-react";
import { cn } from "@/utils/cn";

// Dynamic import for 3D component with SSR disabled
const AdminLobby3D = dynamic(() => import("@/components/admin/AdminLobby3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-800">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm text-slate-400 font-medium">Đang tải không gian Admin 3D...</p>
    </div>
  ),
});

type ViewMode = "3d" | "analytics";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const stats = await adminService.getStats();
      setData(stats);
    } catch (err: any) {
      console.error("Failed to fetch admin stats:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        "Không thể tải dữ liệu thống kê từ hệ thống. Vui lòng kiểm tra lại kết nối hoặc thử lại."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Header Bar with Mode Switcher and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Trung Tâm Chỉ Huy Quản Trị (Admin Dashboard)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Giám sát vận hành 3D, điều phối bác sĩ, dịch vụ, tài chính và phân tích số liệu hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode("3d")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "3d"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Box size={15} />
              <span>Lobby 3D</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "analytics"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <BarChart3 size={15} />
              <span>Biểu Đồ 2D</span>
            </button>
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      </div>

      {/* Error Alert State */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-rose-200 text-sm shadow-xl"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-rose-400 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-white">Lỗi kết nối máy chủ thống kê</p>
                <p className="text-xs text-rose-300/90">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={fetchStats}
              className="px-3.5 py-1.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Area */}
      <AnimatePresence mode="wait">
        {viewMode === "3d" ? (
          <motion.div
            key="3d-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 3D Scene Frame */}
            <div className="relative w-full h-[calc(100vh-14rem)] min-h-[580px] rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800">
              <AdminLobby3D overview={data?.overview} />

              {/* Floating Live HUD Overlay */}
              <AdminFloatingOverview
                overview={data?.overview}
                isLoading={isLoading}
                onOpenAnalytics={() => setViewMode("analytics")}
              />

              {/* Quick Navigation Footer Banner */}
              <div className="absolute top-6 right-6 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs text-slate-300 shadow-lg">
                <Sparkles size={15} className="text-cyan-400" />
                <span>Không gian Quản trị 3D thực tế ảo</span>
              </div>
            </div>

            {/* Quick Overview Mini Row under 3D Scene */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Chỉ số tổng quan hệ thống
                </h3>
                <button
                  onClick={() => setViewMode("analytics")}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Xem phân tích chi tiết &rarr;
                </button>
              </div>
              <AdminOverviewCards overview={data?.overview} isLoading={isLoading} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="analytics-mode"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 7 Overview Cards */}
            <AdminOverviewCards overview={data?.overview} isLoading={isLoading} />

            {/* 4 Recharts Visualizations */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Biểu Đồ Phân Tích Hoạt Động</h2>
                  <p className="text-xs text-slate-400">
                    Báo cáo trực quan tình hình kinh doanh, lượng khách hàng và các dịch vụ y tế
                  </p>
                </div>
                <button
                  onClick={() => setViewMode("3d")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all cursor-pointer"
                >
                  <Box size={14} />
                  <span>Quay lại Lobby 3D</span>
                </button>
              </div>

              <AdminChartsPanel
                appointmentStatistics={data?.appointmentStatistics}
                revenueStatistics={data?.revenueStatistics}
                userStatistics={data?.userStatistics}
                vaccinationStatistics={data?.vaccinationStatistics}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
