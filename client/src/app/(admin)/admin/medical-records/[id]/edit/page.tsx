"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Scale,
  CalendarDays,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Minus,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { MedicalRecord, UpdateMedicalRecordDTO } from "@/types/medical-record.type";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

export default function AdminEditMedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const recordId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Warning Acknowledgment Toggle
  const [isConfirmedAction, setIsConfirmedAction] = useState(false);

  // Form Fields (matching MEDICAL_RECORDS entity)
  const [recordDate, setRecordDate] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [treatment, setTreatment] = useState<string>("");
  const [prescription, setPrescription] = useState<string>("");
  const [weightAtVisit, setWeightAtVisit] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Validation Error State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load existing medical record
  const loadRecord = useCallback(async () => {
    if (!recordId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await medicalRecordService.getById(recordId);
      setRecord(data);

      // Populate form fields
      setRecordDate(
        data.record_date
          ? data.record_date.slice(0, 10)
          : new Date().toISOString().split("T")[0]
      );
      setDiagnosis(data.diagnosis || "");
      setTreatment(data.treatment || "");
      setPrescription(data.prescription || "");
      setWeightAtVisit(data.weight_at_visit ? String(data.weight_at_visit) : "");
      setNotes(data.notes || "");
    } catch (err: any) {
      console.error("[AdminEditRecord] Fetch error:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải thông tin hồ sơ bệnh án cần chỉnh sửa."
      );
    } finally {
      setIsLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  // Weight adjust helpers
  const handleWeightAdjust = (delta: number) => {
    const current = parseFloat(weightAtVisit) || 0;
    const nextVal = Math.max(0.1, Math.round((current + delta) * 10) / 10);
    setWeightAtVisit(nextVal.toFixed(1));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmedAction) {
      setValidationError(
        "Vui lòng tích chọn xác nhận thao tác chỉnh sửa hồ sơ y tế trước khi lưu thay đổi."
      );
      return;
    }

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
      const payload: UpdateMedicalRecordDTO = {
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim() || undefined,
        prescription: prescription.trim() || undefined,
        weight_at_visit: weightAtVisit ? Number(weightAtVisit) : undefined,
        record_date: recordDate || undefined,
        notes: notes.trim() || undefined,
      };

      // API call: medical-record.service.update(id, payload)
      await medicalRecordService.update(recordId, payload);

      showToastSuccess("Đã cập nhật hồ sơ bệnh án thành công!");
      router.push(`/admin/medical-records/${recordId}`);
    } catch (err: any) {
      console.error("[AdminEditRecord] Update failed:", err);
      showToastError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể cập nhật hồ sơ bệnh án. Vui lòng thử lại."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-pulse">
        <Skeleton width={140} height={20} />
        <Skeleton width="100%" height={120} rounded="lg" />
        <Skeleton width="100%" height={300} rounded="lg" />
      </div>
    );
  }

  if (errorMessage || !record) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900">Không thể tải hồ sơ bệnh án</h2>
        <p className="text-xs text-slate-500">{errorMessage || "Hồ sơ không tồn tại."}</p>
        <Link
          href="/admin/medical-records"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={15} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isCat =
    record.pet_species?.toLowerCase() === "cat" ||
    record.pet_species?.toLowerCase() === "mèo";

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* ─── Breadcrumbs ─────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/admin/dashboard" className="hover:text-[#0EA5B7] transition-colors">
          Tổng quan
        </Link>
        <span>/</span>
        <Link href="/admin/medical-records" className="hover:text-[#0EA5B7] transition-colors">
          Hồ sơ bệnh án
        </Link>
        <span>/</span>
        <Link
          href={`/admin/medical-records/${recordId}`}
          className="hover:text-[#0EA5B7] transition-colors"
        >
          Chi tiết #{recordId}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Chỉnh sửa hồ sơ</span>
      </nav>

      {/* ─── Header Banner ───────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/medical-records/${recordId}`}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
            title="Quay lại chi tiết"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">
                Chỉnh Sửa Hồ Sơ Bệnh Án #{recordId}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Chế độ Admin sửa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Điều chỉnh thông tin chẩn đoán, điều trị, đơn thuốc và chỉ số cân nặng của ca khám
            </p>
          </div>
        </div>
      </div>

      {/* ─── MANDATORY ADMIN WARNING BANNER (Required by Prompt) ───────── */}
      <div className="p-5 rounded-3xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
              <span>Cảnh báo can thiệp Quản trị viên:</span>
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>
                &ldquo;Chỉnh sửa hồ sơ y tế đã lưu — hãy chắc chắn thao tác này là cần thiết&rdquo;
              </strong>{" "}
              (chỉ thực hiện khi có sai lệch số liệu thực tế, lỗi chính tả danh mục thuốc hoặc chỉ định
              của hội đồng chuyên môn).
            </p>
          </div>
        </div>

        {/* Action Acknowledgment Checkbox */}
        <div className="pt-2 border-t border-amber-200/80">
          <label className="flex items-center gap-2.5 text-xs text-amber-950 font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isConfirmedAction}
              onChange={(e) => {
                setIsConfirmedAction(e.target.checked);
                if (e.target.checked) setValidationError(null);
              }}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
            />
            <span>
              Tôi đã kiểm tra và xác nhận thao tác chỉnh sửa hồ sơ bệnh án này là chính xác và cần thiết
            </span>
          </label>
        </div>
      </div>

      {/* ─── Read-Only Context Header (Similar to Prompt 23) ──────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FileText size={15} className="text-[#0EA5B7]" />
            <span>Thông tin ca khám ban đầu (Read-only Context)</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">Không thể sửa context</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Pet Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0 text-xl">
              {isCat ? <Cat size={20} /> : <Dog size={20} />}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 truncate">
                {record.pet_name || `Bé #${record.pet_id}`}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {record.pet_breed || (isCat ? "Mèo" : "Chó")}
              </p>
            </div>
          </div>

          {/* Owner Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Chủ nuôi</span>
            <p className="font-bold text-slate-900 truncate">{record.owner_name || "Chủ nuôi"}</p>
            {record.owner_phone && (
              <p className="text-[11px] text-slate-500 truncate">{record.owner_phone}</p>
            )}
          </div>

          {/* Doctor Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bác sĩ phụ trách</span>
            <p className="font-bold text-slate-900 truncate">
              {record.doctor_name || "BS. Phụ trách"}
            </p>
            {record.doctor_id && (
              <p className="text-[11px] text-slate-500">Mã BS: {record.doctor_id}</p>
            )}
          </div>

          {/* Service & Appointment */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lịch hẹn & Dịch vụ</span>
            <p className="font-bold text-[#0EA5B7] truncate">
              {record.service_name || "Khám bệnh lâm sàng"}
            </p>
            {record.appointment_id && (
              <p className="text-[11px] text-slate-500">Ca khám #{record.appointment_id}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Validation Alert ────────────────────────────────────────── */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={17} className="text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ─── Main Edit Form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope size={18} className="text-[#0EA5B7]" />
              <span>Nội Dung Hồ Sơ Bệnh Án</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Các trường có dấu <span className="text-rose-500 font-bold">*</span> là bắt buộc
            </p>
          </div>

          {/* Row 1: Record Date & Weight at visit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Record Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CalendarDays size={14} className="text-[#0EA5B7]" />
                <span>Ngày ghi nhận khám</span>
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Mặc định là ngày thực hiện ca khám</p>
            </div>

            {/* Weight At Visit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Scale size={14} className="text-emerald-600" />
                <span>Cân nặng khi khám (kg)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleWeightAdjust(-0.1)}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightAtVisit}
                  onChange={(e) => setWeightAtVisit(e.target.value)}
                  placeholder="Ví dụ: 4.5"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] text-center font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleWeightAdjust(0.1)}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Đây là nơi hợp lệ để hiệu chỉnh cân nặng bé tại thời điểm khám
              </p>
            </div>
          </div>

          {/* Row 2: Diagnosis (Required) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chẩn đoán lâm sàng (Diagnosis) <span className="text-rose-500 font-bold">*</span>
            </label>
            <textarea
              rows={3}
              value={diagnosis}
              onChange={(e) => {
                setDiagnosis(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Nhập chẩn đoán kết luận tình trạng sức khỏe của bé..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] leading-relaxed"
            />
          </div>

          {/* Row 3: Treatment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phương pháp điều trị / Thủ thuật can thiệp (Treatment)
            </label>
            <textarea
              rows={3}
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Ví dụ: Vệ sinh tai, sát trùng da, bù dịch điện giải..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] leading-relaxed"
            />
          </div>

          {/* Row 4: Prescription */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Pill size={14} className="text-indigo-600" />
              <span>Đơn thuốc &amp; Liều dùng (Prescription)</span>
            </label>
            <textarea
              rows={3}
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="Ví dụ: 1. Surolan 15ml (nhỏ tai 4 giọt x 2 lần/ngày)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] font-mono leading-relaxed"
            />
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lời dặn dò &amp; Ghi chú thêm (Notes)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dặn dò chăm sóc tại nhà, lịch tái khám dự kiến..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] leading-relaxed"
            />
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href={`/admin/medical-records/${recordId}`}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hủy bỏ
          </Link>

          <button
            type="submit"
            disabled={isSaving || !isConfirmedAction}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Đang lưu thay đổi...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Lưu Thay Đổi Hồ Sơ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
