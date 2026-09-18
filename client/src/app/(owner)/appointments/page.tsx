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
} from "lucide-react";
import { appointmentService } from "@/services/appointmentService";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function OwnerAppointmentsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all");

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("[AppointmentsPage] Load error:", err);
      showError("Không thể tải danh sách lịch hẹn.");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Cancel handler
  const handleCancel = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?")) return;
    try {
      await appointmentService.cancelAppointment(id);
      showSuccess("Đã hủy lịch hẹn thành công.");
      loadAppointments();
    } catch (err: any) {
      showError(err?.message || "Không thể hủy lịch hẹn.");
    }
  };

  const filteredAppointments = useMemo(() => {
    if (filterStatus === "all") return appointments;
    return appointments.filter((a) => a.status === filterStatus);
  }, [appointments, filterStatus]);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} />
            Đã xác nhận
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
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

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
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
            title="Làm mới"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin text-[#0EA5B7]")} />
          </button>

          <Link
            href="/appointments/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0b8fa0] transition-all shadow-md shadow-[#0EA5B7]/25 active:scale-95"
          >
            <Plus size={16} />
            <span>Đặt lịch mới</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(
          [
            { key: "all", label: "Tất cả" },
            { key: "confirmed", label: "Đã xác nhận" },
            { key: "completed", label: "Đã hoàn thành" },
            { key: "cancelled", label: "Đã hủy" },
          ] as const
        ).map((tab) => {
          const isActive = filterStatus === tab.key;
          const count =
            tab.key === "all"
              ? appointments.length
              : appointments.filter((a) => a.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-slate-200 rounded" />
                <div className="h-5 w-24 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAppointments.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarIcon size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không có lịch hẹn nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === "all"
              ? "Bạn chưa có lịch hẹn nào tại SmartPetCare. Hãy đặt lịch khám đầu tiên cho thú cưng của mình nhé!"
              : "Không có lịch hẹn nào phù hợp với bộ lọc hiện tại."}
          </p>
          {filterStatus === "all" && (
            <Link
              href="/appointments/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0b8fa0] transition-all shadow-md shadow-[#0EA5B7]/20"
            >
              <Plus size={15} />
              <span>Đặt lịch khám ngay</span>
            </Link>
          )}
        </div>
      )}

      {/* Appointments List */}
      {!isLoading && filteredAppointments.length > 0 && (
        <div className="space-y-3">
          {filteredAppointments.map((appt) => {
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
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-slate-900">
                      {appt.pet_name ? `Bé ${appt.pet_name}` : "Lịch khám thú cưng"}
                    </span>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#0EA5B7]">
                      <CalendarIcon size={14} />
                      {dateStr} {timeStr && `vào lúc ${timeStr}`}
                      {appt.end_time && ` - ${appt.end_time}`}
                    </span>

                    {appt.service_name && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Stethoscope size={13} />
                        {appt.service_name}
                      </span>
                    )}

                    <span className="text-slate-400">
                      Bác sĩ:{" "}
                      <strong className="text-slate-600 font-medium">
                        {appt.doctor_id ? "Đã gán bác sĩ" : "Chờ admin phân công"}
                      </strong>
                    </span>
                  </div>

                  {appt.reason && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      Lý do: <span className="text-slate-700">{appt.reason}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {appt.status === "confirmed" && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all"
                    >
                      Hủy lịch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
