"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dog,
  Cat,
  Stethoscope,
  Syringe,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  CalendarClock,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  Tag,
  Hash,
  Award,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { appointmentService } from "@/services/appointmentService";
import { petService } from "@/services/petService";
import { medicalRecordService } from "@/services/medicalRecordService";
import { vaccineTypeService } from "@/services/vaccineTypeService";
import { vaccinationService } from "@/services/vaccinationService";
import type { Appointment } from "@/types/appointment.type";
import type { Pet } from "@/types/pet.type";
import type { MedicalRecord } from "@/types/medical-record.type";
import type { VaccineType, CreatePetVaccinationDTO } from "@/types/vaccination.type";
import { useToast } from "@/components/ui/Toast";
import DoctorBadge3D from "@/components/doctor/DoctorBadge3D";
import { cn } from "@/utils/cn";

interface VaccineRow {
  rowId: string;
  vaccineTypeId: string;
  dateAdministered: string;
  batchNumber: string;
  notes: string;
}

function computeNextDueDate(dateStr: string, intervalDays: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "---";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return dateStr;
  }
}

export default function DoctorVaccinationRecordPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, requireRole } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const appointmentId = params?.id as string;
  const initialMedicalRecordId = searchParams.get("medical_record_id") || "";
  const queryPetId = searchParams.get("pet_id") || "";

  // Data states
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);

  // UX states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success dialog state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [savedVaccinationsCount, setSavedVaccinationsCount] = useState<number>(0);
  const [savedPreviewList, setSavedPreviewList] = useState<
    Array<{ vaccineName: string; nextDueDate: string; batchNumber: string }>
  >([]);

  // Form rows for vaccination entries (Supports multiple vaccines per visit [RECOMMENDATION])
  const [vaccineRows, setVaccineRows] = useState<VaccineRow[]>([
    {
      rowId: "row_1",
      vaccineTypeId: "",
      dateAdministered: new Date().toISOString().split("T")[0],
      batchNumber: "",
      notes: "",
    },
  ]);

  // Guard: require doctor role
  useEffect(() => {
    requireRole("doctor");
  }, [requireRole]);

  // Load all initial contexts
  const loadContextData = useCallback(async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Load appointment details
      const apptData = await appointmentService.getById(appointmentId).catch(() => null);
      if (apptData) {
        setAppointment(apptData);
      }

      // 2. Determine target pet ID
      const targetPetId = apptData?.pet_id || queryPetId || "p1";
      if (targetPetId) {
        const petData = await petService.getById(targetPetId).catch(() => null);
        if (petData) {
          setPet(petData);
        }
      }

      // 3. Determine and load medical record context if provided or existing on appointment
      const medRecId =
        initialMedicalRecordId ||
        (apptData as any)?.medical_record_id ||
        (apptData as any)?.record_id;

      if (medRecId) {
        const medData = await medicalRecordService.getById(medRecId).catch(() => null);
        if (medData) {
          setMedicalRecord(medData);
        }
      }

      // 4. Load vaccine types catalog from vaccine-type.service.list()
      const vTypes = await vaccineTypeService.list();
      setVaccineTypes(vTypes);

      // Pre-select first vaccine type for row 1 if empty
      if (vTypes.length > 0) {
        setVaccineRows((prev) =>
          prev.map((row, idx) =>
            idx === 0 && !row.vaccineTypeId
              ? { ...row, vaccineTypeId: String(vTypes[0].id || vTypes[0].vaccine_type_id) }
              : row
          )
        );
      }
    } catch (err: any) {
      console.error("[DoctorVaccinatePage] Error loading context data:", err);
      setErrorMessage(
        err?.message || "Không thể tải thông tin lịch hẹn hoặc danh mục vắc xin. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, initialMedicalRecordId, queryPetId]);

  useEffect(() => {
    loadContextData();
  }, [loadContextData]);

  // Helper to find vaccine type object by ID
  const findVaccineType = useCallback(
    (typeId: string | number) => {
      const cleanId = String(typeId);
      return vaccineTypes.find(
        (vt) => String(vt.id) === cleanId || String(vt.vaccine_type_id) === cleanId
      );
    },
    [vaccineTypes]
  );

  // Add another vaccine row
  const handleAddRow = () => {
    const defaultTypeId = vaccineTypes[0]
      ? String(vaccineTypes[0].id || vaccineTypes[0].vaccine_type_id)
      : "";
    setVaccineRows((prev) => [
      ...prev,
      {
        rowId: "row_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        vaccineTypeId: defaultTypeId,
        dateAdministered: new Date().toISOString().split("T")[0],
        batchNumber: "",
        notes: "",
      },
    ]);
  };

  // Remove a vaccine row
  const handleRemoveRow = (rowId: string) => {
    if (vaccineRows.length <= 1) {
      showToastError("Phải ghi nhận ít nhất một mũi tiêm vắc xin.");
      return;
    }
    setVaccineRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  // Update specific row field
  const handleUpdateRow = (rowId: string, field: keyof VaccineRow, value: string) => {
    setVaccineRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate rows
    for (let i = 0; i < vaccineRows.length; i++) {
      const row = vaccineRows[i];
      if (!row.vaccineTypeId) {
        setValidationError(`Mũi tiêm #${i + 1}: Vui lòng chọn loại vắc xin tiêm phòng.`);
        return;
      }
      if (!row.dateAdministered) {
        setValidationError(`Mũi tiêm #${i + 1}: Vui lòng chọn ngày thực hiện tiêm.`);
        return;
      }
    }

    const targetPetId = pet?.id || appointment?.pet_id || queryPetId || "p1";
    const medRecId =
      medicalRecord?.id ||
      medicalRecord?.record_id ||
      initialMedicalRecordId ||
      appointment?.medical_record_id ||
      null;

    setIsSaving(true);

    try {
      const dtos: CreatePetVaccinationDTO[] = vaccineRows.map((row) => {
        const vt = findVaccineType(row.vaccineTypeId);
        const interval = vt?.recommended_interval_days ?? 365;
        const nextDue = computeNextDueDate(row.dateAdministered, interval);

        return {
          pet_id: targetPetId,
          vaccine_type_id: row.vaccineTypeId,
          medical_record_id: medRecId ? Number(medRecId) || medRecId : null,
          appointment_id: appointmentId ? Number(appointmentId) || appointmentId : undefined,
          date_administered: row.dateAdministered,
          batch_number: row.batchNumber.trim() || undefined,
          lot_number: row.batchNumber.trim() || undefined,
          notes: row.notes.trim() || undefined,
          next_due_date: nextDue,
        };
      });

      // Execute creation via vaccinationService.create / createMultiple
      await vaccinationService.createMultiple(dtos);

      // Build preview summary for the success modal
      const previewList = vaccineRows.map((row) => {
        const vt = findVaccineType(row.vaccineTypeId);
        const interval = vt?.recommended_interval_days ?? 365;
        return {
          vaccineName: vt?.name || "Vắc xin phòng bệnh",
          nextDueDate: computeNextDueDate(row.dateAdministered, interval),
          batchNumber: row.batchNumber.trim() || "Chưa nhập số lô",
        };
      });

      setSavedPreviewList(previewList);
      setSavedVaccinationsCount(dtos.length);
      setShowSuccessModal(true);
      showToastSuccess(
        `Đã ghi nhận thành công ${dtos.length} mũi tiêm vắc xin cho ${pet?.name || "thú cưng"}!`
      );
    } catch (err: any) {
      console.error("[DoctorVaccinatePage] Submit error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể lưu thông tin tiêm phòng. Vui lòng kiểm tra lại.";
      setValidationError(errMsg);
      showToastError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* ─── Breadcrumb Navigation ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/doctor/dashboard" className="hover:text-[#0EA5B7] transition-colors">
            Bác sĩ
          </Link>
          <span>/</span>
          <Link href="/doctor/appointments" className="hover:text-[#0EA5B7] transition-colors">
            Lịch hẹn
          </Link>
          <span>/</span>
          <Link
            href={`/appointments/${appointmentId}`}
            className="hover:text-[#0EA5B7] transition-colors"
          >
            Ca khám #{appointmentId}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Ghi nhận tiêm phòng</span>
        </div>

        <Link
          href={`/appointments/${appointmentId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại ca khám</span>
        </Link>
      </div>

      {/* ─── Header Hero Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#0EA5B7]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Syringe size={14} />
              <span>Sổ Tiêm Chủng Điện Tử • PET_VACCINATIONS</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>Ghi Nhận Tiêm Phòng Cho {pet?.name || "Bé Cưng"}</span>
                <span className="text-sm font-normal px-2.5 py-0.5 rounded-lg bg-white/10 text-emerald-300">
                  #{appointmentId}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                Ghi nhận chi tiết loại vắc xin, số lô sản xuất và ngày tiêm phòng. Hệ thống tự động
                tính toán và cố định hạn tiêm nhắc lại theo khuyến nghị lâm sàng.
              </p>
            </div>
          </div>

          {/* Current Doctor Badge (Administered by) */}
          <div className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-3xl p-3.5 backdrop-blur-md shrink-0 shadow-lg">
            <DoctorBadge3D className="w-16 h-16 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                Bác sĩ phụ trách tiêm
              </span>
              <span className="text-sm font-extrabold text-white block mt-0.5">
                {user?.full_name || "BS. Bác Sĩ Điều Trị"}
              </span>
              <span className="text-[11px] text-slate-300 block">
                Administered by Doctor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Loading State Skeleton ───────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Loader2 size={36} className="text-emerald-500 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Đang đồng bộ dữ liệu ca khám & vắc xin...</p>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống đang tải thông tin bệnh nhân, lịch hẹn và danh mục loại vắc xin
            </p>
          </div>
        </div>
      ) : errorMessage ? (
        /* ─── Error Alert Banner ─────────────────────────────────────── */
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải thông tin tiêm chủng</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={() => loadContextData()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
          >
            Thử tải lại
          </button>
        </div>
      ) : (
        /* ─── Main Content ───────────────────────────────────────────── */
        <div className="space-y-6">
          {/* ─── Context Read-only Cards (Pet + Appointment + Medical Record) ─ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Pet Context Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    {pet?.species?.toLowerCase() === "cat" ? (
                      <Cat size={14} className="text-teal-600" />
                    ) : (
                      <Dog size={14} className="text-emerald-600" />
                    )}
                    <span>Bệnh Nhân Thú Cưng</span>
                  </span>
                  {pet?.id && (
                    <Link
                      href={`/pets/${pet.id}`}
                      className="text-[11px] font-bold text-[#0EA5B7] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Hồ sơ</span>
                      <ExternalLink size={10} />
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0 border border-emerald-100">
                    {pet?.name?.charAt(0) || "P"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">
                      {pet?.name || appointment?.pet_name || "Chưa xác định"}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {pet?.species || appointment?.pet_species || "Thú cưng"} •{" "}
                      {pet?.breed || appointment?.pet_breed || "Chưa rõ giống"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-600 block">Cân nặng:</span>
                    <span className="font-semibold text-slate-800">
                      {pet?.weight_kg ? `${pet.weight_kg} kg` : "Chưa cân"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Giới tính:</span>
                    <span className="font-semibold text-slate-800">
                      {pet?.gender === "male"
                        ? "Đực"
                        : pet?.gender === "female"
                        ? "Cái"
                        : "Chưa rõ"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Mã Microchip:</span>
                    <span className="font-mono text-slate-700">
                      {pet?.microchip_number || "---"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Chủ nuôi:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {appointment?.owner_name || "Chủ nuôi"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Medical Record Context Card (Prompt 23 bridge) */}
            <div
              className={cn(
                "rounded-3xl border p-5 shadow-xs relative flex flex-col justify-between transition-all",
                medicalRecord || initialMedicalRecordId
                  ? "bg-gradient-to-br from-cyan-50/50 to-teal-50/40 border-cyan-200/80"
                  : "bg-white border-slate-200/80"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#0EA5B7]" />
                    <span>Hồ Sơ Bệnh Án</span>
                  </span>
                  {medicalRecord?.id ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#0EA5B7]/10 text-[#0EA5B7] text-[10px] font-bold font-mono">
                      #{medicalRecord.id}
                    </span>
                  ) : initialMedicalRecordId ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#0EA5B7]/10 text-[#0EA5B7] text-[10px] font-bold font-mono">
                      #{initialMedicalRecordId}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Không kèm bệnh án</span>
                  )}
                </div>

                {medicalRecord ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-600 block">Chẩn đoán sơ bộ:</span>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2 mt-0.5">
                        {medicalRecord.diagnosis || "Chưa ghi nhận"}
                      </p>
                    </div>
                    {medicalRecord.treatment && (
                      <div>
                        <span className="text-[11px] text-slate-600 block">Hướng điều trị:</span>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {medicalRecord.treatment}
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-cyan-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Ngày khám:</span>
                      <span className="font-semibold text-slate-700">
                        {formatDateDisplay(medicalRecord.record_date)}
                      </span>
                    </div>
                  </div>
                ) : initialMedicalRecordId ? (
                  <div className="space-y-2 py-2">
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Đã kết nối với mã bệnh án điện tử{" "}
                      <span className="font-bold text-[#0EA5B7]">#{initialMedicalRecordId}</span> vừa
                      được lập trong ca khám này.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Mũi tiêm sẽ tự động lưu liên kết vào hồ sơ khám bệnh của bé.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-3 text-center">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ca tiêm phòng độc lập hoặc chưa lập bệnh án lâm sàng. Mũi tiêm vẫn được ghi nhận
                      vào sổ tiêm chủng của thú cưng.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Appointment Context Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-emerald-600" />
                    <span>Chi Tiết Ca Khám</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    {appointment?.status === "completed"
                      ? "Đã hoàn thành"
                      : appointment?.status === "confirmed"
                      ? "Đang tiếp nhận"
                      : appointment?.status || "Lịch hẹn"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-600 text-[11px] block">Dịch vụ đăng ký:</span>
                    <span className="font-bold text-slate-900 block truncate">
                      {appointment?.service_name || "Khám & Tiêm phòng"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-600 block">Ngày hẹn:</span>
                      <span className="font-semibold text-slate-800">
                        {appointment?.appointment_date
                          ? formatDateDisplay(appointment.appointment_date)
                          : "Hôm nay"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 block">Giờ khám:</span>
                      <span className="font-semibold text-slate-800">
                        {appointment?.start_time || "---"}
                      </span>
                    </div>
                  </div>

                  {appointment?.reason && (
                    <div className="pt-1">
                      <span className="text-slate-600 text-[11px] block">Lý do hẹn:</span>
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                        &quot;{appointment.reason}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Validation Error Banner ───────────────────────────────── */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-in fade-in duration-200">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold block">Thông tin chưa đầy đủ</span>
                <span>{validationError}</span>
              </div>
            </div>
          )}

          {/* ─── Vaccination Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Syringe size={20} className="text-emerald-600" />
                    <span>Danh Sách Mũi Tiêm Thực Hiện</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Điền loại vắc xin và số lô. Ngày tiêm nhắc lại sẽ được tự động tính toán và khoá
                    chặt không sửa tay.
                  </p>
                </div>

                {/* Multiple vaccination button ([RECOMMENDATION]) */}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all border border-emerald-200/60 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Plus size={15} />
                  <span>+ Thêm vắc xin khác</span>
                </button>
              </div>

              {/* Vaccination Entry Rows */}
              <div className="space-y-6">
                {vaccineRows.map((row, index) => {
                  const selectedVT = findVaccineType(row.vaccineTypeId);
                  const interval = selectedVT?.recommended_interval_days ?? 365;
                  const computedNextDue = computeNextDueDate(row.dateAdministered, interval);

                  return (
                    <div
                      key={row.rowId}
                      className={cn(
                        "p-5 sm:p-6 rounded-2xl border transition-all space-y-5",
                        vaccineRows.length > 1
                          ? "bg-slate-50/60 border-slate-200"
                          : "bg-white border-slate-200"
                      )}
                    >
                      {/* Row Header if multiple */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {index + 1}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            Mũi Tiêm #{index + 1}
                          </span>
                          {selectedVT && (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                              Chu kỳ nhắc: {interval} ngày
                            </span>
                          )}
                        </div>

                        {vaccineRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.rowId)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Xoá mũi tiêm này"
                          >
                            <Trash2 size={13} />
                            <span>Xóa dòng</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* 1. Vaccine Type dropdown (load from vaccine-type.service.list()) */}
                        <div className="md:col-span-6 space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Loại Vắc Xin <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={row.vaccineTypeId}
                            onChange={(e) =>
                              handleUpdateRow(row.rowId, "vaccineTypeId", e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-2xs"
                            required
                          >
                            <option value="">-- Chọn loại vắc xin tiêm phòng --</option>
                            {vaccineTypes.map((vt) => (
                              <option
                                key={String(vt.id || vt.vaccine_type_id)}
                                value={String(vt.id || vt.vaccine_type_id)}
                              >
                                {vt.name} (Chu kỳ: {vt.recommended_interval_days} ngày)
                              </option>
                            ))}
                          </select>
                          {selectedVT?.description && (
                            <p className="text-[11px] text-slate-500 italic pl-1">
                              {selectedVT.description}
                            </p>
                          )}
                        </div>

                        {/* 2. Date administered (default today) */}
                        <div className="md:col-span-3 space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Ngày Tiêm <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={row.dateAdministered}
                            onChange={(e) =>
                              handleUpdateRow(row.rowId, "dateAdministered", e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-2xs"
                            required
                          />
                        </div>

                        {/* 3. Batch / Lot Number */}
                        <div className="md:col-span-3 space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                            <span>Số Lô (Batch No.)</span>
                            <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={row.batchNumber}
                              onChange={(e) =>
                                handleUpdateRow(row.rowId, "batchNumber", e.target.value)
                              }
                              placeholder="VD: DEF-2026-X01"
                              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-2xs uppercase placeholder:normal-case placeholder:font-sans"
                            />
                            <Hash
                              size={14}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. REALTIME PREVIEW: Automatic Computed Next Due Date (Strictly READ-ONLY) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 border-t border-slate-100/80">
                        <div className="md:col-span-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                              <CalendarClock size={15} className="text-emerald-600" />
                              <span>Hạn Tiêm Nhắc Tiếp Theo (Next Due Date)</span>
                            </div>
                            <p className="text-[11px] text-emerald-700">
                              Tự động tính = Ngày tiêm + {interval} ngày khuyến nghị của vắc xin
                            </p>
                          </div>

                          {/* Computed Date Display Badge (LOCKED / READ-ONLY) */}
                          <div className="shrink-0 text-right">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-mono font-extrabold text-xs shadow-xs">
                              <ShieldCheck size={14} />
                              <span>{formatDateDisplay(computedNextDue)}</span>
                            </div>
                            <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                              Khoá hệ thống (Read-only)
                            </span>
                          </div>
                        </div>

                        {/* 5. Notes / Clinical Observation */}
                        <div className="md:col-span-6 space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                            <span>Ghi Chú Phản Ứng Sau Tiêm</span>
                            <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
                          </label>
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) =>
                              handleUpdateRow(row.rowId, "notes", e.target.value)
                            }
                            placeholder="VD: Bé ổn định, theo dõi sưng vị trí tiêm trong 24h..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Doctor Context Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <User size={16} />
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 block">Bác sĩ thực hiện tiêm (administered_by):</span>
                    <span className="font-bold text-slate-900">
                      {user?.full_name || "Bác sĩ phụ trách phòng khám"}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold border border-emerald-200/60 shrink-0">
                  Tự động gán theo tài khoản
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                  href={`/appointments/${appointmentId}`}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold text-center transition-colors"
                >
                  Hủy bỏ & Quay lại
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang lưu mũi tiêm vào sổ tiêm chủng...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          Lưu {vaccineRows.length > 1 ? `${vaccineRows.length} Mũi Tiêm` : "Mũi Tiêm"}{" "}
                          Vắc Xin
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ─── SUCCESS MODAL WITH DETAILED PREVIEW & NEXT-STEPS ───────── */}
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
                  Ghi Nhận Tiêm Phòng Thành Công!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đã cập nhật {savedVaccinationsCount} mũi tiêm vào hồ sơ tiêm chủng của bé{" "}
                  {pet?.name || "thú cưng"}.
                </p>
              </div>
            </div>

            {/* List of recorded vaccinations & their computed next due date */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Chi tiết mũi tiêm & Lịch hẹn nhắc lại:
              </span>
              <div className="space-y-2">
                {savedPreviewList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-900 block truncate">
                        {item.vaccineName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Lô: {item.batchNumber}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-emerald-700 block font-medium">
                        Hạn tiêm nhắc:
                      </span>
                      <span className="font-bold text-emerald-800 font-mono text-xs">
                        {formatDateDisplay(item.nextDueDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  router.push("/doctor/appointments");
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <span>Về Danh Sách Lịch Hẹn Của Bác Sĩ</span>
                <ChevronRight size={15} />
              </button>

              {pet?.id && (
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/pets/${pet.id}`);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Dog size={14} className="text-emerald-600" />
                  <span>Xem Hồ Sơ Bệnh Nhân ({pet.name})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  router.push(`/appointments/${appointmentId}`);
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 transition-colors"
              >
                Xem lại ca khám #{appointmentId}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
