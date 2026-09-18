"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Dog,
  Stethoscope,
  ChevronRight,
  Filter,
  UserCheck,
  CalendarRange,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { appointmentService } from "@/services/appointmentService";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function OwnerAppointmentsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Cancel Modal State
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calls appointmentService.list({ status, from, to })
      const data = await appointmentService.list({
        status: filterStatus !== "all" ? filterStatus : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setAppointments(data);
    } catch (err) {
      console.error("[AppointmentsPage] Load error:", err);
      showError("Không thể tải danh sách lịch hẹn.");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, fromDate, toDate, showError]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Open Cancel confirmation modal
  const openCancelModal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCancelTargetId(id);
    setCancelReasonInput("");
  };

  // Close Cancel modal
  const closeCancelModal = () => {
    setCancelTargetId(null);
    setCancelReasonInput("");
    setIsCancelling(false);
  };

  // Confirm cancel action
  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      await appointmentService.cancel(cancelTargetId, cancelReasonInput);
      showSuccess("Đã hủy lịch hẹn thành công.");
      closeCancelModal();
      loadAppointments();
    } catch (err: any) {
      showError(err?.message || "Không thể hủy lịch hẹn.");
      setIsCancelling(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Đã xác nhận
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} />
            Đã hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const handleResetDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Quản Lý Lịch Hẹn
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Theo dõi danh sách các cuộc hẹn khám, tiêm phòng và lịch chăm sóc cho thú cưng của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadAppointments}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin text-[#0EA5B7]")} />
          </button>

          <Link
            href="/appointments/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0b8fa0] transition-all shadow-md shadow-[#0EA5B7]/25 active:scale-95"
          >
            <Plus size={16} />
            <span>Đặt lịch khám mới</span>
          </Link>
        </div>
      </div>

      {/* ─── Controls: Status Filter Tabs + Date Range Picker ─────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs (KHÔNG CÓ PENDING) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {(
              [
                { key: "all", label: "Tất cả" },
                { key: "confirmed", label: "Đã xác nhận" },
                { key: "completed", label: "Đã hoàn thành" },
                { key: "cancelled", label: "Đã hủy" },
              ] as const
            ).map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 inline-flex items-center gap-2",
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date Range Filter (from -> to) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Từ:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Đến:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                onClick={handleResetDateFilter}
                className="p-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Xóa bộ lọc ngày"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Loading Skeleton ────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 bg-slate-200 rounded-md" />
                <div className="h-5 w-24 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 w-64 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────────────────── */}
      {!isLoading && appointments.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarIcon size={32} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-800">
              {filterStatus === "all" && !fromDate && !toDate
                ? "Chưa có lịch hẹn nào"
                : "Không tìm thấy lịch hẹn phù hợp"}
            </h3>
            <p className="text-xs text-slate-500">
              {filterStatus === "all" && !fromDate && !toDate
                ? "Bạn chưa có lịch hẹn khám nào. Hãy đặt lịch hẹn để bảo vệ sức khỏe cho thú cưng của mình ngay hôm nay!"
                : "Không có lịch hẹn nào khớp với bộ lọc đã chọn. Hãy thử thay đổi bộ lọc hoặc xóa lọc ngày."}
            </p>
          </div>
          <div className="pt-2">
            {filterStatus === "all" && !fromDate && !toDate ? (
              <Link
                href="/appointments/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0b8fa0] transition-all shadow-md shadow-[#0EA5B7]/20 active:scale-95"
              >
                <Plus size={15} />
                <span>Đặt lịch khám ngay</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setFilterStatus("all");
                  handleResetDateFilter();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                <X size={14} />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Appointments List Cards ─────────────────────────────────── */}
      {!isLoading && appointments.length > 0 && (
        <div className="space-y-3.5">
          {appointments.map((appt) => {
            const dateStr =
              appt.appointment_date ||
              (appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleDateString("vi-VN") : "Chưa xác định");
            const timeStr =
              appt.start_time ||
              (appt.scheduled_at
                ? new Date(appt.scheduled_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "");

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left info column */}
                <div className="space-y-2 flex-1">
                  {/* Top row: Pet name + Status Badge */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/appointments/${appt.id}`}
                      className="text-base font-bold text-slate-900 hover:text-[#0EA5B7] transition-colors flex items-center gap-2"
                    >
                      <Dog size={18} className="text-[#0EA5B7]" />
                      <span>{appt.pet_name ? `Bé ${appt.pet_name}` : "Lịch khám thú cưng"}</span>
                      {appt.pet_species && (
                        <span className="text-[11px] font-normal text-slate-400">
                          ({appt.pet_breed || appt.pet_species})
                        </span>
                      )}
                    </Link>

                    {getStatusBadge(appt.status)}
                  </div>

                  {/* Meta details row: Date, Time, Service, Doctor */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0EA5B7]">
                      <CalendarIcon size={14} />
                      {dateStr} {timeStr && `• ${timeStr}`}
                      {appt.end_time && ` - ${appt.end_time}`}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <Stethoscope size={13} className="text-slate-400" />
                      {appt.service_name || "Khám tổng quát"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <UserCheck size={13} className={appt.doctor_name ? "text-emerald-500" : "text-amber-500"} />
                      {appt.doctor_name ? (
                        <strong className="text-slate-700 font-semibold">{appt.doctor_name}</strong>
                      ) : (
                        <span className="text-amber-600 italic">Chờ phòng khám phân công</span>
                      )}
                    </span>
                  </div>

                  {/* Reason snippet */}
                  {appt.reason && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 line-clamp-1">
                      Lý do: <span className="text-slate-700">{appt.reason}</span>
                    </p>
                  )}
                </div>

                {/* Right action buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                  {appt.status === "confirmed" && (
                    <button
                      onClick={(e) => openCancelModal(appt.id, e)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all"
                    >
                      Hủy lịch
                    </button>
                  )}

                  <Link
                    href={`/appointments/${appt.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Cancel Confirmation Modal Dialog ────────────────────────── */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận hủy lịch hẹn</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy lịch hẹn này? Khung giờ hẹn sẽ được giải phóng để phục vụ các khách hàng khác.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do hủy (tùy chọn)
              </label>
              <textarea
                rows={2}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="Ví dụ: Bé đã khỏi bệnh, có việc bận đột xuất..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Giữ lại lịch
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isCancelling ? "Đang hủy..." : "Xác nhận hủy lịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
