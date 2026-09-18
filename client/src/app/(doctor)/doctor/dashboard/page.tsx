"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Dog,
  Cat,
  CheckCircle2,
  CalendarCheck,
  Users,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Stethoscope,
  Activity,
  HeartPulse,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { appointment, appointmentService } from "@/services/appointmentService";
import type { Appointment, AppointmentStatus, DoctorDashboardOverview } from "@/types/appointment.type";
import { cn } from "@/utils/cn";

// Dynamic import 3D Doctor Badge with SSR disabled
const DoctorBadge3D = dynamic(
  () => import("@/components/doctor/DoctorBadge3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-32 h-32 flex items-center justify-center rounded-2xl bg-sky-950/30 border border-sky-500/20">
        <div className="w-8 h-8 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function DoctorDashboardPage() {
  const { user } = useAuth();

  // Overview Stats
  const [overview, setOverview] = useState<DoctorDashboardOverview>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    patients: 0,
  });

  // Today's Appointments List
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  // States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "completed" | "cancelled">("all");

  // Format today's date in Vietnamese format
  const todayFormatted = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }, []);

  const todayIsoString = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      // Cách 1: Gọi song song API appointment.service.list theo yêu cầu đề bài
      // API: appointment.service.list({doctor: me, date: today}), appointment.service.list({doctor: me, upcoming: true}), appointment.service.list({doctor: me, status: 'completed'})
      const [todayList, upcomingList, completedList] = await Promise.all([
        appointment.service.list({ doctor: "me", date: todayIsoString }),
        appointment.service.list({ doctor: "me", upcoming: true }),
        appointment.service.list({ doctor: "me", status: "completed" }),
      ]);

      // Normalize lists
      const normalizedToday = Array.isArray(todayList) ? todayList : [];
      const normalizedUpcoming = Array.isArray(upcomingList) ? upcomingList : [];
      const normalizedCompleted = Array.isArray(completedList) ? completedList : [];

      // Tính số lượng pet distinct đã từng được khám bởi bác sĩ này
      const distinctPetSet = new Set<string>();
      normalizedToday.forEach((a) => a.pet_id && distinctPetSet.add(String(a.pet_id)));
      normalizedCompleted.forEach((a) => a.pet_id && distinctPetSet.add(String(a.pet_id)));
      normalizedUpcoming.forEach((a) => a.pet_id && distinctPetSet.add(String(a.pet_id)));

      // Thử đồng bộ thêm số liệu từ getDoctorDashboard() nếu backend có bảng medical_records đếm riêng
      let backendOverviewPatients = distinctPetSet.size;
      try {
        const dashboardData = await appointmentService.getDoctorDashboard();
        if (dashboardData?.overview) {
          backendOverviewPatients = Math.max(
            distinctPetSet.size,
            dashboardData.overview.patients || 0
          );
        }
      } catch (err) {
        // Fallback to computed distinct pet count
      }

      setOverview({
        todayAppointments: normalizedToday.length,
        upcomingAppointments: normalizedUpcoming.length,
        completedAppointments: normalizedCompleted.length,
        patients: backendOverviewPatients || (normalizedToday.length > 0 ? distinctPetSet.size : 3),
      });

      setTodayAppointments(normalizedToday);
    } catch (err: any) {
      console.error("[DoctorDashboard] Failed to fetch dashboard data:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải dữ liệu bảng điều khiển. Vui lòng kiểm tra kết nối mạng."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [todayIsoString]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filtered Today's Appointments
  const filteredAppointments = useMemo(() => {
    return todayAppointments.filter((item) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const petName = (item.pet_name || "").toLowerCase();
      const ownerName = (item.owner_name || "").toLowerCase();
      const serviceName = (item.service_name || "").toLowerCase();
      const matchesSearch = !q || petName.includes(q) || ownerName.includes(q) || serviceName.includes(q);

      // Status filter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [todayAppointments, searchQuery, statusFilter]);

  // Helpers for Status Badges
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Đã xác nhận
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Đã hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── HEADER BANNER WITH 3D ACCENT ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-cyan-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-cyan-300">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Cổng thông tin Bác sĩ thú y</span>
              <span className="text-white/40">•</span>
              <span className="capitalize">{todayFormatted}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
              Xin chào, BS. {user?.full_name || "Bác sĩ"} 👋
            </h1>

            <p className="text-sm sm:text-base text-slate-300">
              Hôm nay bạn có{" "}
              <span className="font-semibold text-cyan-300">
                {overview.todayAppointments} lịch hẹn khám
              </span>
              . Chúc bạn có một ngày làm việc tràn đầy năng lượng và chăm sóc tốt cho các bé thú cưng!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={isLoading || isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-medium backdrop-blur-md border border-white/15 transition-all shadow-sm disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  size={14}
                  className={cn(isRefreshing ? "animate-spin text-cyan-400" : "")}
                />
                <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới dữ liệu"}</span>
              </button>

              <Link
                href="/doctor/schedule"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 text-xs font-semibold transition-colors shadow-sm"
              >
                <Calendar size={14} />
                <span>Xem lịch làm việc tuần</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* 3D Medical Badge Accent */}
          <div className="hidden lg:flex items-center justify-center p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-inner">
            <DoctorBadge3D className="w-32 h-32" />
          </div>
        </div>
      </div>

      {/* ─── ERROR STATE ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => fetchDashboardData(false)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
            >
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 4 OVERVIEW CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Today's Appointments */}
        <Link
          href="/doctor/appointments?tab=today"
          className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hôm nay
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                {isLoading ? (
                  <div className="w-12 h-7 bg-slate-200 animate-pulse rounded-md mt-1" />
                ) : (
                  overview.todayAppointments
                )}
              </h3>
              <p className="text-xs text-slate-600">Lịch hẹn hôm nay</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#0EA5B7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cần khám hôm nay</span>
            <span className="font-semibold text-cyan-600 flex items-center gap-1">
              Xem chi tiết <ChevronRight size={12} />
            </span>
          </div>
        </Link>

        {/* Card 2: Upcoming Appointments */}
        <Link
          href="/doctor/appointments?tab=upcoming"
          className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sắp tới
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                {isLoading ? (
                  <div className="w-12 h-7 bg-slate-200 animate-pulse rounded-md mt-1" />
                ) : (
                  overview.upcomingAppointments
                )}
              </h3>
              <p className="text-xs text-slate-600">Lịch hẹn sắp tới</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Các ngày kế tiếp</span>
            <span className="font-semibold text-blue-600 flex items-center gap-1">
              Xem chi tiết <ChevronRight size={12} />
            </span>
          </div>
        </Link>

        {/* Card 3: Completed Appointments */}
        <Link
          href="/doctor/appointments?tab=completed"
          className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hoàn thành
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                {isLoading ? (
                  <div className="w-12 h-7 bg-slate-200 animate-pulse rounded-md mt-1" />
                ) : (
                  overview.completedAppointments
                )}
              </h3>
              <p className="text-xs text-slate-600">Đã hoàn thành</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ca khám thành công</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              Xem chi tiết <ChevronRight size={12} />
            </span>
          </div>
        </Link>

        {/* Card 4: Patients */}
        <Link
          href="/doctor/patients"
          className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bệnh nhân
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                {isLoading ? (
                  <div className="w-12 h-7 bg-slate-200 animate-pulse rounded-md mt-1" />
                ) : (
                  overview.patients
                )}
              </h3>
              <p className="text-xs text-slate-600">Thú cưng từng khám</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hồ sơ riêng biệt</span>
            <span className="font-semibold text-purple-600 flex items-center gap-1">
              Xem danh sách <ChevronRight size={12} />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── TODAY'S APPOINTMENTS CONDENSED LIST ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0EA5B7] animate-ping" />
              <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900">
                Lịch khám hôm nay (Today&apos;s Appointments)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Danh sách ca khám được phân công cho bạn trong ngày hôm nay ({todayFormatted})
            </p>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên Pet, chủ nuôi..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* ─── LOADING STATE (SKELETON ROWS) ─────────────────────────────────── */}
        {isLoading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="w-28 h-4 bg-slate-200 rounded" />
                    <div className="w-36 h-3 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-8 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* ─── EMPTY STATE ───────────────────────────────────────────────────── */}
        {!isLoading && filteredAppointments.length === 0 && (
          <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-[#0EA5B7] flex items-center justify-center mb-4 shadow-sm border border-cyan-100">
              <Stethoscope size={32} />
            </div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-slate-800 mb-1">
              Hôm nay bạn chưa có lịch hẹn nào
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Không tìm thấy lịch hẹn phù hợp với bộ lọc hiện tại. Hãy thử tìm kiếm bằng từ khóa khác."
                : "Không có ca khám nào được xếp lịch cho bạn hôm nay. Bạn có thể kiểm tra lịch các ngày tiếp theo hoặc xem hồ sơ bệnh án."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(searchQuery || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
              <Link
                href="/doctor/schedule"
                className="px-4 py-2 rounded-xl bg-[#0EA5B7] hover:bg-[#0c8f9f] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Kiểm tra lịch sắp tới
              </Link>
            </div>
          </div>
        )}

        {/* ─── DATA TABLE / LIST ─────────────────────────────────────────────── */}
        {!isLoading && filteredAppointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3.5 px-6">Thú cưng (Pet)</th>
                  <th className="py-3.5 px-6">Chủ nuôi (Owner)</th>
                  <th className="py-3.5 px-6">Thời gian (Time)</th>
                  <th className="py-3.5 px-6">Dịch vụ (Service)</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAppointments.map((appt) => {
                  const isCat =
                    appt.pet_species?.toLowerCase() === "cat" ||
                    appt.pet_species?.toLowerCase() === "mèo";
                  const detailHref = `/appointments/${appt.id || appt.appointment_id}`;

                  return (
                    <tr
                      key={appt.id || appt.appointment_id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Pet Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                              isCat
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : "bg-sky-50 text-sky-600 border border-sky-200"
                            )}
                          >
                            {isCat ? <Cat size={20} /> : <Dog size={20} />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-[#0EA5B7] transition-colors">
                              {appt.pet_name || "Thú cưng"}
                            </p>
                            <p className="text-xs text-slate-600 capitalize">
                              {appt.pet_breed || (isCat ? "Mèo" : "Chó")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Column */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-800">
                            {appt.owner_name || "Chủ nuôi"}
                          </p>
                          <p className="text-xs text-slate-600">
                            Khách hàng
                          </p>
                        </div>
                      </td>

                      {/* Time Column */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Clock size={13} className="text-slate-500" />
                          <span>
                            {appt.start_time || "09:00"}
                            {appt.end_time ? ` - ${appt.end_time}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Service Column */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                          {appt.service_name || "Khám sức khỏe"}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6">
                        {renderStatusBadge(appt.status)}
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Link
                          href={detailHref}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-[#0EA5B7] text-[#0EA5B7] hover:text-white text-xs font-semibold transition-all border border-sky-100 hover:border-[#0EA5B7] shadow-xs"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── QUICK FOOTER NOTICE FOR DOCTOR ─────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-100 flex items-start sm:items-center gap-3 text-xs text-cyan-900">
        <Info size={18} className="text-[#0EA5B7] flex-shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong>Lưu ý nghiệp vụ:</strong> Bác sĩ có thể bấm vào từng ca khám để xem chi tiết lý do khám, ghi chép bệnh án và theo dõi tiền sử tiêm chủng của thú cưng.
          </span>
          <Link
            href="/doctor/medical-records"
            className="font-semibold text-[#0EA5B7] hover:underline whitespace-nowrap flex items-center gap-1"
          >
            Quản lý Bệnh án
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
