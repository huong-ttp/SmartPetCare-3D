"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  adminService, 
  AdminDashboardData 
} from "@/services/adminService";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "@/context/SocketContext";
import { AdminFloatingOverview } from "@/components/admin/AdminFloatingOverview";
import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards";
import { AdminChartsPanel } from "@/components/admin/AdminChartsPanel";
import { AdminMobileStationHub } from "@/components/admin/AdminMobileStationHub";
import type { AdminStationId } from "@/components/admin/AdminLobby3D";
import { 
  Box, 
  BarChart3, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  ExternalLink, 
  Layers,
  Monitor,
  Users,
  Dog,
  Calendar,
  DollarSign,
  Syringe,
  AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";

// Dynamic import for 3D component with SSR disabled
const AdminLobby3D = dynamic(() => import("@/components/admin/AdminLobby3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#fbf9f5] rounded-2xl border border-stone-200">
      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <p className="mt-4 text-sm text-slate-700 font-medium">Đang tải phòng bệnh viện thú y 3D...</p>
    </div>
  ),
});

type ViewMode = "3d" | "analytics";

const STATION_CONFIGS: Record<AdminStationId, {
  title: string;
  badge: string;
  icon: string;
  accentGradient: string;
  accentBorder: string;
  desc: string;
  mainRoute: string;
  quickActions: { label: string; href: string }[];
}> = {
  users: {
    title: "Quản lý Người Dùng & Bác Sĩ",
    badge: "Phân hệ Nhân sự & Khách hàng",
    icon: "👥",
    accentGradient: "from-blue-600 to-indigo-600",
    accentBorder: "border-blue-500/40",
    desc: "Giám sát tài khoản khách hàng, bác sĩ thú y và phân bổ ca trực lâm sàng.",
    mainRoute: "/admin/users",
    quickActions: [
      { label: "Tất cả người dùng", href: "/admin/users" },
      { label: "Ca trực bác sĩ", href: "/admin/shifts" },
      { label: "Hồ sơ thú cưng", href: "/admin/pets" },
    ],
  },
  appointments: {
    title: "Điều Phối Lịch Khám & Bác Sĩ",
    badge: "Phân hệ Vận hành Phòng khám",
    icon: "📅",
    accentGradient: "from-emerald-600 to-teal-600",
    accentBorder: "border-emerald-500/40",
    desc: "Điều phối ca khám trong ngày, trạng thái tiếp nhận và ca trực bác sĩ đang phục vụ.",
    mainRoute: "/admin/appointments",
    quickActions: [
      { label: "Lịch khám hôm nay", href: "/admin/appointments" },
      { label: "Phân ca trực", href: "/admin/shifts" },
    ],
  },
  services: {
    title: "Kho Dược Phẩm & Tiêm Chủng",
    badge: "Phân hệ Dược & Y tế",
    icon: "💉",
    accentGradient: "from-purple-600 to-fuchsia-600",
    accentBorder: "border-purple-500/40",
    desc: "Theo dõi tồn kho vắc xin, theo dõi hạn dùng thuốc và danh mục dịch vụ điều trị.",
    mainRoute: "/admin/vaccine-types",
    quickActions: [
      { label: "Danh mục vắc xin", href: "/admin/vaccine-types" },
      { label: "Sổ tiêm chủng", href: "/admin/vaccinations" },
      { label: "Dịch vụ phòng khám", href: "/admin/services" },
      { label: "Hồ sơ bệnh án", href: "/admin/medical-records" },
    ],
  },
  finance: {
    title: "Quản Lý Tài Chính & Viện Phí",
    badge: "Phân hệ Kế toán & Doanh thu",
    icon: "💳",
    accentGradient: "from-amber-600 to-orange-600",
    accentBorder: "border-amber-500/40",
    desc: "Theo dõi doanh thu phòng khám, hóa đơn chưa thu và các giao dịch thanh toán POS.",
    mainRoute: "/admin/invoices",
    quickActions: [
      { label: "Hóa đơn viện phí", href: "/admin/invoices" },
      { label: "Lịch sử thanh toán", href: "/admin/payments" },
    ],
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStation, setSelectedStation] = useState<AdminStationId | null>(null);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);

  // Responsive device check: Desktop (>= 1024px) vs Mobile/Tablet (< 1024px)
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

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

  // Cập nhật real-time số liệu dashboard qua WebSocket khi có sự kiện
  useEffect(() => {
    if (!socket) return;
    const handleDashboardUpdate = () => {
      console.log("[AdminDashboard] Real-time dashboard update received");
      fetchStats();
    };
    socket.on("dashboard:updated", handleDashboardUpdate);
    return () => {
      socket.off("dashboard:updated", handleDashboardUpdate);
    };
  }, [socket, fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const handleSelectStation = (stationId: AdminStationId | null) => {
    setSelectedStation(stationId);
    if (stationId) {
      setIsHudCollapsed(true);
    }
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentStationConfig = selectedStation ? STATION_CONFIGS[selectedStation] : null;

  // 6 KPI Items for Mobile Top Grid
  const mobileKpiItems = [
    {
      title: "Người dùng",
      value: data?.overview?.totalUsers ?? 0,
      desc: "Tài khoản",
      icon: <Users className="text-blue-400" size={17} />,
      bg: "bg-blue-500/15",
      border: "border-blue-500/25",
    },
    {
      title: "Thú cưng",
      value: data?.overview?.totalPets ?? 0,
      desc: "Hồ sơ",
      icon: <Dog className="text-emerald-400" size={17} />,
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/25",
    },
    {
      title: "Lịch hôm nay",
      value: data?.overview?.todayAppointments ?? 0,
      desc: `${data?.overview?.completedAppointments ?? 0} xong tháng này`,
      icon: <Calendar className="text-cyan-400" size={17} />,
      bg: "bg-cyan-500/15",
      border: "border-cyan-500/25",
    },
    {
      title: "Doanh thu",
      value: formatCurrency(data?.overview?.revenue?.month ?? 0),
      desc: `Tổng ${formatCurrency(data?.overview?.revenue?.total ?? 0)}`,
      icon: <DollarSign className="text-amber-400" size={17} />,
      bg: "bg-amber-500/15",
      border: "border-amber-500/25",
      isMoney: true,
    },
    {
      title: "Vắc xin đến hạn",
      value: data?.overview?.vaccinesDue ?? 0,
      desc: "Trong 7 ngày",
      icon: <Syringe className="text-purple-400" size={17} />,
      bg: "bg-purple-500/15",
      border: "border-purple-500/25",
    },
    {
      title: "Hóa đơn chưa thu",
      value: data?.overview?.unpaidInvoices ?? 0,
      desc: "Cần thanh toán",
      icon: <AlertCircle className="text-rose-400" size={17} />,
      bg: "bg-rose-500/15",
      border: "border-rose-500/25",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Header Bar with Mode Switcher and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Trung Tâm Chỉ Huy Quản Trị
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isMounted && isDesktop 
              ? "Không gian bệnh viện thú y 3D • Điều phối bác sĩ, dịch vụ, tài chính và phân tích số liệu"
              : "Bảng điều khiển quản trị • Giám sát 4 trạm nghiệp vụ, lịch hẹn, dịch vụ và tài chính"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode("3d")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "3d"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {isMounted && isDesktop ? <Box size={14} /> : <Layers size={14} />}
              <span>{isMounted && isDesktop ? "Bệnh Viện 3D" : "Tổng Quan Trạm"}</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "analytics"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <BarChart3 size={14} />
              <span>Biểu Đồ 2D</span>
            </button>
          </div>

          {/* Desktop 3D Availability Hint on Mobile */}
          {isMounted && !isDesktop && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-white/5">
              <Monitor size={12} className="text-emerald-400" />
              <span>3D trên Desktop</span>
            </span>
          )}

          {/* Refresh Data Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw size={17} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
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
            key="overview-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* CONDITIONAL RENDERING: 3D ON DESKTOP, MOBILE 2D HUB ON MOBILE/TABLET */}
            {isMounted && isDesktop ? (
              /* ================= DESKTOP 3D VIEWPORT (>= 1024px) ================= */
              <div className="relative w-full h-[calc(100vh-14rem)] min-h-[580px] rounded-2xl overflow-hidden shadow-2xl bg-[#fbf9f5] border border-stone-200">
                {/* 3D Canvas */}
                <AdminLobby3D 
                  overview={data?.overview} 
                  selectedStation={selectedStation}
                  onSelectStation={handleSelectStation}
                />

                {/* Floating Live HUD Overlay with Collapse/Expand */}
                <AdminFloatingOverview
                  overview={data?.overview}
                  isLoading={isLoading}
                  onOpenAnalytics={() => setViewMode("analytics")}
                  isCollapsed={isHudCollapsed}
                  onToggleCollapse={() => setIsHudCollapsed((prev) => !prev)}
                />

                {/* Top-Right Area: Default Badge or Active Station Quick Action Popover */}
                <div className="absolute top-5 right-5 z-20 pointer-events-auto max-w-sm w-full">
                  <AnimatePresence mode="wait">
                    {selectedStation && currentStationConfig ? (
                      <motion.div
                        key={selectedStation}
                        initial={{ opacity: 0, scale: 0.92, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -10 }}
                        transition={{ duration: 0.22 }}
                        className="p-4 rounded-2xl backdrop-blur-2xl bg-slate-950/90 border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 space-y-3 ring-1 ring-white/10"
                      >
                        {/* Popover Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-white/10">
                              {currentStationConfig.icon}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                {currentStationConfig.badge}
                              </span>
                              <h3 className="text-sm font-bold text-white leading-tight">
                                {currentStationConfig.title}
                              </h3>
                            </div>
                          </div>

                          {/* Reset Camera Button */}
                          <button
                            onClick={() => setSelectedStation(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-colors cursor-pointer"
                            title="Quay lại toàn cảnh"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {currentStationConfig.desc}
                        </p>

                        {/* Live Stat Highlight Box */}
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Số liệu hiện tại:</span>
                          <span className="font-bold text-emerald-300">
                            {selectedStation === "users" && `${data?.overview?.totalUsers ?? 0} Tài khoản`}
                            {selectedStation === "appointments" && `${data?.overview?.todayAppointments ?? 0} Ca hôm nay`}
                            {selectedStation === "services" && `${data?.overview?.vaccinesDue ?? 0} Vắc xin đến hạn`}
                            {selectedStation === "finance" && `${formatCurrency(data?.overview?.revenue?.month ?? 0)}`}
                          </span>
                        </div>

                        {/* Quick Actions List */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Tác vụ truy cập nhanh:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentStationConfig.quickActions.map((qa, idx) => (
                              <button
                                key={idx}
                                onClick={() => router.push(qa.href)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-lg border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>{qa.label}</span>
                                <ExternalLink size={10} className="text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Primary CTA Button & Reset Button */}
                        <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                          <button
                            onClick={() => router.push(currentStationConfig.mainRoute)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer bg-gradient-to-r",
                              currentStationConfig.accentGradient
                            )}
                          >
                            <span>Vào trang quản lý</span>
                            <ArrowRight size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedStation(null)}
                            className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/10 transition-all cursor-pointer"
                          >
                            Toàn cảnh
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="status-badge"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="hidden sm:flex items-center justify-between gap-3 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-xl border border-stone-200 text-xs text-slate-700 shadow-md ml-auto w-fit"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏥</span>
                          <span className="font-semibold text-slate-900">Không Gian Phòng Khám Thú Y 3D</span>
                        </div>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                          Nhấp trạm để xem chi tiết
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* ================= MOBILE / TABLET 2D STATION HUB (< 1024px) ================= */
              <div className="space-y-6">
                {/* 1. Mobile 6-KPI Top Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Chỉ Số Sức Khỏe Phòng Khám
                    </span>
                    <button
                      onClick={() => setViewMode("analytics")}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Xem biểu đồ &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {mobileKpiItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between space-y-2"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
                            {item.title}
                          </span>
                          <div className={cn("p-1.5 rounded-lg border", item.bg, item.border)}>
                            {item.icon}
                          </div>
                        </div>

                        <div>
                          <div className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                            {item.value}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Mobile 4-Station Cards Hub */}
                <AdminMobileStationHub overview={data?.overview} isLoading={isLoading} />
              </div>
            )}

            {/* Quick Overview Row under 3D Scene (Always available on Desktop, complementary on Mobile) */}
            {isMounted && isDesktop && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Chỉ số tổng quan hệ thống
                  </h3>
                  <button
                    onClick={() => setViewMode("analytics")}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Xem phân tích chi tiết &rarr;
                  </button>
                </div>
                <AdminOverviewCards overview={data?.overview} isLoading={isLoading} />
              </div>
            )}
          </motion.div>
        ) : (
          /* ================= ANALYTICS MODE (CHARTS & DETAILED STATS) ================= */
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all cursor-pointer"
                >
                  {isMounted && isDesktop ? <Box size={14} /> : <Layers size={14} />}
                  <span>{isMounted && isDesktop ? "Quay lại Bệnh Viện 3D" : "Quay lại Tổng Quan Trạm"}</span>
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
