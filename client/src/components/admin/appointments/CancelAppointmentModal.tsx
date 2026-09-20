"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  Calendar,
  Clock,
  User,
  Heart,
  FileText,
  Loader2,
  Ban,
} from "lucide-react";
import type { Appointment } from "@/types/appointment.type";
import { appointmentService } from "@/services/appointmentService";
import { useToast } from "@/components/ui/Toast";

interface CancelAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const apptId = appointment.appointment_id ?? appointment.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do hủy lịch hẹn.");
      return;
    }
    if (trimmed.length < 5) {
      setError("Lý do hủy phải có ít nhất 5 ký tự.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await appointmentService.cancel(apptId, trimmed);
      toast.success("Hủy lịch hẹn thành công!");
      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi hủy lịch hẹn. Vui lòng thử lại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setReason("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác nhận Hủy Lịch Hẹn</h3>
                <p className="text-xs text-slate-500">Mã lịch hẹn: #{apptId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Appointment Brief Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Heart className="w-4 h-4 text-pink-500" /> Thú cưng:
                </span>
                <span className="font-bold text-slate-900">
                  {appointment.pet_name || "Thú cưng"}
                  {appointment.pet_species && (
                    <span className="ml-1 text-xs text-slate-500 font-normal">
                      ({appointment.pet_species === "dog" ? "Chó" : appointment.pet_species === "cat" ? "Mèo" : appointment.pet_species})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <User className="w-4 h-4 text-blue-500" /> Chủ nuôi:
                </span>
                <span className="font-semibold text-slate-800">{appointment.owner_name || "Chủ nuôi"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Ngày & Giờ:
                </span>
                <span className="font-semibold text-slate-800">
                  {appointment.appointment_date || "N/A"} • {appointment.start_time || "N/A"}
                  {appointment.end_time ? ` - ${appointment.end_time}` : ""}
                </span>
              </div>

              {appointment.service_name && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <FileText className="w-4 h-4 text-amber-500" /> Dịch vụ:
                  </span>
                  <span className="font-medium text-slate-700">{appointment.service_name}</span>
                </div>
              )}
            </div>

            {/* Cancel Reason Field (Mandatory) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-800">
                Lý do hủy <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Nhập lý do hủy lịch hẹn (bắt buộc, vd: Khách hàng bận đột xuất, Bác sĩ có ca phẫu thuật khẩn...)"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 transition-colors ${
                  error
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-slate-200 focus:border-rose-400 focus:ring-rose-100"
                }`}
                disabled={isSubmitting}
                autoFocus
              />
              {error && <p className="text-xs font-medium text-rose-600 mt-1">{error}</p>}
            </div>

            {/* Notice */}
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              Lưu ý: Lịch hẹn sau khi hủy sẽ chuyển sang trạng thái <strong>Cancelled</strong> và không thể hoàn tác. Khách hàng sẽ nhận được thông báo về lý do hủy.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Xác nhận Hủy Lịch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CancelAppointmentModal;
