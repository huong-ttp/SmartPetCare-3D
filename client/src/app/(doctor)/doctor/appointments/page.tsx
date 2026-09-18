"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Dog,
  Cat,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Stethoscope,
  Sparkles,
  Phone,
  User,
  CalendarCheck,
  CalendarClock,
  FileCheck2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { appointment } from "@/services/appointmentService";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";
import { cn } from "@/utils/cn";

type TabType = "today" | "upcoming" | "completed";

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Tab state (read from URL query param if present)
  const initialTab = useMemo<TabType>(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "upcoming" || tabParam === "completed") {
      return tabParam;
    }
    return "today";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Appointments Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tabCounts, setTabCounts] = useState<{
    today: number;
    upcoming: number;
    completed: number;
  }>({
    today: 0,
    upcoming: 0,
    completed: 0,
  });

  // UX States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Update activeTab when query param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "today" || tabParam === "upcoming" || tabParam === "completed") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Today Date ISO string
  const todayIsoString = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch appointments for current doctor
  const loadAppointments = useCallback(
    async (tab: TabType, showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        // Fetch current active tab list and counts for other tabs
        // API: appointment.service.list({doctor: me, ...filters})
        // Doctor CHỈ xem các appointment đã được Admin gán cho mình (doctor_id = mình)
        const [activeList, todayList, upcomingList, completedList] = await Promise.all([
          appointment.service.list({
            doctor: "me",
            ...(tab === "today"
              ? { date: todayIsoString }
              : tab === "upcoming"
              ? { upcoming: true }
              : { status: "completed" }),
          }),
          appointment.service.list({ doctor: "me", date: todayIsoString }),
          appointment.service.list({ doctor: "me", upcoming: true }),
          appointment.service.list({ doctor: "me", status: "completed" }),
        ]);

        const normalizedActive = Array.isArray(activeList) ? activeList : [];
        const normalizedToday = Array.isArray(todayList) ? todayList : [];
        const normalizedUpcoming = Array.isArray(upcomingList) ? upcomingList : [];
        const normalizedCompleted = Array.isArray(completedList) ? completedList : [];

        setAppointments(normalizedActive);
        setTabCounts({
          today: normalizedToday.length,
          upcoming: normalizedUpcoming.length,
          completed: normalizedCompleted.length,
        });
      } catch (err: any) {
        console.error("[DoctorAppointments] Fetch failed:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [todayIsoString]
  );

  useEffect(() => {
    loadAppointments(activeTab);
  }, [activeTab, loadAppointments]);

  // Filter appointments by search query
  const filteredAppointments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return appointments;

    return appointments.filter((item) => {
      const petName = (item.pet_name || "").toLowerCase();
      const petSpecies = (item.pet_species || "").toLowerCase();
      const petBreed = (item.pet_breed || "").toLowerCase();
      const ownerName = (item.owner_name || "").toLowerCase();
      const ownerPhone = (item.owner_phone || "").toLowerCase();
      const serviceName = (item.service_name || "").toLowerCase();
      const reason = (item.reason || "").toLowerCase();

      return (
        petName.includes(q) ||
        petSpecies.includes(q) ||
        petBreed.includes(q) ||
        ownerName.includes(q) ||
        ownerPhone.includes(q) ||
        serviceName.includes(q) ||
        reason.includes(q)
      );
    });
  }, [appointments, searchQuery]);

  // Helper format appointment date
  const formatApptDate = (dateStr?: string, scheduledAt?: string) => {
    const val = dateStr || scheduledAt?.split("T")[0];
    if (!val) return "Chưa xác định";

    try {
      const d = new Date(val);
      return new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return val;
    }
  };

  // Helper render status badge
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Đã xác nhận
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Đã hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} className="text-rose-500" />
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

  // Helper empty state content per tab
  const getEmptyStateDetails = () => {
    switch (activeTab) {
      case "today":
        return {
          icon: <CalendarClock size={36} className="text-[#0EA5B7]" />,
          title: "Hôm nay bạn chưa có ca khám nào",
          description:
            "Không có lịch hẹn nào được phân công cho bạn trong ngày hôm nay. Hãy kiểm tra các ngày tiếp theo hoặc xem lại các ca khám đã hoàn thành.",
        };
      case "upcoming":
        return {
          icon: <CalendarCheck size={36} className="text-blue-500" />,
          title: "Chưa có lịch hẹn nào sắp tới",
          description:
            "Hiện tại chưa có ca khám nào được xếp lịch trước cho các ngày tiếp theo. Lịch hẹn mới do quản trị viên phân công sẽ hiển thị ở đây.",
        };
      case "completed":
        return {
          icon: <FileCheck2 size={36} className="text-emerald-500" />,
          title: "Chưa có lịch hẹn nào đã hoàn thành",
          description:
            "Các ca khám sau khi được tạo hồ sơ bệnh án thành công sẽ tự động chuyển sang mục Đã hoàn thành.",
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-cyan-300">
              <Stethoscope size={14} className="text-cyan-400" />
              <span>Bác sĩ phụ trách: BS. {user?.full_name || "Bác sĩ"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
              Danh Sách Lịch Hẹn Khám Bệnh
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Theo dõi và quản lý các ca khám thú cưng được phân công cho bạn. Bấm vào từng lịch hẹn
              để xem đầy đủ chi tiết, tiền sử bệnh và thực hiện khám bệnh.
            </p>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAppointments(activeTab, true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Đồng bộ danh sách"
            >
              <RefreshCw
                size={14}
                className={cn(isRefreshing ? "animate-spin text-cyan-400" : "")}
              />
              <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới danh sách"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── ERROR ALERT ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => loadAppointments(activeTab, false)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer"
            >
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CONTROLS: 3 TABS & SEARCH BAR ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 3 Tabs: Today | Upcoming | Completed */}
        <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl gap-1 overflow-x-auto">
          {/* Tab 1: Today */}
          <button
            onClick={() => setActiveTab("today")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === "today"
                ? "bg-white text-[#0EA5B7] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Clock size={16} />
            <span>Hôm nay (Today)</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-extrabold ml-1",
                activeTab === "today"
                  ? "bg-cyan-50 text-[#0EA5B7]"
                  : "bg-slate-200/80 text-slate-600"
              )}
            >
              {tabCounts.today}
            </span>
          </button>

          {/* Tab 2: Upcoming */}
          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === "upcoming"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CalendarCheck size={16} />
            <span>Sắp tới (Upcoming)</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-extrabold ml-1",
                activeTab === "upcoming"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-200/80 text-slate-600"
              )}
            >
              {tabCounts.upcoming}
            </span>
          </button>

          {/* Tab 3: Completed */}
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === "completed"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CheckCircle2 size={16} />
            <span>Đã hoàn thành</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-extrabold ml-1",
                activeTab === "completed"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-200/80 text-slate-600"
              )}
            >
              {tabCounts.completed}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Pet, chủ nuôi, dịch vụ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all bg-slate-50/60 hover:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── LOADING SKELETON ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-xs animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                <div className="space-y-2">
                  <div className="w-32 h-5 bg-slate-200 rounded-md" />
                  <div className="w-48 h-3.5 bg-slate-200 rounded-md" />
                  <div className="w-40 h-3 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="w-28 h-4 bg-slate-200 rounded-md hidden lg:block" />
              <div className="w-36 h-4 bg-slate-200 rounded-md" />
              <div className="w-28 h-9 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* ─── EMPTY STATE PER TAB ───────────────────────────────────────────── */}
      {!isLoading && filteredAppointments.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-14 text-center max-w-xl mx-auto space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-xs">
            {getEmptyStateDetails().icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900">
              {searchQuery ? "Không tìm thấy lịch hẹn phù hợp" : getEmptyStateDetails().title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {searchQuery
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm bằng tên Pet hoặc số điện thoại khác.`
                : getEmptyStateDetails().description}
            </p>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>
      )}

      {/* ─── APPOINTMENTS LIST ─────────────────────────────────────────────── */}
      {!isLoading && filteredAppointments.length > 0 && (
        <div className="space-y-3.5">
          {filteredAppointments.map((appt) => {
            const appointmentDetailId = appt.id || appt.appointment_id;
            const detailHref = `/appointments/${appointmentDetailId}`;

            const isCat =
              appt.pet_species?.toLowerCase() === "cat" ||
              appt.pet_species?.toLowerCase() === "mèo";

            const dateDisplay = formatApptDate(appt.appointment_date, appt.scheduled_at);
            const timeDisplay = appt.start_time
              ? `${appt.start_time}${appt.end_time ? ` - ${appt.end_time}` : ""}`
              : "09:00 - 09:30";

            return (
              <div
                key={appointmentDetailId}
                className="group relative bg-white hover:bg-slate-50/90 rounded-3xl border border-slate-200/80 hover:border-[#0EA5B7]/40 shadow-xs hover:shadow-md transition-all duration-200 p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Column: Pet & Owner Info */}
                  <div className="flex items-start gap-4">
                    {/* Pet Avatar Icon */}
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105",
                        isCat
                          ? "bg-amber-50 text-amber-600 border border-amber-200/80"
                          : "bg-sky-50 text-[#0EA5B7] border border-sky-200/80"
                      )}
                    >
                      {isCat ? <Cat size={28} /> : <Dog size={28} />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={detailHref}
                          className="font-heading font-extrabold text-base text-slate-900 group-hover:text-[#0EA5B7] transition-colors"
                        >
                          {appt.pet_name || "Thú cưng"}
                        </Link>
                        <span className="text-xs text-slate-400 font-normal">•</span>
                        <span className="text-xs font-semibold text-slate-600 capitalize">
                          {appt.pet_breed || (isCat ? "Mèo" : "Chó")}
                        </span>
                      </div>

                      {/* Owner Details */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <User size={13} className="text-slate-400" />
                          <span>Chủ nuôi: {appt.owner_name || "Khách hàng"}</span>
                        </span>

                        {appt.owner_phone && (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            <Phone size={12} className="text-slate-400" />
                            <span>{appt.owner_phone}</span>
                          </span>
                        )}
                      </div>

                      {/* Medical Reason */}
                      <div className="pt-1 text-xs text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">Lý do khám: </span>
                        <span className="text-slate-600">
                          {appt.reason || "Kiểm tra sức khỏe định kỳ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Service & Date / Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-8 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Service Name */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Dịch vụ y tế
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/60">
                        <Stethoscope size={13} className="text-[#0EA5B7]" />
                        <span>{appt.service_name || "Khám tổng quát"}</span>
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Thời gian khám
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-500" />
                          <span>{dateDisplay}</span>
                        </p>
                        <p className="text-xs font-semibold text-[#0EA5B7] flex items-center gap-1.5">
                          <Clock size={13} className="text-[#0EA5B7]" />
                          <span>{timeDisplay}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Badge & CTA to Detail Page */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    {renderStatusBadge(appt.status)}

                    <Link
                      href={detailHref}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-50 hover:bg-[#0EA5B7] text-[#0EA5B7] hover:text-white text-xs font-bold transition-all shadow-xs border border-cyan-100 hover:border-[#0EA5B7] cursor-pointer"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── BUSINESS RULES / NOTICE NOTE ──────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3.5 text-xs text-sky-950">
        <Sparkles size={18} className="text-[#0EA5B7] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-slate-900">Quy tắc phân công & tiếp nhận ca khám:</p>
          <p className="text-slate-600">
            Bác sĩ chỉ có quyền xem các lịch hẹn được quản trị viên trực tiếp gán cho mình. Để đảm bảo
            tính đồng bộ và tính toàn vẹn của dữ liệu y tế, trạng thái lịch hẹn sẽ tự động chuyển sang{" "}
            <strong className="text-emerald-700">Đã hoàn thành</strong> sau khi bác sĩ nhập và lưu Bệnh án Điện tử
            tại trang chi tiết lịch hẹn.
          </p>
        </div>
      </div>
    </div>
  );
}
