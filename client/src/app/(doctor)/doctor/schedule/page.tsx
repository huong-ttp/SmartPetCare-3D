"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Users,
  Sun,
  Sunset,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Dog,
  Cat,
  ExternalLink,
  CalendarCheck,
  Building,
  TrendingUp,
  X,
  Phone,
  User,
  FileText,
  CalendarDays,
  ListFilter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import scheduleService, {
  formatIsoDate,
  getWeekDateRange,
} from "@/services/scheduleService";
import type { DoctorShift, ScheduleSummary, ShiftStatus } from "@/types/schedule.type";
import type { Appointment } from "@/types/appointment.type";
import { cn } from "@/utils/cn";

type ViewMode = "weekly" | "today";

const DAYS_OF_WEEK = [
  { label: "Thứ Hai", short: "T2", index: 1 },
  { label: "Thứ Ba", short: "T3", index: 2 },
  { label: "Thứ Tư", short: "T4", index: 3 },
  { label: "Thứ Năm", short: "T5", index: 4 },
  { label: "Thứ Sáu", short: "T6", index: 5 },
  { label: "Thứ Bảy", short: "T7", index: 6 },
  { label: "Chủ Nhật", short: "CN", index: 0 },
];

export default function DoctorSchedulePage() {
  const { user } = useAuth();

  // Selected week anchor date (defaults to today)
  const [currentWeekAnchor, setCurrentWeekAnchor] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  // Shifts Data
  const [shifts, setShifts] = useState<DoctorShift[]>([]);
  const [summary, setSummary] = useState<ScheduleSummary>({
    total_shifts: 0,
    completed_shifts: 0,
    active_shifts: 0,
    upcoming_shifts: 0,
    today_shifts: 0,
    total_appointments: 0,
    occupancy_rate: 0,
  });

  // UX States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Today ISO string (YYYY-MM-DD)
  const todayIsoString = useMemo(() => formatIsoDate(new Date()), []);

  // Compute Week Range based on currentWeekAnchor
  const weekInfo = useMemo(() => {
    return getWeekDateRange(currentWeekAnchor);
  }, [currentWeekAnchor]);

  // Display date range label (vd: "21/09/2026 - 27/09/2026")
  const dateRangeDisplay = useMemo(() => {
    const formatDate = (iso: string) => {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };
    return `${formatDate(weekInfo.startDate)} - ${formatDate(weekInfo.endDate)}`;
  }, [weekInfo]);

  // Load shifts for the current week
  const loadShifts = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await scheduleService.getDoctorShifts(
          weekInfo.startDate,
          weekInfo.endDate
        );
        setShifts(data);
        const stats = scheduleService.getScheduleSummary(data);
        setSummary(stats);
      } catch (error) {
        console.error("Failed to load doctor shifts:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [weekInfo]
  );

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Week Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekAnchor);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekAnchor(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekAnchor);
    next.setDate(next.getDate() + 7);
    setCurrentWeekAnchor(next);
  };

  const handleToday = () => {
    setCurrentWeekAnchor(new Date());
  };

  const isCurrentWeek = useMemo(() => {
    const todayWeek = getWeekDateRange(new Date());
    return todayWeek.startDate === weekInfo.startDate;
  }, [weekInfo]);

  // Group shifts by date for easy 7-day grid rendering
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, { morning?: DoctorShift; afternoon?: DoctorShift }>();
    weekInfo.dates.forEach((date) => {
      map.set(date, {});
    });

    shifts.forEach((shift) => {
      const entry = map.get(shift.date) || {};
      if (shift.shift_type === "morning") {
        entry.morning = shift;
      } else if (shift.shift_type === "afternoon") {
        entry.afternoon = shift;
      }
      map.set(shift.date, entry);
    });

    return map;
  }, [shifts, weekInfo.dates]);

  // Today's specific shifts and appointments for Today Timeline View
  const todayShifts = useMemo(() => {
    return shifts.filter((s) => s.date === todayIsoString);
  }, [shifts, todayIsoString]);

  const todayAllAppointments = useMemo(() => {
    const list: (Appointment & { shift_label: string; room: string })[] = [];
    todayShifts.forEach((shift) => {
      const shiftLabel = shift.shift_type === "morning" ? "Ca Sáng (08:00 - 12:00)" : "Ca Chiều (13:00 - 17:00)";
      (shift.appointments || []).forEach((appt) => {
        list.push({
          ...appt,
          shift_label: shiftLabel,
          room: shift.room,
        });
      });
    });
    return list.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [todayShifts]);

  // Status Badge Component
  const renderShiftStatusBadge = (status: ShiftStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang trực
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Clock size={11} className="text-sky-500" />
            Sắp diễn ra
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 size={11} className="text-slate-500" />
            Đã xong
          </span>
        );
      case "off":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Coffee size={11} className="text-amber-500" />
            Nghỉ trực
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── 1. HEADER BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Ambient lighting glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-cyan-300">
              <Stethoscope size={14} className="text-cyan-400" />
              <span>BS. {user?.full_name || "Bác sĩ"}</span>
              <span className="text-white/40">•</span>
              <span>Lịch phân ca lâm sàng</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
              Lịch Làm Việc & Ca Trực Bác Sĩ
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Theo dõi lịch trực hàng tuần, khung giờ khám bệnh và danh sách bệnh nhân đã được phân công tiếp nhận.
            </p>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadShifts(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Cập nhật lịch làm việc"
            >
              <RefreshCw
                size={14}
                className={cn(isRefreshing ? "animate-spin text-cyan-400" : "")}
              />
              <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới lịch"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. OVERVIEW CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng ca trực tuần này */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ca trực tuần này
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center">
              <CalendarIcon size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
              {summary.total_shifts}
            </span>
            <span className="text-xs text-slate-500 font-medium">ca làm việc</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{summary.completed_shifts} đã xong</span>
            <span>•</span>
            <span>{summary.upcoming_shifts} sắp tới</span>
          </div>
        </div>

        {/* Card 2: Ca trực hôm nay */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ca trực hôm nay
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
              {summary.today_shifts}
            </span>
            <span className="text-xs text-slate-500 font-medium">ca trực</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            {summary.active_shifts > 0 ? (
              <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang trong ca trực
              </span>
            ) : (
              <span>Ca Sáng (08:00) & Chiều (13:00)</span>
            )}
          </div>
        </div>

        {/* Card 3: Lịch khám tiếp nhận */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lịch khám trong ca
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
              {summary.total_appointments}
            </span>
            <span className="text-xs text-slate-500 font-medium">bệnh nhân</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1">
            <CalendarCheck size={13} className="text-indigo-500" />
            <span>Đã phân công bác sĩ phụ trách</span>
          </div>
        </div>

        {/* Card 4: Tỷ lệ lấp đầy */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tỷ lệ lấp đầy ca
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
              {summary.occupancy_rate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">công suất</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#0EA5B7] to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(8, summary.occupancy_rate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── 3. NAVIGATION CONTROLS & VIEW MODE SELECTOR ───────────────────── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Week navigation buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200/60 shadow-inner">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleToday}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isCurrentWeek
                  ? "bg-[#0EA5B7] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              )}
            >
              Hôm nay
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Current Date Range Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <CalendarDays size={15} className="text-[#0EA5B7]" />
            <span>{dateRangeDisplay}</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              onClick={() => setViewMode("weekly")}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === "weekly"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CalendarIcon size={14} className={viewMode === "weekly" ? "text-[#0EA5B7]" : ""} />
              <span>Lịch tuần (Weekly Grid)</span>
            </button>

            <button
              onClick={() => setViewMode("today")}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === "today"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock size={14} className={viewMode === "today" ? "text-[#0EA5B7]" : ""} />
              <span>Lịch hôm nay (Today Timeline)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. MAIN CONTENT AREA ─────────────────────────────────────────── */}
      {isLoading ? (
        // Loading Skeleton
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-xl w-48" />
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div key={item} className="space-y-3">
                <div className="h-14 bg-slate-200 rounded-2xl" />
                <div className="h-44 bg-slate-100 rounded-2xl" />
                <div className="h-44 bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === "weekly" ? (
        // ─── VIEW 1: WEEKLY SCHEDULE GRID (7 CỘT) ─────────────────────────
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Legend Banner */}
          <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <span className="font-semibold text-slate-800">Chú thích ca trực:</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Sun size={13} className="text-amber-500" /> Ca Sáng (08:00 - 12:00)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Sunset size={13} className="text-teal-600" /> Ca Chiều (13:00 - 17:00)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đang trực
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Sắp diễn ra
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Đã xong
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Nghỉ phép
              </span>
            </div>
          </div>

          {/* Grid Container with Horizontal Scroll on smaller devices */}
          <div className="overflow-x-auto">
            <div className="min-w-[1050px] grid grid-cols-7 divide-x divide-slate-200/80">
              {weekInfo.dates.map((dateStr, colIdx) => {
                const dayShifts = shiftsByDate.get(dateStr) || {};
                const morningShift = dayShifts.morning;
                const afternoonShift = dayShifts.afternoon;

                const isToday = dateStr === todayIsoString;
                const [, m, d] = dateStr.split("-");
                const dayConfig = DAYS_OF_WEEK[colIdx];

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "flex flex-col min-h-[580px] transition-colors",
                      isToday ? "bg-cyan-50/20" : "bg-white"
                    )}
                  >
                    {/* Day Column Header */}
                    <div
                      className={cn(
                        "p-4 border-b text-center relative",
                        isToday
                          ? "bg-[#0EA5B7]/10 border-b-2 border-b-[#0EA5B7]"
                          : "border-b-slate-100 bg-slate-50/50"
                      )}
                    >
                      {isToday && (
                        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-b-md bg-[#0EA5B7] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                          Hôm nay
                        </span>
                      )}

                      <h3
                        className={cn(
                          "font-heading text-sm font-bold",
                          isToday ? "text-[#0EA5B7] mt-1" : "text-slate-800"
                        )}
                      >
                        {dayConfig.label}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {d}/{m}
                      </p>
                    </div>

                    {/* Shifts Column Body */}
                    <div className="p-2.5 space-y-3.5 flex-1 flex flex-col justify-between">
                      {/* 1. MORNING SHIFT BLOCK */}
                      <div
                        className={cn(
                          "rounded-2xl border p-3 transition-all",
                          morningShift?.status === "active"
                            ? "bg-emerald-50/40 border-emerald-300 shadow-xs"
                            : "bg-slate-50/70 hover:bg-slate-50 border-slate-200/80"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Sun size={14} className="text-amber-500" />
                            <span>Ca Sáng</span>
                          </div>
                          {morningShift && renderShiftStatusBadge(morningShift.status)}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>08:00 - 12:00</span>
                          <span className="font-semibold text-slate-700">
                            {morningShift?.appointments_count || 0}/{morningShift?.max_patients || 6} hẹn
                          </span>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500 truncate" title={morningShift?.room}>
                          <Building size={11} className="inline mr-1 text-slate-400" />
                          <span>P.101 Tổng quát</span>
                        </div>

                        {/* Morning Appointments */}
                        <div className="mt-2.5 space-y-1.5">
                          {morningShift?.appointments && morningShift.appointments.length > 0 ? (
                            morningShift.appointments.map((appt) => {
                              const isCat =
                                appt.pet_species?.toLowerCase() === "cat" ||
                                appt.pet_species?.toLowerCase() === "mèo";

                              return (
                                <button
                                  key={appt.id || appt.appointment_id}
                                  onClick={() => setSelectedAppointment(appt)}
                                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-sky-50/70 border border-slate-200/80 hover:border-[#0EA5B7]/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                      <Clock size={11} className="text-[#0EA5B7]" />
                                      {appt.start_time || "08:30"}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-md font-semibold",
                                        appt.status === "completed"
                                          ? "bg-slate-100 text-slate-600"
                                          : "bg-sky-50 text-sky-700"
                                      )}
                                    >
                                      {appt.status === "completed" ? "Đã khám" : "Chờ khám"}
                                    </span>
                                  </div>

                                  <div className="mt-1 flex items-center gap-1.5">
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px]",
                                        isCat
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-sky-100 text-[#0EA5B7]"
                                      )}
                                    >
                                      {isCat ? <Cat size={12} /> : <Dog size={12} />}
                                    </div>
                                    <span className="font-heading font-bold text-xs text-slate-900 group-hover:text-[#0EA5B7] transition-colors truncate">
                                      {appt.pet_name || "Thú cưng"}
                                    </span>
                                  </div>

                                  <div className="mt-1 text-[10px] text-slate-500 truncate">
                                    {appt.service_name || "Khám bệnh"}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="py-3 px-2 text-center rounded-xl bg-white/60 border border-dashed border-slate-200">
                              <span className="text-[11px] text-slate-400 font-medium">
                                Chưa có ca hẹn
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. AFTERNOON SHIFT BLOCK */}
                      <div
                        className={cn(
                          "rounded-2xl border p-3 transition-all",
                          afternoonShift?.status === "active"
                            ? "bg-emerald-50/40 border-emerald-300 shadow-xs"
                            : afternoonShift?.status === "off"
                            ? "bg-slate-100/60 border-slate-200 text-slate-400"
                            : "bg-slate-50/70 hover:bg-slate-50 border-slate-200/80"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Sunset size={14} className="text-teal-600" />
                            <span>Ca Chiều</span>
                          </div>
                          {afternoonShift && renderShiftStatusBadge(afternoonShift.status)}
                        </div>

                        {afternoonShift?.status === "off" ? (
                          <div className="py-6 text-center space-y-1">
                            <Coffee size={20} className="mx-auto text-amber-500/70" />
                            <p className="text-[11px] font-semibold text-slate-600">Nghỉ định kỳ</p>
                            <p className="text-[10px] text-slate-400">Không phân ca khám</p>
                          </div>
                        ) : (
                          <>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                              <span>13:00 - 17:00</span>
                              <span className="font-semibold text-slate-700">
                                {afternoonShift?.appointments_count || 0}/
                                {afternoonShift?.max_patients || 6} hẹn
                              </span>
                            </div>

                            <div
                              className="mt-1 text-[11px] text-slate-500 truncate"
                              title={afternoonShift?.room}
                            >
                              <Building size={11} className="inline mr-1 text-slate-400" />
                              <span>P.103 Da liễu</span>
                            </div>

                            {/* Afternoon Appointments */}
                            <div className="mt-2.5 space-y-1.5">
                              {afternoonShift?.appointments &&
                              afternoonShift.appointments.length > 0 ? (
                                afternoonShift.appointments.map((appt) => {
                                  const isCat =
                                    appt.pet_species?.toLowerCase() === "cat" ||
                                    appt.pet_species?.toLowerCase() === "mèo";

                                  return (
                                    <button
                                      key={appt.id || appt.appointment_id}
                                      onClick={() => setSelectedAppointment(appt)}
                                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                          <Clock size={11} className="text-teal-600" />
                                          {appt.start_time || "14:00"}
                                        </span>
                                        <span
                                          className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-md font-semibold",
                                            appt.status === "completed"
                                              ? "bg-slate-100 text-slate-600"
                                              : "bg-teal-50 text-teal-700"
                                          )}
                                        >
                                          {appt.status === "completed" ? "Đã khám" : "Chờ khám"}
                                        </span>
                                      </div>

                                      <div className="mt-1 flex items-center gap-1.5">
                                        <div
                                          className={cn(
                                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px]",
                                            isCat
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-teal-100 text-teal-700"
                                          )}
                                        >
                                          {isCat ? <Cat size={12} /> : <Dog size={12} />}
                                        </div>
                                        <span className="font-heading font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                                          {appt.pet_name || "Thú cưng"}
                                        </span>
                                      </div>

                                      <div className="mt-1 text-[10px] text-slate-500 truncate">
                                        {appt.service_name || "Khám bệnh"}
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="py-3 px-2 text-center rounded-xl bg-white/60 border border-dashed border-slate-200">
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Chưa có ca hẹn
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // ─── VIEW 2: TODAY TIMELINE (LỘ TRÌNH HÔM NAY) ───────────────────────
        <div className="space-y-6">
          {/* Today Shifts Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayShifts.map((shift) => (
              <div
                key={shift.id}
                className={cn(
                  "p-5 rounded-3xl border shadow-xs transition-all",
                  shift.status === "active"
                    ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {shift.shift_type === "morning" ? (
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Sun size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Sunset size={20} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-heading font-extrabold text-slate-900 text-base">
                        {shift.shift_type === "morning" ? "Ca Sáng (08:00 - 12:00)" : "Ca Chiều (13:00 - 17:00)"}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building size={12} className="text-slate-400" />
                        <span>{shift.room}</span>
                      </p>
                    </div>
                  </div>
                  <div>{renderShiftStatusBadge(shift.status)}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-500">Số lịch khám đã xếp:</span>
                  <span className="font-bold text-slate-900">
                    {shift.appointments_count || 0} / {shift.max_patients} bệnh nhân
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Today Timeline List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">
                  Lộ Trình Bệnh Nhân Trong Ngày
                </h3>
                <p className="text-xs text-slate-500">
                  Danh sách theo thứ tự giờ khám hôm nay ({todayIsoString}). Nhấp vào từng ca để xem chi tiết hoặc mở bệnh án.
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-sky-50 text-[#0EA5B7] text-xs font-bold border border-sky-100">
                {todayAllAppointments.length} ca khám
              </span>
            </div>

            {todayAllAppointments.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <CalendarCheck size={28} />
                </div>
                <h4 className="font-heading font-bold text-slate-800 text-base">
                  Hôm nay không có ca hẹn nào
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Bạn hiện không có lịch khám nào trong các ca trực hôm nay. Hãy chuyển sang chế độ Lịch tuần để xem các ngày tiếp theo.
                </p>
                <button
                  onClick={() => setViewMode("weekly")}
                  className="px-4 py-2 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0EA5B7]/90 transition-all cursor-pointer"
                >
                  Xem Lịch tuần
                </button>
              </div>
            ) : (
              <div className="mt-6 relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                <div className="space-y-6">
                  {todayAllAppointments.map((appt) => {
                    const isCat =
                      appt.pet_species?.toLowerCase() === "cat" ||
                      appt.pet_species?.toLowerCase() === "mèo";

                    return (
                      <div key={appt.id || appt.appointment_id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-6 top-4 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-[#0EA5B7] shadow-xs group-hover:scale-125 transition-transform" />

                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-[#0EA5B7]/50 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Left: Pet & Owner */}
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold shadow-sm",
                                isCat ? "bg-amber-500 text-white" : "bg-[#0EA5B7] text-white"
                              )}
                            >
                              {isCat ? <Cat size={24} /> : <Dog size={24} />}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-extrabold text-base text-slate-900">
                                  {appt.pet_name || "Thú cưng"}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs font-medium text-slate-600">
                                  {appt.pet_breed || (isCat ? "Mèo" : "Chó")}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-medium text-slate-700">
                                  <User size={13} className="text-slate-400" />
                                  <span>{appt.owner_name || "Chủ nuôi"}</span>
                                </span>
                                {appt.owner_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} className="text-slate-400" />
                                    <span>{appt.owner_phone}</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 pt-1">
                                <span className="font-medium text-slate-700">Lý do: </span>
                                <span>{appt.reason || "Kiểm tra định kỳ"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Time & Service */}
                          <div className="space-y-1.5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0EA5B7] flex items-center gap-1 shadow-2xs">
                                <Clock size={13} />
                                <span>
                                  {appt.start_time} - {appt.end_time || "09:15"}
                                </span>
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {appt.shift_label}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Stethoscope size={13} className="text-teal-600" />
                              <span>{appt.service_name || "Khám tổng quát"}</span>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                            <button
                              onClick={() => setSelectedAppointment(appt)}
                              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer"
                            >
                              Chi tiết
                            </button>

                            <Link
                              href={`/appointments/${appt.id || appt.appointment_id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0EA5B7] hover:bg-[#0EA5B7]/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <span>Khám bệnh</span>
                              <ArrowRight size={13} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 5. BUSINESS NOTICE BANNER ─────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-sky-50/70 border border-sky-100 flex items-start gap-3.5 text-xs text-sky-950">
        <Sparkles size={18} className="text-[#0EA5B7] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-slate-900">Quy chuẩn phân ca làm việc bác sĩ:</p>
          <p className="text-slate-600">
            Ca Sáng (08:00 - 12:00) chuyên trách khám tổng quát, tiêm chủng định kỳ và tư vấn dinh dưỡng. Ca Chiều (13:00 - 17:00) tiếp nhận các ca chẩn đoán chuyên sâu, da liễu và phẫu thuật. Mọi thắc mắc về đổi ca trực xin vui lòng liên hệ Ban Quản lý Phòng khám trước ít nhất 24 giờ.
          </p>
        </div>
      </div>

      {/* ─── 6. QUICK VIEW APPOINTMENT MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-white">
                      Thông Tin Chi Tiết Lịch Hẹn
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Mã lịch: #{selectedAppointment.id || selectedAppointment.appointment_id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Pet & Owner Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold",
                      selectedAppointment.pet_species?.toLowerCase() === "cat" ||
                        selectedAppointment.pet_species?.toLowerCase() === "mèo"
                        ? "bg-amber-500"
                        : "bg-[#0EA5B7]"
                    )}
                  >
                    {selectedAppointment.pet_species?.toLowerCase() === "cat" ||
                    selectedAppointment.pet_species?.toLowerCase() === "mèo" ? (
                      <Cat size={24} />
                    ) : (
                      <Dog size={24} />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-base text-slate-900">
                        {selectedAppointment.pet_name || "Thú cưng"}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {selectedAppointment.pet_breed || "Giống loài"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p className="flex items-center gap-1.5 font-medium text-slate-700">
                        <User size={12} className="text-slate-400" />
                        <span>Chủ nuôi: {selectedAppointment.owner_name || "Khách hàng"}</span>
                      </p>
                      {selectedAppointment.owner_phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <a
                            href={`tel:${selectedAppointment.owner_phone}`}
                            className="text-[#0EA5B7] hover:underline font-semibold"
                          >
                            {selectedAppointment.owner_phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Schedule Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                      Thời gian khám
                    </span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <Clock size={13} className="text-[#0EA5B7]" />
                      <span>
                        {selectedAppointment.start_time || "08:30"}{" "}
                        {selectedAppointment.end_time ? `- ${selectedAppointment.end_time}` : ""}
                      </span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                      Ngày hẹn
                    </span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <CalendarIcon size={13} className="text-[#0EA5B7]" />
                      <span>{selectedAppointment.appointment_date || todayIsoString}</span>
                    </span>
                  </div>
                </div>

                {/* Service & Medical Reason */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100">
                    <span className="text-[11px] font-bold text-[#0EA5B7] uppercase tracking-wider block">
                      Dịch vụ y tế
                    </span>
                    <p className="font-heading font-bold text-sm text-slate-800 mt-0.5">
                      {selectedAppointment.service_name || "Khám sức khỏe tổng quát"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700">Lý do khám bệnh:</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {selectedAppointment.reason || "Kiểm tra sức khỏe định kỳ và tiêm phòng theo lịch"}
                    </p>
                  </div>

                  {selectedAppointment.notes && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">Ghi chú thêm:</span>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Đóng
                </button>

                <Link
                  href={`/appointments/${selectedAppointment.id || selectedAppointment.appointment_id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5B7] hover:bg-[#0EA5B7]/90 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Mở Bệnh Án / Khám Ngay</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
