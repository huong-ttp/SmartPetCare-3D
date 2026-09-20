"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Stethoscope,
  Weight,
  FileText,
  Pill,
  Activity,
  Syringe,
  ShieldCheck,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Dog,
  Cat,
  User,
  Phone,
  Thermometer,
  ShieldAlert,
} from "lucide-react";

import { medicalRecordService } from "@/services/medicalRecordService";
import type { MedicalRecord } from "@/types/medical-record.type";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

// ─── Detail Skeleton ──────────────────────────────────────────────────────────

function MedicalRecordDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton width={80} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={110} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={130} height={16} />
      </div>

      {/* Header bar */}
      <div className="flex justify-between items-center">
        <Skeleton width={160} height={40} rounded="lg" />
        <div className="flex gap-2">
          <Skeleton width={110} height={40} rounded="lg" />
          <Skeleton width={100} height={40} rounded="lg" />
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton width={220} height={28} />
            <Skeleton width={160} height={16} />
          </div>
          <Skeleton width={130} height={48} rounded="lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
        </div>
      </div>

      {/* Diagnosis & Treatment */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-4 shadow-sm">
        <Skeleton width={180} height={24} />
        <Skeleton width="100%" height={90} rounded="lg" />
        <Skeleton width="100%" height={70} rounded="lg" />
      </div>
    </div>
  );
}

// ─── 404 / Not Found State ────────────────────────────────────────────────────

function RecordNotFoundState() {
  return (
    <div className="max-w-md mx-auto py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
        📋
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Hồ sơ bệnh án không tồn tại
      </h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        Hồ sơ khám bệnh này không tồn tại trong hệ thống hoặc đã được xóa trước đó.
      </p>
      <Link
        href="/admin/medical-records"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-xs font-bold hover:bg-[#0c8f9f] transition-all shadow-md shadow-[#0EA5B7]/20"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách hồ sơ y tế
      </Link>
    </div>
  );
}

export default function AdminMedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const recordId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!recordId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await medicalRecordService.getById(recordId);
      setRecord(data);
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết bệnh án:", err);
      setErrorMessage(
        err?.response?.status === 404
          ? "NOT_FOUND"
          : err?.response?.data?.message || err?.message || "Không thể tải dữ liệu bệnh án."
      );
    } finally {
      setIsLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!recordId) return;
    setIsDeleting(true);
    try {
      await medicalRecordService.delete(recordId);
      showToastSuccess(`Đã xóa vĩnh viễn hồ sơ bệnh án #${recordId}!`);
      setIsDeleteModalOpen(false);
      router.push("/admin/medical-records");
    } catch (err: any) {
      console.error("Lỗi khi xóa hồ sơ:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xóa hồ sơ bệnh án. Vui lòng kiểm tra lại liên kết dữ liệu.";
      showToastError(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <MedicalRecordDetailSkeleton />;
  }

  if (errorMessage === "NOT_FOUND" || (!isLoading && !record)) {
    return <RecordNotFoundState />;
  }

  if (errorMessage) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900">Lỗi tải chi tiết bệnh án</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/admin/medical-records"
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Về danh sách
          </Link>
          <button
            type="button"
            onClick={loadRecord}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!record) return <RecordNotFoundState />;

  const isCat =
    record.pet_species?.toLowerCase() === "cat" ||
    record.pet_species?.toLowerCase() === "mèo";

  const visitDate = record.record_date || record.created_at;
  const vaccinations = record.vaccinations || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
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
        <span className="text-slate-900 font-semibold">
          Chi tiết hồ sơ #{record.id || record.record_id}
        </span>
      </nav>

      {/* ─── Header & Admin Action Toolbar ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/medical-records"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Hồ Sơ Bệnh Án #{record.id || record.record_id}
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã lưu hồ sơ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khám ngày {formatDate(visitDate)} • Bác sĩ:{" "}
              <strong>{record.doctor_name || "BS. Phụ trách"}</strong>
            </p>
          </div>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {/* Edit Button */}
          <Link
            href={`/admin/medical-records/${recordId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Edit3 size={15} />
            <span>Chỉnh sửa hồ sơ</span>
          </Link>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Xóa hồ sơ</span>
          </button>
        </div>
      </div>

      {/* ─── Admin Supervision Note ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={16} className="text-[#0EA5B7]" />
          <span>
            Chế độ giám sát Quản trị viên: Bạn đang xem hồ sơ với đầy đủ quyền hạn can thiệp sửa/xóa
            trong trường hợp dữ liệu sai sót.
          </span>
        </div>
      </div>

      {/* ─── Card 1: Primary Pet & Visit Overview ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0 border border-sky-100 text-2xl">
              {isCat ? <Cat size={30} /> : <Dog size={30} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {record.pet_name || `Thú cưng #${record.pet_id}`}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                  {isCat ? "Mèo" : "Chó"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Giống loài: <strong>{record.pet_breed || "Chưa cập nhật"}</strong>
                {record.owner_name && (
                  <span> • Chủ nuôi: <strong>{record.owner_name}</strong></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {record.pet_id && (
              <Link
                href={`/admin/pets`}
                className="text-xs font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
              >
                <span>Hồ sơ thú cưng</span>
                <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* 4-Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {/* Stat 1: Weight */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Weight size={13} className="text-[#0EA5B7]" />
              Cân nặng khi khám
            </span>
            <p className="text-base font-extrabold text-slate-900">
              {record.weight_at_visit ? `${record.weight_at_visit} kg` : "Chưa cân"}
            </p>
          </div>

          {/* Stat 2: Temperature */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer size={13} className="text-rose-500" />
              Thân nhiệt
            </span>
            <p className="text-base font-extrabold text-slate-900">
              {record.temperature ? `${record.temperature} °C` : "38.5 °C (Bình thường)"}
            </p>
          </div>

          {/* Stat 3: Doctor */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-emerald-600" />
              Bác sĩ khám
            </span>
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {record.doctor_name || "Bác sĩ phụ trách"}
            </p>
          </div>

          {/* Stat 4: Service */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope size={13} className="text-indigo-600" />
              Dịch vụ khám
            </span>
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {record.service_name || "Khám bệnh lâm sàng"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Card 2: Diagnosis (Chẩn đoán lâm sàng) ─────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Stethoscope size={18} className="text-[#0EA5B7]" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            1. Kết Luận Chẩn Đoán Lâm Sàng (Diagnosis)
          </h3>
        </div>
        <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-slate-800 leading-relaxed font-medium">
          {record.diagnosis || "Chưa có nội dung kết luận chẩn đoán."}
        </div>
      </div>

      {/* ─── Card 3: Treatment & Prescription ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treatment Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity size={18} className="text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              2. Phương Pháp Điều Trị (Treatment)
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-line">
            {record.treatment || "Không chỉ định điều trị can thiệp tại phòng khám."}
          </div>
        </div>

        {/* Prescription Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Pill size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              3. Đơn Thuốc &amp; Hướng Dẫn (Prescription)
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-line font-mono text-[11px]">
            {record.prescription || "Không có đơn thuốc chỉ định."}
          </div>
        </div>
      </div>

      {/* ─── Card 4: Notes & Follow-up ────────────────────────────────── */}
      {(record.notes || record.follow_up_date) && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={18} className="text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              4. Lời Dặn Bác Sĩ &amp; Hẹn Tái Khám
            </h3>
          </div>
          <div className="text-xs text-slate-700 space-y-2">
            {record.notes && (
              <p className="leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-amber-950">
                {record.notes}
              </p>
            )}
            {record.follow_up_date && (
              <p className="font-semibold text-slate-800 flex items-center gap-2 pt-1">
                <Calendar size={14} className="text-[#0EA5B7]" />
                <span>Ngày hẹn tái khám: {formatDate(record.follow_up_date)}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── Card 5: Linked Vaccinations (Tiêm phòng liên kết) ─────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Syringe size={18} className="text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Tiêm Chủng Liên Kết Trong Ca Khám
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {vaccinations.length} mũi tiêm
          </span>
        </div>

        {vaccinations.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            Hồ sơ này không có mũi tiêm phòng (Pet Vaccinations) liên kết đi kèm.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vaccinations.map((vac, i) => (
              <div
                key={vac.vaccination_id || vac.id || i}
                className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-teal-950 text-sm">
                    {vac.vaccine_name || "Vaccine phòng bệnh"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Đã tiêm
                  </span>
                </div>
                {vac.batch_number && (
                  <p className="text-[11px] text-slate-600">
                    Số lô sản xuất: <strong>{vac.batch_number}</strong>
                  </p>
                )}
                {vac.next_due_date && (
                  <p className="text-[11px] text-teal-800 font-semibold flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Lịch tiêm nhắc tiếp theo: {formatDate(vac.next_due_date)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Card 6: Related Appointment Context ──────────────────────── */}
      {record.appointment_id && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#0EA5B7]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Thông Tin Lịch Hẹn Gốc
              </h3>
            </div>
            <Link
              href={`/admin/appointments`}
              className="text-xs font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
            >
              <span>Xem danh sách lịch hẹn</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Mã lịch hẹn:</span>
              <p className="font-extrabold text-slate-900 text-sm">#{record.appointment_id}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Thời gian hẹn:</span>
              <p className="font-bold text-slate-800 text-sm">
                {record.appointment_date ? formatDate(record.appointment_date) : "Theo hẹn"}
                {record.appointment_start_time && ` • ${record.appointment_start_time}`}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Trạng thái:</span>
              <p className="font-bold text-emerald-600 text-sm">Đã hoàn tất (Completed)</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────────── */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-start gap-3.5 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Xác nhận xóa hồ sơ bệnh án #{recordId}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thú cưng: <strong>{record.pet_name || "Thú cưng"}</strong> • Bác sĩ:{" "}
                    <strong>{record.doctor_name || "BS phụ trách"}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Bạn có chắc chắn muốn xóa hồ sơ bệnh án này? Hành động này sẽ loại bỏ toàn bộ dữ liệu
                  chẩn đoán, điều trị và đơn thuốc của ca khám.
                </p>

                {/* Important Vaccination Warning */}
                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <AlertTriangle size={15} />
                    <span>Cảnh báo ràng buộc tiêm chủng (Pet Vaccinations)</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Nếu hồ sơ bệnh án này có các mũi tiêm phòng (Pet Vaccinations) liên kết tham chiếu
                    tới, hệ thống sẽ <strong>TỪ CHỐI XÓA</strong> để bảo vệ tính toàn vẹn của lịch sử
                    tiêm chủng thú cưng.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Xác nhận xóa vĩnh viễn</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
