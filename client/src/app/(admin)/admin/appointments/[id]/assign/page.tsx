"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Heart,
  FileText,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Phone,
  Mail,
  Search,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import type { Appointment } from "@/types/appointment.type";
import type { User as UserType } from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { appointmentService } from "@/services/appointmentService";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function AssignDoctorPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const appointmentId = params?.id as string;

  // State
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [searchDoctor, setSearchDoctor] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load appointment context & active doctors list
  const loadData = useCallback(async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [apptData, docsList] = await Promise.all([
        adminService.getAppointmentById(appointmentId),
        adminService.listDoctors({ is_active: true }),
      ]);

      setAppointment(apptData);

      // Only allow active doctors
      const activeDoctors = (docsList || []).filter(
        (d) => d.role === "doctor" && d.is_active !== false
      );
      setDoctors(activeDoctors);

      // If appointment already has a doctor, preselect
      if (apptData?.doctor_id) {
        setSelectedDoctorId(String(apptData.doctor_id));
      } else if (activeDoctors.length > 0) {
        setSelectedDoctorId(String(activeDoctors[0].id));
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin gán bác sĩ:", err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải thông tin lịch hẹn hoặc danh sách bác sĩ."
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle submit assignment
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error("Vui lòng chọn một bác sĩ để phụ trách lịch hẹn.");
      return;
    }

    if (!appointment) return;

    if (appointment.status !== "confirmed") {
      toast.error("Chỉ có lịch hẹn ở trạng thái 'Đã xác nhận' mới có thể gán bác sĩ.");
      return;
    }

    setIsSubmitting(true);
    try {
      await appointmentService.assignDoctor(appointmentId, selectedDoctorId);
      toast.success("Gán bác sĩ cho lịch hẹn thành công!");
      router.push("/admin/appointments");
    } catch (err: any) {
      console.error("Lỗi khi gán bác sĩ:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi gán bác sĩ. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered doctors list
  const filteredDoctors = doctors.filter((doc) => {
    if (!searchDoctor.trim()) return true;
    const query = searchDoctor.toLowerCase();
    return (
      doc.full_name?.toLowerCase().includes(query) ||
      doc.email?.toLowerCase().includes(query) ||
      doc.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back to list navigation */}
      <div>
        <Link
          href="/admin/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách lịch hẹn</span>
        </Link>
      </div>

      {/* Page Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Phân công Bác sĩ
              </h1>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                #{appointmentId}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gán bác sĩ phụ trách khám và chăm sóc cho thú cưng theo lịch hẹn đã xác nhận
            </p>
          </div>
        </div>

        {appointment && (
          <div>
            {appointment.status === "confirmed" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lịch hẹn Đã xác nhận
              </span>
            )}
            {appointment.status === "completed" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Đã hoàn thành
              </span>
            )}
            {appointment.status === "cancelled" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Đã hủy
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : errorMessage ? (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 text-rose-700 space-y-4 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Không thể tải thông tin</h3>
            <p className="text-sm text-slate-500 mt-1">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : appointment ? (
        <form onSubmit={handleAssign} className="space-y-6">
          {/* Appointment Status Warning if not confirmed */}
          {appointment.status !== "confirmed" && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-sm font-medium">
                Lịch hẹn này có trạng thái <strong>{appointment.status}</strong>. Chỉ có lịch hẹn ở trạng thái <strong>confirmed</strong> mới có thể gán hoặc thay đổi bác sĩ.
              </span>
            </div>
          )}

          {/* Context Card: Pet, Owner, Service, Date/Time, Reason */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Thông tin Lịch hẹn (Context)
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pet Info */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-sm">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-pink-600">
                  <Heart className="w-3.5 h-3.5" /> Thú cưng
                </span>
                <div className="pt-0.5">
                  <div className="text-base font-bold text-slate-900">{appointment.pet_name || "Thú cưng"}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Loài: {appointment.pet_species === "dog" ? "Chó" : appointment.pet_species === "cat" ? "Mèo" : appointment.pet_species || "N/A"}
                    {appointment.pet_breed && ` • Giống: ${appointment.pet_breed}`}
                    {appointment.pet_weight && ` • ${appointment.pet_weight} kg`}
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-sm">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600">
                  <User className="w-3.5 h-3.5" /> Chủ nuôi
                </span>
                <div className="pt-0.5">
                  <div className="text-base font-bold text-slate-900">{appointment.owner_name || "Chủ nuôi"}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    {appointment.owner_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {appointment.owner_phone}
                      </span>
                    )}
                    {appointment.owner_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {appointment.owner_email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-sm">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600">
                  <FileText className="w-3.5 h-3.5" /> Dịch vụ yêu cầu
                </span>
                <div className="pt-0.5">
                  <div className="font-bold text-slate-900">{appointment.service_name || "Khám sức khỏe tổng quát"}</div>
                  {appointment.service_price !== undefined && (
                    <div className="text-xs text-emerald-600 font-bold mt-0.5">
                      Giá: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(appointment.service_price)}
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time Info */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-sm">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-600">
                  <Calendar className="w-3.5 h-3.5" /> Thời gian hẹn
                </span>
                <div className="pt-0.5">
                  <div className="font-bold text-slate-900">
                    {appointment.appointment_date || "Chưa xác định"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {appointment.start_time || "N/A"} {appointment.end_time ? `- ${appointment.end_time}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason & Notes */}
            {(appointment.reason || appointment.notes) && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-sm">
                {appointment.reason && (
                  <div>
                    <span className="text-xs font-bold text-slate-600">Lý do khám:</span>
                    <p className="text-slate-800 mt-0.5">{appointment.reason}</p>
                  </div>
                )}
                {appointment.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Ghi chú bổ sung:</span>
                    <p className="text-slate-800 mt-0.5">{appointment.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor Selection Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <span>Chọn Bác sĩ phụ trách</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ hiển thị danh sách bác sĩ có tài khoản đang hoạt động (role=doctor & is_active=true)
                </p>
              </div>

              {/* Search doctor input */}
              {doctors.length > 3 && (
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchDoctor}
                    onChange={(e) => setSearchDoctor(e.target.value)}
                    placeholder="Tìm tên bác sĩ..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Doctor Select Cards */}
            {doctors.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800">Không có bác sĩ nào khả dụng</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hiện tại không có tài khoản Bác sĩ nào đang hoạt động trong hệ thống.
                </p>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Không tìm thấy bác sĩ nào khớp với từ khóa &ldquo;{searchDoctor}&rdquo;
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredDoctors.map((doc) => {
                  const docId = String(doc.id);
                  const isSelected = selectedDoctorId === docId;

                  return (
                    <div
                      key={docId}
                      onClick={() => setSelectedDoctorId(docId)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all duration-200 relative flex items-start gap-3.5",
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      {/* Avatar Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border transition-colors",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {doc.full_name?.charAt(0) || "B"}
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {doc.full_name || "Bác sĩ"}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                            Active
                          </span>
                        </div>

                        <div className="space-y-0.5 mt-1 text-xs text-slate-500">
                          {doc.email && (
                            <div className="truncate flex items-center gap-1.5">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{doc.email}</span>
                            </div>
                          )}
                          {doc.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{doc.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Checkmark when selected */}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <Link
              href="/admin/appointments"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy & Quay lại
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !selectedDoctorId || appointment.status !== "confirmed"}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Xác nhận Gán Bác sĩ</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
