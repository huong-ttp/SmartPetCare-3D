"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Ban,
  CalendarDays,
  Dog,
  Cat,
  User,
  Heart,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import type {
  Appointment,
  AdminAppointmentFilterParams,
  AdminAppointmentPagination,
} from "@/types/appointment.type";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/ui/Toast";
import AppointmentDetailModal from "@/components/admin/appointments/AppointmentDetailModal";
import CancelAppointmentModal from "@/components/admin/appointments/CancelAppointmentModal";
import { cn } from "@/utils/cn";

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const toast = useToast();

  // Data & Pagination State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<AdminAppointmentPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Modals State
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch appointments via admin.service.listAppointments(filters)
  const fetchAppointments = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage("");

      try {
        const filters: AdminAppointmentFilterParams = {
          search: debouncedSearch || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          unassigned: unassignedOnly ? true : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const result = await adminService.listAppointments(filters);
        setAppointments(result.items || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách lịch hẹn:", err);
        setErrorMessage(
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách lịch hẹn. Vui lòng kiểm tra kết nối."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter, unassignedOnly, dateFrom, dateTo, pagination.page, pagination.limit]
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAppointments(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setUnassignedOnly(false);
    setDateFrom("");
    setDateTo("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "all" ||
    unassignedOnly ||
    dateFrom !== "" ||
    dateTo !== "";

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
    const unassignedCount = appointments.filter((a) => !a.doctor_id && a.status === "confirmed").length;
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

    return {
      total: pagination.total,
      confirmed: confirmedCount,
      unassigned: unassignedCount,
      completed: completedCount,
      cancelled: cancelledCount,
    };
  }, [appointments, pagination.total]);

  // Handle Action buttons
  const handleOpenDetail = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsDetailModalOpen(true);
  };

  const handleOpenCancel = (appt: Appointment) => {
    setCancellingAppointment(appt);
    setIsCancelModalOpen(true);
  };

  const handleAssignDoctor = (appt: Appointment) => {
    const apptId = appt.appointment_id ?? appt.id;
    router.push(`/admin/appointments/${apptId}/assign`);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Quản lý Lịch hẹn
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Theo dõi danh sách đặt lịch hẹn, điều phối bác sĩ khám và xử lý yêu cầu hủy lịch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer",
              (isRefreshing || isLoading) && "opacity-60 cursor-not-allowed"
            )}
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              size={15}
              className={cn((isRefreshing || isLoading) && "animate-spin text-blue-600")}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Appointments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng lịch hẹn</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{pagination.total}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays size={18} />
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Đã xác nhận</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.confirmed}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Unassigned Doctor (Crucial Alert Card) */}
        <div
          onClick={() => {
            setUnassignedOnly((prev) => !prev);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={cn(
            "p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all",
            unassignedOnly
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/40"
              : "bg-white border-slate-200/80 hover:border-amber-400"
          )}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-amber-700">Chưa gán BS</p>
              {metrics.unassigned > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{metrics.unassigned}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Hoàn thành</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">{metrics.completed}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-medium text-slate-500">Đã hủy</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{metrics.cancelled}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Thú cưng, Chủ nuôi, Bác sĩ..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter (confirmed | completed | cancelled ONLY - ABSOLUTELY NO PENDING/REJECT) */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận (Confirmed)</option>
              <option value="completed">Đã hoàn thành (Completed)</option>
              <option value="cancelled">Đã hủy (Cancelled)</option>
            </select>
          </div>

          {/* Date Range: DateFrom */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                title="Từ ngày"
              />
            </div>
          </div>

          {/* Date Range: DateTo */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                title="Đến ngày"
              />
            </div>
          </div>

          {/* Reset Filters button */}
          <div className="md:col-span-1 flex justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto p-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Xóa bộ lọc"
              >
                <X className="w-4 h-4" />
                <span className="md:hidden">Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pill: Chưa gán bác sĩ */}
        <div className="flex items-center gap-2.5 pt-1 text-xs border-t border-slate-100">
          <span className="text-slate-500 font-medium">Lọc nhanh:</span>
          <button
            type="button"
            onClick={() => {
              setUnassignedOnly((prev) => !prev);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              unassignedOnly
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            )}
          >
            <AlertTriangle className={cn("w-3.5 h-3.5", unassignedOnly ? "text-white" : "text-amber-600")} />
            <span>Chưa gán bác sĩ</span>
            {metrics.unassigned > 0 && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  unassignedOnly ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-800"
                )}
              >
                {metrics.unassigned}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Message State */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAppointments()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors shrink-0 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Thú cưng (Pet)</th>
                <th className="py-3.5 px-4">Chủ nuôi (Owner)</th>
                <th className="py-3.5 px-4">Dịch vụ (Service)</th>
                <th className="py-3.5 px-4">Ngày (Date)</th>
                <th className="py-3.5 px-4">Giờ (Time)</th>
                <th className="py-3.5 px-4">Bác sĩ (Doctor)</th>
                <th className="py-3.5 px-4">Trạng thái (Status)</th>
                <th className="py-3.5 px-4 text-right">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-20 bg-slate-200 rounded" />
                          <div className="h-2.5 w-14 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-24 bg-slate-200 rounded" />
                        <div className="h-2.5 w-16 bg-slate-100 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-28 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-24 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-20 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-8 w-24 bg-slate-200 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={8} className="py-14 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800">Không tìm thấy lịch hẹn nào</h4>
                      <p className="text-xs text-slate-500">
                        {hasActiveFilters
                          ? "Không có lịch hẹn nào khớp với bộ lọc hiện tại. Thử xóa bộ lọc để xem tất cả."
                          : "Hiện chưa có lịch hẹn nào được ghi nhận trong hệ thống."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors mt-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Xóa bộ lọc tìm kiếm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                appointments.map((appt) => {
                  const apptId = appt.appointment_id ?? appt.id;
                  const isConfirmed = appt.status === "confirmed";
                  const isCompleted = appt.status === "completed";
                  const isCancelled = appt.status === "cancelled";
                  const isDoctorUnassigned = !appt.doctor_id;
                  const canAssignDoctor = isDoctorUnassigned && isConfirmed;
                  const canCancel = isConfirmed;

                  return (
                    <tr
                      key={apptId}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group",
                        canAssignDoctor && "bg-amber-50/20"
                      )}
                    >
                      {/* Pet Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border",
                              appt.pet_species === "dog"
                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                : "bg-purple-50 border-purple-200 text-purple-600"
                            )}
                          >
                            {appt.pet_species === "dog" ? <Dog className="w-4 h-4" /> : <Cat className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                              {appt.pet_name || "Thú cưng"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {appt.pet_breed || (appt.pet_species === "dog" ? "Chó" : "Mèo")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner Column */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block">{appt.owner_name || "Chủ nuôi"}</span>
                          <span className="text-xs text-slate-500">{appt.owner_phone || appt.owner_email || "-"}</span>
                        </div>
                      </td>

                      {/* Service Column */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 block truncate max-w-[170px]" title={appt.service_name}>
                          {appt.service_name || "Khám tổng quát"}
                        </span>
                      </td>

                      {/* Date Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">
                          {formatDateDisplay(appt.appointment_date)}
                        </span>
                      </td>

                      {/* Time Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">
                            {appt.start_time || "N/A"}
                            {appt.end_time ? ` - ${appt.end_time}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Doctor Column (Prominent "Chưa gán" badge) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {appt.doctor_id ? (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold">{appt.doctor_name || "Bác sĩ"}</span>
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                              "bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs animate-pulse"
                            )}
                            title="Lịch hẹn chưa phân công bác sĩ"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Chưa gán
                          </span>
                        )}
                      </td>

                      {/* Status Column (confirmed | completed | cancelled ONLY) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" /> Đã hủy
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Gán bác sĩ (only when doctor_id is null and status is confirmed) */}
                          {canAssignDoctor && (
                            <button
                              type="button"
                              onClick={() => handleAssignDoctor(appt)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-all cursor-pointer"
                              title="Gán bác sĩ phụ trách"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Gán bác sĩ</span>
                            </button>
                          )}

                          {/* Hủy lịch (modal requiring cancel_reason) */}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(appt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              title="Hủy lịch hẹn"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hủy lịch</span>
                            </button>
                          )}

                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(appt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500">
            <div>
              Hiển thị{" "}
              <strong className="text-slate-800">
                {Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)} -{" "}
                {Math.min(pagination.total, pagination.page * pagination.limit)}
              </strong>{" "}
              trên tổng số <strong className="text-slate-800">{pagination.total}</strong> lịch hẹn
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const hasGap = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                            pagination.page === p
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                          )}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.totalPages }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        appointment={cancellingAppointment}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancellingAppointment(null);
        }}
        onSuccess={() => {
          fetchAppointments(false);
        }}
      />

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        appointment={selectedAppointment}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
        onOpenCancelModal={(appt) => {
          handleOpenCancel(appt);
        }}
      />
    </div>
  );
}
