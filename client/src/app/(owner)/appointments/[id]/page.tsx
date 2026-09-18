"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  Dog,
  Cat,
  Stethoscope,
  User,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Phone,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Plus,
  Info,
  Syringe,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { appointmentService } from "@/services/appointmentService";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const isDoctor = user?.role === "doctor";

  const appointmentId = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Check if doctor is assigned to this appointment
  const isAssignedToDoctor = useMemo(() => {
    if (!isDoctor || !appointment) return true;
    const currentUserId = String(user?.id ?? user?.user_id ?? "");
    const apptDoctorId = String(appointment.doctor_id ?? "");
    return Boolean(currentUserId && apptDoctorId && currentUserId === apptDoctorId);
  }, [isDoctor, appointment, user]);

  // Check if scheduled appointment time has arrived or passed
  const isAppointmentTimeReached = useMemo(() => {
    if (!appointment) return false;
    const dateVal = appointment.appointment_date || appointment.scheduled_at?.split("T")[0];
    if (!dateVal) return true;
    const timeVal = appointment.start_time || "00:00";
    const apptDateTime = new Date(`${dateVal}T${timeVal}:00`);
    if (isNaN(apptDateTime.getTime())) return true;
    return Date.now() >= apptDateTime.getTime();
  }, [appointment]);

  // Fetch Appointment Details
  const loadAppointment = useCallback(async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Calls appointmentService.getById(id)
      const data = await appointmentService.getById(appointmentId);
      setAppointment(data);
    } catch (err: any) {
      console.error("[AppointmentDetail] Fetch error:", err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải thông tin lịch hẹn. Vui lòng kiểm tra lại ID."
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  // Status Badge Helper
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Đã xác nhận
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={14} />
            Đã hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={14} />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  /**
   * ASSUMPTION:
   * Chủ nuôi (Owner) được phép hủy lịch hẹn khi:
   * 1. Status hiện tại vẫn là "confirmed".
   * 2. Thời gian khám chưa qua (chưa đến ngày giờ khám).
   * Nếu backend không hỗ trợ hủy ở trạng thái này hoặc lịch đã hoàn thành, nút sẽ bị ẩn.
   */
  const canCancel = useMemo(() => {
    if (!appointment) return false;
    if (appointment.status !== "confirmed") return false;

    // Kiểm tra thời gian nếu có ngày giờ cụ thể
    if (appointment.appointment_date) {
      const apptDateStr = `${appointment.appointment_date}T${appointment.start_time || "00:00"}:00`;
      const apptTime = new Date(apptDateStr).getTime();
      const now = new Date().getTime();
      if (!isNaN(apptTime) && now > apptTime) {
        return false; // Đã quá giờ khám
      }
    }
    return true;
  }, [appointment]);

  // Confirm cancel action
  const handleConfirmCancel = async () => {
    if (!appointment) return;
    setIsCancelling(true);
    try {
      await appointmentService.cancel(appointment.id, cancelReasonInput);
      showSuccess("Đã hủy lịch hẹn thành công.");
      setIsCancelModalOpen(false);
      loadAppointment();
    } catch (err: any) {
      console.error("[AppointmentDetail] Cancel failed:", err);
      showError(err?.message || "Không thể hủy lịch hẹn. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Format Date & Time strings
  const dateStr = useMemo(() => {
    if (!appointment) return "";
    if (appointment.appointment_date) {
      return new Date(appointment.appointment_date).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    if (appointment.scheduled_at) {
      return new Date(appointment.scheduled_at).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    return "Chưa xác định";
  }, [appointment]);

  const timeStr = useMemo(() => {
    if (!appointment) return "";
    if (appointment.start_time) {
      return `${appointment.start_time} ${appointment.end_time ? `→ ${appointment.end_time}` : ""}`;
    }
    if (appointment.scheduled_at) {
      return new Date(appointment.scheduled_at).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "";
  }, [appointment]);

  const backListHref = isDoctor ? "/doctor/appointments" : "/appointments";

  // Permission Guard for Doctor: Doctor ONLY sees appointments assigned to them
  if (!isLoading && !errorMessage && appointment && isDoctor && !isAssignedToDoctor) {
    return (
      <div className="space-y-6 pb-20">
        <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto mt-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-amber-950">Không có quyền truy cập</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Bạn không được phân công phụ trách ca khám này. Lịch hẹn chưa được gán hoặc đã được phân
              công cho một bác sĩ khác.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0c8f9f] transition-all shadow-md active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Quay lại danh sách lịch hẹn của bạn</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Breadcrumbs & Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href={isDoctor ? "/doctor/dashboard" : "/dashboard"}
            className="hover:text-[#0EA5B7] transition-colors"
          >
            Tổng quan
          </Link>
          <span>/</span>
          <Link
            href={backListHref}
            className="hover:text-[#0EA5B7] transition-colors"
          >
            {isDoctor ? "Lịch hẹn khám" : "Lịch hẹn"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Chi tiết #{appointmentId}</span>
        </div>

        <Link
          href={backListHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* ─── Loading Skeleton ────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-white rounded-3xl border border-slate-200/80 p-6 flex justify-between items-center" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="h-44 bg-white rounded-3xl border border-slate-200/80" />
              <div className="h-44 bg-white rounded-3xl border border-slate-200/80" />
            </div>
            <div className="lg:col-span-4 h-72 bg-white rounded-3xl border border-slate-200/80" />
          </div>
        </div>
      )}

      {/* ─── Error State ─────────────────────────────────────────────── */}
      {!isLoading && errorMessage && (
        <div className="bg-red-50/90 border border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-900">Không tìm thấy lịch hẹn</h3>
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={loadAppointment}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Thử lại</span>
            </button>
            <Link
              href={backListHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              <span>Về danh sách</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Appointment Detail Content ──────────────────────────────── */}
      {!isLoading && !errorMessage && appointment && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                  Lịch Hẹn #{appointment.id || appointment.appointment_id}
                </h1>
                {getStatusBadge(appointment.status)}
              </div>
              <p className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
                <CalendarIcon size={14} className="text-[#0EA5B7]" />
                <span>{dateStr}</span>
                {timeStr && <span>• {timeStr}</span>}
              </p>
            </div>

            {/* Actions: Doctor View vs Owner View */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Doctor Actions */}
              {isDoctor && (
                <>
                  {appointment.status === "confirmed" && (
                    <>
                      {isAppointmentTimeReached ? (
                        <Link
                          href={`/appointments/${appointment.id || appointment.appointment_id}/create-record`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5B7] to-teal-600 hover:from-[#0c8f9f] hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-[#0EA5B7]/25 active:scale-95 cursor-pointer"
                        >
                          <Stethoscope size={16} />
                          <span>Bắt đầu khám</span>
                          <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                          <Clock size={14} className="text-amber-600" />
                          <span>Chưa đến giờ khám ({timeStr || "Theo hẹn"})</span>
                        </div>
                      )}
                    </>
                  )}

                  {appointment.status === "completed" && (
                    <Link
                      href={
                        appointment.medical_record_id
                          ? `/medical-records/${appointment.medical_record_id}`
                          : `/doctor/medical-records`
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <FileText size={15} />
                      <span>Xem bệnh án đã lưu</span>
                    </Link>
                  )}

                  {/* Vaccination Recording Shortcut for Doctor */}
                  <Link
                    href={`/appointments/${appointment.id || appointment.appointment_id}/vaccinate`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Syringe size={15} className="text-teal-600" />
                    <span>Ghi nhận tiêm phòng</span>
                  </Link>
                </>
              )}

              {/* Owner Actions */}
              {!isDoctor && (
                <>
                  {canCancel && (
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Hủy lịch hẹn
                    </button>
                  )}

                  <Link
                    href="/appointments/create"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5B7] hover:bg-[#0b8fa0] text-white text-xs font-bold transition-all shadow-md shadow-[#0EA5B7]/20 active:scale-95 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Đặt lịch mới</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Cancellation Reason Alert (Nếu lịch bị hủy) */}
          {appointment.status === "cancelled" && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
              <p className="font-bold flex items-center gap-1.5 text-rose-900">
                <XCircle size={16} className="text-rose-600" />
                Lịch hẹn này đã bị hủy
              </p>
              <p className="text-rose-700">
                Lý do hủy:{" "}
                <strong>{appointment.cancel_reason || "Chủ nuôi yêu cầu hủy lịch hẹn."}</strong>
              </p>
            </div>
          )}

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Detailed Information Sections (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Thú Cưng Khám */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Dog size={18} className="text-[#0EA5B7]" />
                    <span>Hồ Sơ Thú Cưng</span>
                  </h2>

                  {appointment.pet_id && (
                    <Link
                      href={`/pets/${appointment.pet_id}`}
                      className="text-xs font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Xem chi tiết bé</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center text-xl shrink-0">
                    {appointment.pet_species === "cat" ? <Cat size={28} /> : <Dog size={28} />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 truncate">
                      {appointment.pet_name ? `Bé ${appointment.pet_name}` : "Thú cưng"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Loài:{" "}
                      <strong className="text-slate-700">
                        {appointment.pet_species === "cat"
                          ? "Mèo"
                          : appointment.pet_species === "dog"
                          ? "Chó"
                          : appointment.pet_species || "Chưa rõ"}
                      </strong>{" "}
                      {appointment.pet_breed && `• Giống: ${appointment.pet_breed}`}
                      {appointment.pet_weight && ` • ${appointment.pet_weight} kg`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Thông Tin Chủ Nuôi (Pet Owner) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User size={18} className="text-[#0EA5B7]" />
                    <span>Thông Tin Chủ Nuôi (Khách Hàng)</span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">Hồ sơ khách hàng</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Họ và tên chủ nuôi
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {appointment.owner_name || "Nguyễn Văn An"}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Số điện thoại liên hệ
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {appointment.owner_phone ? (
                        <a
                          href={`tel:${appointment.owner_phone}`}
                          className="text-[#0EA5B7] hover:underline inline-flex items-center gap-1.5"
                        >
                          <Phone size={13} />
                          <span>{appointment.owner_phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 font-normal">Chưa cập nhật SĐT</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Dịch Vụ & Bác Sĩ Phụ Trách */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Stethoscope size={18} className="text-[#0EA5B7]" />
                  <span>Dịch Vụ & Bác Sĩ Chuyên Khoa</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Service Info */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dịch vụ y tế
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {appointment.service_name || "Khám sức khỏe tổng quát"}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {appointment.service_description ||
                        "Khám lâm sàng toàn diện, kiểm tra các chỉ số sức khỏe của bé."}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Chi phí dịch vụ:</span>
                      <span className="font-extrabold text-[#0EA5B7] text-sm">
                        {appointment.service_price
                          ? formatCurrency(appointment.service_price)
                          : "Theo tư vấn trực tiếp"}
                      </span>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Bác sĩ phụ trách
                      </span>

                      {appointment.doctor_name ? (
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <UserCheck size={16} className="text-emerald-500" />
                            <span>BS. {appointment.doctor_name}</span>
                          </h4>
                          {appointment.doctor_phone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" />
                              <span>{appointment.doctor_phone}</span>
                            </p>
                          )}
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã gán bác sĩ
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Clock size={13} className="text-amber-500" />
                            <span>Đang chờ phòng khám sắp xếp bác sĩ</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Quản trị viên phòng khám sẽ phân công bác sĩ chuyên khoa phù hợp với tình trạng sức khỏe của bé trước giờ khám.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Chi Tiết Thời Gian & Lý Do Khám */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText size={18} className="text-[#0EA5B7]" />
                  <span>Chi Tiết Lịch Hẹn & Lý Do Khám</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-medium">Ngày hẹn khám:</span>
                    <p className="font-bold text-slate-900 text-sm">{dateStr}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-medium">Khung giờ tiếp nhận:</span>
                    <p className="font-bold text-[#0EA5B7] text-sm">{timeStr || "Theo hẹn"}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Lý do khám / Triệu chứng ban đầu:
                    </span>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed">
                      {appointment.reason || "Khám sức khỏe tổng quát."}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-700 mb-1">
                        Ghi chú thêm:
                      </span>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                        {appointment.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Liên Kết Bệnh Án & Hóa Đơn (Khi status = completed) */}
              {appointment.status === "completed" && (
                <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200/80 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>Hồ Sơ Y Khoa Sau Khám</span>
                    </h3>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Lịch khám này đã hoàn tất. Bạn có thể xem kết quả chẩn đoán bệnh án và hóa đơn viện phí tương ứng dưới đây.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Medical Record Link */}
                    <Link
                      href={
                        appointment.medical_record_id
                          ? `/medical-records/${appointment.medical_record_id}`
                          : `/medical-records`
                      }
                      className="p-4 rounded-2xl bg-white border border-emerald-200/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Stethoscope size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            Bệnh Án Điện Tử
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {appointment.medical_record_id
                              ? `Hồ sơ #${appointment.medical_record_id}`
                              : "Xem hồ sơ bệnh án"}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </Link>

                    {/* Invoice Link */}
                    <Link
                      href={
                        appointment.invoice_id
                          ? `/invoices`
                          : `/invoices`
                      }
                      className="p-4 rounded-2xl bg-white border border-emerald-200/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            Hóa Đơn Viện Phí
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {appointment.invoice_id
                              ? `Hóa đơn #${appointment.invoice_id}`
                              : "Xem hóa đơn thanh toán"}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Status Summary & Quick Actions (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Status Timeline Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Tiến Trình Lịch Hẹn
                </h3>

                <div className="space-y-3.5 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Đặt lịch thành công</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(appointment.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        appointment.status === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {appointment.status === "cancelled" ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {appointment.status === "cancelled" ? "Đã hủy lịch hẹn" : "Lịch hẹn đã xác nhận"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {appointment.status === "cancelled"
                          ? "Lịch hẹn không còn hiệu lực"
                          : "Hệ thống tự động phê duyệt"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 opacity-90">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        appointment.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-bold",
                          appointment.status === "completed" ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        Khám & Hoàn tất
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {appointment.status === "completed"
                          ? "Đã khám xong và lưu hồ sơ y tế"
                          : "Chờ bác sĩ khám trực tiếp"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cancel CTA if applicable */}
                {canCancel && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                    >
                      Hủy lịch hẹn này
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1.5">
                      Chỉ có thể hủy trước giờ hẹn khám
                    </p>
                  </div>
                )}
              </div>

              {/* Clinic Support Help */}
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/60 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle size={15} className="text-[#0EA5B7]" />
                  Cần thay đổi thời gian khám?
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Nếu bạn cần đổi khung giờ khác hoặc cần hỗ trợ gấp, vui lòng liên hệ trực tiếp tổng đài phòng khám SmartPetCare qua hotline: <strong className="text-slate-800">1900 6868</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Confirmation Modal ───────────────────────────────── */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận hủy lịch hẹn</h3>
                <p className="text-xs text-slate-500">Lịch hẹn #{appointmentId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy lịch hẹn khám này? Khung giờ hẹn sẽ được hoàn trả lại để phục vụ các khách hàng khác.
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
                onClick={() => setIsCancelModalOpen(false)}
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
