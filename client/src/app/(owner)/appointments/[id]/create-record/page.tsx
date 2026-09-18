"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dog,
  Cat,
  Stethoscope,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  Pill,
  Sparkles,
  Loader2,
  AlertTriangle,
  Weight,
  Syringe,
  Receipt,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Scale,
  CalendarDays,
  Plus,
  Minus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { appointmentService } from "@/services/appointmentService";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { Appointment } from "@/types/appointment.type";
import type { CreateMedicalRecordDTO } from "@/types/medical-record.type";
import { useToast } from "@/components/ui/Toast";
import DoctorBadge3D from "@/components/doctor/DoctorBadge3D";
import { cn } from "@/utils/cn";

// Common clinical diagnosis templates for instant 1-click insertion
const DIAGNOSIS_PRESETS = [
  "Khám tổng quát: Thể trạng bình thường, tim phổi đều, niêm mạc hồng hào.",
  "Viêm da dị ứng & viêm nang lông nhẹ, có mảng đỏ và ngứa cục bộ.",
  "Viêm tai ngoài (Otitis externa) thứ phát do nấm men Malassezia.",
  "Rối loạn tiêu hóa cấp: Nôn khan, phân lỏng nhẹ, mất nước nhẹ.",
  "Viêm đường hô hấp trên nhẹ: Hắt hơi, chảy nước mũi trong, không sốt.",
];

const TREATMENT_PRESETS = [
  "Vệ sinh tai bằng dung dịch sát trùng Epi-Otic, làm sạch ống tai.",
  "Tắm trị liệu bằng sữa tắm Malaseb 2 lần/tuần, sấy khô hoàn toàn.",
  "Bù nước điện giải đường uống Oresol, men vi sinh ổn định đường ruột.",
  "Khí dung thuốc giãn phế quản và kháng sinh hô hấp 15 phút tại phòng khám.",
];

const PRESCRIPTION_PRESETS = [
  "1. Surolan 15ml (nhỏ tai 4-5 giọt x 2 lần/ngày trong 7-10 ngày).\n2. Vệ sinh tai trước khi nhỏ thuốc.",
  "1. Cefalexin 250mg (uống 1 viên x 2 lần/ngày sau ăn, liệu trình 7 ngày).\n2. Dầu cá Omega-3 hỗ trợ da lông (1 viên/ngày).",
  "1. Bio-Lactomin men tiêu hóa (1 gói x 2 lần/ngày pha nước ấm sau ăn).\n2. Smecta (uống 1/2 gói cách thuốc khác 2 giờ).",
];

export default function CreateMedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { user, requireRole } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const appointmentId = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields (matching MEDICAL_RECORDS entity)
  const [recordDate, setRecordDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [treatment, setTreatment] = useState<string>("");
  const [prescription, setPrescription] = useState<string>("");
  const [weightAtVisit, setWeightAtVisit] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success Navigation Dialog State
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [savedRecordId, setSavedRecordId] = useState<string | number | null>(null);

  // Guard: Doctor role check
  useEffect(() => {
    requireRole("doctor");
  }, [requireRole]);

  // Fetch Appointment Details
  const loadAppointment = useCallback(async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await appointmentService.getById(appointmentId);
      setAppointment(data);

      // Pre-populate weight from pet if available
      if (data.pet_weight) {
        setWeightAtVisit(String(data.pet_weight));
      }
    } catch (err: any) {
      console.error("[CreateRecord] Fetch appointment failed:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải thông tin lịch hẹn ca khám."
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  // Check if current user is doctor
  const isDoctor = user?.role === "doctor";

  // Check if assigned doctor matches current logged-in doctor
  const isAssigned = useMemo(() => {
    if (!appointment || !user) return false;
    const currentUserId = String(user.id ?? user.user_id ?? "");
    const apptDoctorId = String(appointment.doctor_id ?? "");
    // If not assigned yet or belongs to another doctor
    return Boolean(currentUserId && apptDoctorId && currentUserId === apptDoctorId);
  }, [appointment, user]);

  // Access conditions:
  // 1. Status MUST be 'confirmed'
  // 2. Doctor MUST be current doctor
  const isConfirmed = appointment?.status === "confirmed";
  const isCompleted = appointment?.status === "completed";
  const isCancelled = appointment?.status === "cancelled";

  // Weight adjust helpers
  const handleWeightAdjust = (delta: number) => {
    const current = parseFloat(weightAtVisit) || 0;
    const nextVal = Math.max(0.1, Math.round((current + delta) * 10) / 10);
    setWeightAtVisit(nextVal.toFixed(1));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      setValidationError("Chẩn đoán lâm sàng (Diagnosis) là bắt buộc. Vui lòng nhập kết luận khám.");
      return;
    }

    if (weightAtVisit && (isNaN(Number(weightAtVisit)) || Number(weightAtVisit) <= 0)) {
      setValidationError("Cân nặng khi khám phải là số dương hợp lệ (kg).");
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    try {
      const payload: CreateMedicalRecordDTO = {
        appointment_id: Number(appointment?.appointment_id || appointment?.id) || appointment?.id || appointmentId,
        pet_id: Number(appointment?.pet_id) || appointment?.pet_id || "",
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim() || undefined,
        prescription: prescription.trim() || undefined,
        weight_at_visit: weightAtVisit ? Number(weightAtVisit) : undefined,
        record_date: recordDate || new Date().toISOString().split("T")[0],
        notes: notes.trim() || undefined,
      };

      // Call API: medical-record.service.create({...})
      const result = await medicalRecordService.create(payload);

      // Extract new medical record ID
      const newRecId =
        result?.medical_record?.record_id ??
        result?.medical_record?.id ??
        result?.record_id ??
        result?.id ??
        "mr_" + Date.now();

      setSavedRecordId(newRecId);

      // Update local appointment status
      if (appointment) {
        setAppointment({
          ...appointment,
          status: "completed",
          medical_record_id: String(newRecId),
        });
      }

      showToastSuccess(
        "Đã tạo hồ sơ bệnh án thành công! Ca khám hoàn tất và Hóa đơn đã được tạo tự động."
      );

      // Display the success prompt modal to guide next navigation
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("[CreateRecord] Save failed:", err);
      showToastError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lưu hồ sơ bệnh án. Vui lòng thử lại."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isCat =
    appointment?.pet_species?.toLowerCase() === "cat" ||
    appointment?.pet_species?.toLowerCase() === "mèo";

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* ─── Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/doctor/dashboard" className="hover:text-[#0EA5B7] transition-colors">
            Bác sĩ
          </Link>
          <span>/</span>
          <Link href="/doctor/appointments" className="hover:text-[#0EA5B7] transition-colors">
            Lịch hẹn khám
          </Link>
          <span>/</span>
          <Link
            href={`/appointments/${appointmentId}`}
            className="hover:text-[#0EA5B7] transition-colors"
          >
            Ca khám #{appointmentId}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Phòng khám & Tạo bệnh án</span>
        </div>

        <Link
          href={`/appointments/${appointmentId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại ca khám</span>
        </Link>
      </div>

      {/* ─── Loading Skeleton ────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-white rounded-3xl border border-slate-200/80 p-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-white rounded-2xl border border-slate-200/80" />
            <div className="h-24 bg-white rounded-2xl border border-slate-200/80" />
            <div className="h-24 bg-white rounded-2xl border border-slate-200/80" />
            <div className="h-24 bg-white rounded-2xl border border-slate-200/80" />
          </div>
          <div className="h-96 bg-white rounded-3xl border border-slate-200/80 p-8" />
        </div>
      )}

      {/* ─── Error Loading Appointment ───────────────────────────────── */}
      {!isLoading && errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto mt-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-rose-950">Lỗi tải dữ liệu lịch hẹn</h3>
            <p className="text-xs text-rose-800 leading-relaxed">{errorMessage}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={loadAppointment}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-sm"
            >
              Thử lại
            </button>
            <Link
              href="/doctor/appointments"
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Về danh sách lịch hẹn
            </Link>
          </div>
        </div>
      )}

      {/* ─── Permission Guard 1: Not a Doctor ────────────────────────── */}
      {!isLoading && !errorMessage && !isDoctor && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto mt-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-amber-950">Quyền truy cập hạn chế</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Màn hình tạo Bệnh án và Khám bệnh chỉ dành riêng cho Bác sĩ thú y phụ trách ca khám.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0c8f9f] transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              <span>Quay về Lịch hẹn của bạn</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Permission Guard 2: Not Assigned Doctor ─────────────────── */}
      {!isLoading && !errorMessage && isDoctor && appointment && !isAssigned && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto mt-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-amber-950">Không thuộc quyền xử lý</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Bạn không được phân công cho ca khám này. Lịch hẹn chưa được chỉ định hoặc đã được phân
              công cho một bác sĩ khác trong hệ thống.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0c8f9f] transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              <span>Quay lại Lịch hẹn Bác sĩ</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Permission Guard 3: Already Completed ─────────────────────── */}
      {!isLoading && !errorMessage && isDoctor && appointment && isAssigned && isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto mt-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-emerald-950">Ca khám đã hoàn tất!</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Hồ sơ bệnh án cho ca khám #{appointmentId} đã được tạo và lưu thành công trước đó. Bạn
              không cần tạo thêm bệnh án cho ca khám này.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {appointment.medical_record_id && (
              <Link
                href={`/medical-records/${appointment.medical_record_id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md"
              >
                <FileText size={15} />
                <span>Xem bệnh án đã lưu</span>
              </Link>
            )}
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Quay lại danh sách lịch hẹn</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Permission Guard 4: Cancelled ─────────────────────────────── */}
      {!isLoading && !errorMessage && isDoctor && appointment && isAssigned && isCancelled && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto mt-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-rose-950">Ca khám đã bị hủy</h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              Lịch hẹn này đã bị hủy trước đó. Không thể thực hiện khám lâm sàng hoặc tạo hồ sơ bệnh án.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              <span>Quay lại Lịch hẹn Bác sĩ</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── MAIN DOCTOR ROOM & CLINICAL FORM ───────────────────────────── */}
      {!isLoading && !errorMessage && isDoctor && appointment && isAssigned && isConfirmed && (
        <div className="space-y-6">
          {/* 3D Doctor Room Hero Console */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800/80">
            {/* Background Glow */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#0EA5B7]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold backdrop-blur-md border border-white/10">
                  <Stethoscope size={14} className="animate-pulse text-[#0EA5B7]" />
                  <span>Phòng Khám Lâm Sàng 3D — SmartPetCare Doctor Room</span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-white tracking-tight">
                  Tạo Hồ Sơ Bệnh Án Cho Bé {appointment.pet_name || "Thú cưng"}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bác sĩ ghi nhận kết quả chẩn đoán, cân nặng đo tại phòng khám, phác đồ điều trị và đơn thuốc. Khi hoàn tất, hệ thống sẽ tự động cập nhật lịch hẹn sang <span className="font-semibold text-emerald-400">Hoàn thành</span> và <span className="font-semibold text-cyan-400">tự động xuất Hóa đơn</span>.
                </p>
              </div>

              {/* 3D Doctor Badge & Quick Info Badge */}
              <div className="flex items-center gap-4 shrink-0 self-start lg:self-center">
                <DoctorBadge3D className="w-28 h-28 hidden sm:block drop-shadow-2xl" />
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-right space-y-0.5">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                    Mã Lịch Hẹn
                  </span>
                  <span className="text-base font-extrabold text-white">#{appointmentId}</span>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                    Đã xác nhận
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── READ-ONLY CONTEXT HEADER (Pet, Owner, Service, Time, Reason) ─── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#0EA5B7]" />
                <span>Thông Tin Bệnh Nhân & Lịch Hẹn (Read-only Context)</span>
              </h2>
              <span className="text-[11px] text-slate-400">Trích xuất từ lịch hẹn #{appointmentId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pet Context */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold shadow-xs",
                    isCat
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "bg-sky-50 text-[#0EA5B7] border border-sky-200"
                  )}
                >
                  {isCat ? <Cat size={24} /> : <Dog size={24} />}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Thú Cưng
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {appointment.pet_name || "Thú cưng"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {appointment.pet_breed || (isCat ? "Mèo" : "Chó")}
                    {appointment.pet_weight ? ` • ${appointment.pet_weight}kg` : ""}
                  </p>
                </div>
              </div>

              {/* Owner Context */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Chủ Nuôi
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {appointment.owner_name || "Khách hàng"}
                  </p>
                  {appointment.owner_phone ? (
                    <a
                      href={`tel:${appointment.owner_phone}`}
                      className="text-xs text-[#0EA5B7] hover:underline flex items-center gap-1 font-medium truncate"
                    >
                      <Phone size={11} />
                      <span>{appointment.owner_phone}</span>
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400">Chưa có số ĐT</p>
                  )}
                </div>
              </div>

              {/* Service Context */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                  <Stethoscope size={24} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dịch Vụ Đã Đặt
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {appointment.service_name || "Khám bệnh lâm sàng"}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">Theo lịch hẹn</p>
                </div>
              </div>

              {/* Schedule Context */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0EA5B7] border border-cyan-200 flex items-center justify-center shrink-0 shadow-xs">
                  <Clock size={24} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Khung Giờ Khám
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {appointment.start_time || "08:30"}{" "}
                    {appointment.end_time ? `— ${appointment.end_time}` : ""}
                  </p>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {appointment.appointment_date || "Hôm nay"}
                  </p>
                </div>
              </div>
            </div>

            {/* Symptoms & Owner Notes Context Card */}
            {(appointment.reason || appointment.notes) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 border border-sky-200/80 shadow-xs flex items-start gap-3.5 text-xs text-slate-700">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0EA5B7] flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle size={18} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">
                      Lý do khám / Triệu chứng ban đầu:
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100/70 text-sky-800 text-[10px] font-bold">
                      Chủ nuôi cung cấp
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {appointment.reason || "Không có mô tả triệu chứng ban đầu."}
                  </p>
                  {appointment.notes && (
                    <p className="text-slate-500 pt-1 border-t border-sky-100">
                      <span className="font-semibold text-slate-700">Ghi chú bổ sung:</span> {appointment.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── FORM: MEDICAL_RECORDS ENTRY ──────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-[#0EA5B7]" />
                    <span>Nội Dung Hồ Sơ Bệnh Án</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhập chẩn đoán và hướng dẫn điều trị y khoa cho bé
                  </p>
                </div>
                <span className="text-xs text-rose-500 font-semibold">* Trường bắt buộc nhập</span>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <span className="font-semibold">{validationError}</span>
                </div>
              )}

              {/* Row 1: Record Date & Weight at Visit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Field: Record Date */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-[#0EA5B7]" />
                    <span>Ngày Khám Bệnh (Record Date)</span>
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
                  />
                  <p className="text-[11px] text-slate-400">Mặc định hôm nay, có thể chỉnh sửa nếu cần</p>
                </div>

                {/* Field: Weight at Visit (VALID PLACE FOR DOCTOR TO ENTER WEIGHT) */}
                <div className="space-y-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Scale size={14} className="text-[#0EA5B7]" />
                      <span>Cân Nặng Tại Thời Điểm Khám (Weight at Visit — kg)</span>
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Sẽ cập nhật hồ sơ thể trọng
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="200"
                        value={weightAtVisit}
                        onChange={(e) => setWeightAtVisit(e.target.value)}
                        placeholder="Ví dụ: 4.5"
                        className="w-full pl-4 pr-12 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        kg
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleWeightAdjust(-0.1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        title="Giảm 0.1 kg"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWeightAdjust(0.1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        title="Tăng 0.1 kg"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Đây là nơi bác sĩ cập nhật thể trọng chính xác trong buổi khám. Cân nặng này sẽ được lưu vào bệnh án và đồng bộ vào thể trọng của thú cưng.
                  </p>
                </div>
              </div>

              {/* Field: Diagnosis (REQUIRED) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Chẩn Đoán Lâm Sàng (Diagnosis) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Bắt buộc • {diagnosis.length} ký tự
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={diagnosis}
                  onChange={(e) => {
                    setDiagnosis(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Ví dụ: Bé bị viêm tai ngoài bên trái do nấm Malassezia kết hợp vi khuẩn; nhiệt độ 38.6°C, phản xạ tốt..."
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all",
                    validationError && !diagnosis.trim()
                      ? "border-rose-300 ring-2 ring-rose-200/50 bg-rose-50/20"
                      : "border-slate-200 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
                  )}
                  required
                />

                {/* Quick Presets for Diagnosis */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Mẫu gợi ý nhanh:</span>
                  {DIAGNOSIS_PRESETS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDiagnosis(item)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#0EA5B7]/10 hover:text-[#0EA5B7] text-[11px] font-medium text-slate-600 transition-colors text-left truncate max-w-xs"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field: Treatment */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Phác Đồ Điều Trị & Thủ Thuật (Treatment)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tùy chọn</span>
                </label>
                <textarea
                  rows={2}
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Ví dụ: Rửa sạch ống tai bằng dung dịch Epi-Otic, nhỏ thuốc đặc trị Surolan 5 giọt. Hướng dẫn chủ nuôi vệ sinh tai hàng ngày..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
                />

                {/* Quick Presets for Treatment */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Thủ thuật phổ biến:</span>
                  {TREATMENT_PRESETS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTreatment((prev) => (prev ? `${prev}\n${item}` : item))}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#0EA5B7]/10 hover:text-[#0EA5B7] text-[11px] font-medium text-slate-600 transition-colors text-left truncate max-w-xs"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field: Prescription */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Pill size={14} className="text-[#0EA5B7]" />
                    <span>Đơn Thuốc & Hướng Dẫn Sử Dụng (Prescription)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Tùy chọn</span>
                </label>
                <textarea
                  rows={3}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Ví dụ: 1. Surolan 15ml (nhỏ tai 2 lần/ngày, mỗi lần 4 giọt, dùng 7 ngày)&#10;2. Men tiêu hóa Bio-Lactomin (uống 1 gói/ngày sau ăn)"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all font-mono text-xs"
                />

                {/* Quick Presets for Prescription */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Đơn thuốc mẫu:</span>
                  {PRESCRIPTION_PRESETS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrescription(item)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#0EA5B7]/10 hover:text-[#0EA5B7] text-[11px] font-medium text-slate-600 transition-colors text-left truncate max-w-xs"
                    >
                      Mẫu {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field: Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Lời Dặn Bác Sĩ & Hẹn Tái Khám (Doctor Notes)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tùy chọn</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Giữ tai khô ráo, tránh nước khi tắm. Tái khám sau 7 ngày hoặc khi có biểu hiện ngứa tăng nặng..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
                />
              </div>

              {/* Form Action Controls */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                  href={`/appointments/${appointmentId}`}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold text-center transition-colors"
                >
                  Hủy bỏ & Quay lại
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0EA5B7] to-teal-600 hover:from-[#0c8f9f] hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-[#0EA5B7]/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang lưu bệnh án & Tạo hóa đơn...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Lưu Bệnh Án & Hoàn Tất Ca Khám</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ─── SUCCESS & NEXT-STEP NAVIGATION MODAL (Prompt 24 Bridge) ──── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header with success badge */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/20">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-xl font-heading font-extrabold text-slate-900">
                  Hoàn Tất Ca Khám Thành Công!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hồ sơ bệnh án điện tử đã được khởi tạo và lưu vào hệ thống
                </p>
              </div>
            </div>

            {/* Auto Invoiced Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0EA5B7] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Receipt size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Hóa đơn đã được tạo tự động
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Hệ thống đã tự sinh hóa đơn viện phí cho ca khám #{appointmentId} để chủ nuôi thanh toán.
                </p>
              </div>
            </div>

            {/* Suggested Next Step: Vaccination Entry Prompt */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Syringe size={18} className="text-emerald-600" />
                <span>Ghi nhận tiêm phòng cho lần khám này?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nếu trong buổi khám có thực hiện tiêm vắc xin cho bé {appointment?.pet_name || "thú cưng"}, bác sĩ có thể chuyển tiếp để ghi nhận mũi tiêm kèm mã bệnh án vừa tạo.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const recId = savedRecordId || "mr_latest";
                    const petId = appointment?.pet_id || "";
                    // Navigate to Prompt 24 (Vaccination Create at /appointments/[id]/vaccinate) with medical_record_id attached
                    router.push(
                      `/appointments/${appointmentId}/vaccinate?medical_record_id=${recId}&pet_id=${petId}`
                    );
                  }}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 active:scale-95 cursor-pointer"
                >
                  <Syringe size={15} />
                  <span>Có, ghi nhận tiêm phòng ngay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push("/doctor/appointments");
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  Không, về danh sách lịch hẹn
                </button>
              </div>
            </div>

            {/* Alternative Direct Link */}
            <div className="text-center pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  router.push(`/appointments/${appointmentId}`);
                }}
                className="text-xs font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
              >
                <span>Xem lại chi tiết ca khám #{appointmentId}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
