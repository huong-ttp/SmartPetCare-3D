"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  Heart,
  FileText,
  Stethoscope,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Ban,
  ArrowRight,
} from "lucide-react";
import type { Appointment } from "@/types/appointment.type";
import { cn } from "@/utils/cn";

interface AppointmentDetailModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onOpenCancelModal?: (appointment: Appointment) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onOpenCancelModal,
}) => {
  const router = useRouter();

  if (!isOpen || !appointment) return null;

  const apptId = appointment.appointment_id ?? appointment.id;
  const isConfirmed = appointment.status === "confirmed";
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";
  const needsDoctor = isConfirmed && !appointment.doctor_id;

  const handleGoToAssign = () => {
    onClose();
    router.push(`/admin/appointments/${apptId}/assign`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-900 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900">Chi tiết Lịch hẹn</h3>
                  <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    #{apptId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Xem đầy đủ thông tin cuộc hẹn và phân công bác sĩ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge - confirmed | completed | cancelled ONLY */}
              {isConfirmed && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5" /> Đã hủy
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Unassigned Warning Banner */}
            {needsDoctor && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Lịch hẹn chưa được gán bác sĩ!</h4>
                    <p className="text-xs text-amber-800/80">Vui lòng phân công bác sĩ phụ trách trước giờ hẹn.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoToAssign}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Gán bác sĩ ngay <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If Cancelled: Show cancellation reason */}
            {isCancelled && appointment.cancel_reason && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
                  <Ban className="w-4 h-4" /> Lý do hủy lịch
                </div>
                <p className="text-sm text-rose-900 italic font-medium">{appointment.cancel_reason}</p>
              </div>
            )}

            {/* Grid 2 Columns: Pet & Owner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pet Info Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-pink-600 text-xs font-bold uppercase tracking-wider">
                  <Heart className="w-4 h-4" /> Thông tin Thú cưng
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tên bé:</span>
                    <span className="font-bold text-slate-900">{appointment.pet_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loài & Giống:</span>
                    <span className="font-medium text-slate-800">
                      {appointment.pet_species === "dog" ? "Chó" : appointment.pet_species === "cat" ? "Mèo" : appointment.pet_species || "N/A"}
                      {appointment.pet_breed ? ` - ${appointment.pet_breed}` : ""}
                    </span>
                  </div>
                  {appointment.pet_weight && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cân nặng:</span>
                      <span className="font-medium text-slate-800">{appointment.pet_weight} kg</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Info Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                  <User className="w-4 h-4" /> Thông tin Chủ nuôi
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Họ và tên:</span>
                    <span className="font-bold text-slate-900">{appointment.owner_name || "N/A"}</span>
                  </div>
                  {appointment.owner_phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Số điện thoại:
                      </span>
                      <span className="font-medium text-slate-800">{appointment.owner_phone}</span>
                    </div>
                  )}
                  {appointment.owner_email && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email:
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[180px]">{appointment.owner_email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule & Service Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4" /> Lịch khám & Dịch vụ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-slate-200">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">Ngày hẹn</span>
                    <span className="font-bold text-slate-900">{appointment.appointment_date || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-slate-200">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">Khung giờ</span>
                    <span className="font-bold text-slate-900">
                      {appointment.start_time || "N/A"} {appointment.end_time ? `- ${appointment.end_time}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {appointment.service_name && (
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Dịch vụ yêu cầu:</span>
                    <span className="font-bold text-slate-900">{appointment.service_name}</span>
                  </div>
                  {appointment.service_price !== undefined && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Chi phí dự kiến:</span>
                      <span className="font-bold text-emerald-600">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                          appointment.service_price
                        )}
                      </span>
                    </div>
                  )}
                  {appointment.service_description && (
                    <p className="text-xs text-slate-500 pt-1">{appointment.service_description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Doctor Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4" /> Bác sĩ phụ trách
                </div>
                {appointment.doctor_id ? (
                  <span className="text-xs text-slate-500">ID: #{appointment.doctor_id}</span>
                ) : null}
              </div>

              {appointment.doctor_id ? (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{appointment.doctor_name || "Bác sĩ phụ trách"}</h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {appointment.doctor_phone && <span>{appointment.doctor_phone}</span>}
                        {appointment.doctor_email && <span>{appointment.doctor_email}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-dashed border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Chưa có bác sĩ nào được phân công cho lịch hẹn này.</span>
                  </div>
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={handleGoToAssign}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Gán bác sĩ
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Reason & Notes */}
            {(appointment.reason || appointment.notes) && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
                {appointment.reason && (
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">Lý do khám / Triệu chứng:</span>
                    <p className="text-slate-800 mt-0.5">{appointment.reason}</p>
                  </div>
                )}
                {appointment.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 font-bold block">Ghi chú thêm:</span>
                    <p className="text-slate-800 mt-0.5">{appointment.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
              {isConfirmed && onOpenCancelModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCancelModal(appointment);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" /> Hủy lịch hẹn
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {needsDoctor && (
                <button
                  type="button"
                  onClick={handleGoToAssign}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Gán bác sĩ
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppointmentDetailModal;
