"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  HeartPulse,
} from "lucide-react";

import { medicalRecordService } from "@/services/medicalRecordService";
import type { MedicalRecord } from "@/types/medical-record.type";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatDateTime, formatRelativeTime } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

// ─── Detail Skeleton ──────────────────────────────────────────────────────────

function MedicalRecordDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton width={80} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={90} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={130} height={16} />
      </div>

      {/* Header bar */}
      <div className="flex justify-between items-center">
        <Skeleton width={140} height={36} rounded="lg" />
        <Skeleton width={110} height={28} rounded="full" />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton width={200} height={28} />
            <Skeleton width={140} height={16} />
          </div>
          <Skeleton width={120} height={48} rounded="lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Skeleton height={60} rounded="lg" />
          <Skeleton height={60} rounded="lg" />
          <Skeleton height={60} rounded="lg" />
        </div>
      </div>

      {/* Diagnosis & Treatment Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-4 shadow-sm">
        <Skeleton width={160} height={22} />
        <Skeleton width="100%" height={80} rounded="lg" />
        <Skeleton width="100%" height={60} rounded="lg" />
      </div>

      {/* Vaccinations skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-4 shadow-sm">
        <Skeleton width={220} height={22} />
        <Skeleton width="100%" height={100} rounded="lg" />
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
        Hồ sơ khám bệnh này không tồn tại trong hệ thống, đã được chuyển lưu trữ, hoặc bạn không có quyền xem bệnh án này.
      </p>
      <Link
        href="/pets"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-all shadow-sm shadow-primary/20"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách thú cưng
      </Link>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500">
        <RefreshCw size={26} />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">
        Không thể tải chi tiết bệnh án
      </h2>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
      >
        <RefreshCw size={16} />
        Thử lại
      </button>
    </div>
  );
}

// ─── Main Detail Page Component ───────────────────────────────────────────────

export default function MedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();

  const recordId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = useCallback(async () => {
    if (!recordId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await medicalRecordService.getById(recordId);
      setRecord(data);
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết hồ sơ bệnh án:", err);
      setError(
        err?.response?.status === 404
          ? "NOT_FOUND"
          : err?.response?.data?.message || "Không thể tải dữ liệu bệnh án."
      );
    } finally {
      setIsLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  if (isLoading) {
    return <MedicalRecordDetailSkeleton />;
  }

  if (error === "NOT_FOUND" || (!isLoading && !record)) {
    return <RecordNotFoundState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadRecord} />;
  }

  if (!record) {
    return <RecordNotFoundState />;
  }

  const visitDate = record.record_date || record.created_at;
  const vaccinations = record.vaccinations || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ─── Breadcrumb Navigation ───────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/pets" className="hover:text-slate-800 transition-colors">
          Thú cưng
        </Link>
        <span>/</span>
        {record.pet_id ? (
          <Link
            href={`/pets/${record.pet_id}`}
            className="hover:text-slate-800 transition-colors font-medium"
          >
            {record.pet_name || `Thú cưng #${record.pet_id}`}
          </Link>
        ) : (
          <span>{record.pet_name || "Thú cưng"}</span>
        )}
        <span>/</span>
        {record.pet_id ? (
          <Link
            href={`/pets/${record.pet_id}/medical-records`}
            className="hover:text-slate-800 transition-colors"
          >
            Hồ sơ bệnh án
          </Link>
        ) : (
          <span>Hồ sơ bệnh án</span>
        )}
        <span>/</span>
        <span className="text-slate-900 font-semibold">
          Chi tiết #{record.record_id || record.id}
        </span>
      </nav>

      {/* ─── Top Bar: Back Action & Read-Only Badge ──────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        {record.pet_id ? (
          <Link
            href={`/pets/${record.pet_id}/medical-records`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
            Danh sách bệnh án
          </Link>
        ) : (
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
            Quay lại
          </button>
        )}

        {/* Read-Only Badge for Owner (Explicitly stating this view is read-only) */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
          <Lock size={12} className="text-slate-400" />
          <span>Chế độ xem cho Chủ nuôi (Chỉ đọc)</span>
        </div>
      </div>

      {/* ─── Main Overview Header Card ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm relative overflow-hidden"
      >
        {/* Soft background accent */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
                  Hồ sơ khám bệnh #{record.record_id || record.id}
                </span>
                {visitDate && (
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(visitDate)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-heading font-bold text-slate-900">
                Phiếu Khám & Điều Trị
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Ghi nhận bởi bác sĩ thú y chuyên trách tại phòng khám SmartPetCare
              </p>
            </div>

            {/* Weight Metric Card */}
            {record.weight_at_visit && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-amber-900">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
                  <Weight size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                    Cân nặng tại khám
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {record.weight_at_visit}{" "}
                    <span className="text-xs font-normal text-slate-500">kg</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Record Date */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={14} className="text-sky-500" />
                <span className="font-medium">Ngày khám bệnh</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {visitDate ? formatDate(visitDate) : "—"}
              </p>
            </div>

            {/* Doctor */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Stethoscope size={14} className="text-indigo-500" />
                <span className="font-medium">Bác sĩ phụ trách</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {record.doctor_name || "Bác sĩ phụ trách"}
              </p>
            </div>

            {/* Pet Name */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <HeartPulse size={14} className="text-rose-500" />
                <span className="font-medium">Bệnh nhân</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">
                  {record.pet_name || "Thú cưng"}
                </p>
                {record.pet_id && (
                  <Link
                    href={`/pets/${record.pet_id}`}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Xem hồ sơ
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Linked Original Appointment (If available) ──────────────────── */}
      {record.appointment_id && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Lịch hẹn gốc #{record.appointment_id}
                </span>
                {record.appointment_status && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {record.appointment_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dịch vụ:{" "}
                <span className="font-medium text-slate-700">
                  {record.service_name || "Khám & Điều trị"}
                </span>
                {record.appointment_date && (
                  <>
                    {" "}
                    • Ngày hẹn:{" "}
                    <span className="font-medium text-slate-700">
                      {formatDate(record.appointment_date)}
                    </span>
                  </>
                )}
                {record.appointment_start_time && (
                  <>
                    {" "}
                    lúc{" "}
                    <span className="font-medium text-slate-700">
                      {record.appointment_start_time.slice(0, 5)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <Link
            href="/appointments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70 transition-colors shrink-0"
          >
            <span>Xem danh sách lịch hẹn</span>
            <ExternalLink size={13} />
          </Link>
        </motion.div>
      )}

      {/* ─── Clinical Details: Diagnosis, Treatment, Prescription, Notes ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
          <FileText size={20} className="text-sky-600" />
          Nội dung khám lâm sàng & Điều trị
        </h2>

        {/* Diagnosis */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity size={14} className="text-sky-500" />
            Chẩn đoán (Diagnosis)
          </label>
          <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100/80 text-sm leading-relaxed text-slate-900 font-medium whitespace-pre-line">
            {record.diagnosis || "Chưa có ghi chép chẩn đoán cụ thể."}
          </div>
        </div>

        {/* Treatment */}
        {record.treatment && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Stethoscope size={14} className="text-indigo-500" />
              Phương pháp điều trị (Treatment)
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
              {record.treatment}
            </div>
          </div>
        )}

        {/* Prescription */}
        {record.prescription && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Pill size={14} className="text-emerald-500" />
              Đơn thuốc & Hướng dẫn sử dụng (Prescription)
            </label>
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-sm leading-relaxed text-emerald-950 font-medium whitespace-pre-line">
              {record.prescription}
            </div>
          </div>
        )}

        {/* Doctor's Notes */}
        {record.notes && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bookmark size={14} className="text-amber-500" />
              Lời dặn & Ghi chú của bác sĩ (Notes)
            </label>
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100/80 text-sm leading-relaxed text-amber-950 whitespace-pre-line">
              {record.notes}
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Vaccinations Section (PET_VACCINATIONS.medical_record_id) ────── */}
      {vaccinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-50 pb-4">
            <div>
              <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
                <Syringe size={20} className="text-emerald-600" />
                Vaccinations administered in this visit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các mũi vắc xin đã được tiêm trực tiếp cho bé trong buổi khám này
              </p>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60 self-start sm:self-auto">
              <ShieldCheck size={14} />
              Đã ghi nhận tiêm chủng ({vaccinations.length})
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaccinations.map((vac, idx) => {
              const vacId = vac.vaccination_id || vac.id || idx;
              const dateAdmin = vac.date_administered;
              const nextDue = vac.next_due_date;
              const batchNum = vac.batch_number || vac.lot_number;

              return (
                <div
                  key={vacId}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 space-y-3.5 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        {vac.vaccine_name || "Vắc xin phòng bệnh"}
                      </h3>
                      {vac.vaccine_description && (
                        <p className="text-xs text-slate-500">
                          {vac.vaccine_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vaccine Metadata Table / Tags */}
                  <div className="space-y-2 pt-1 text-xs">
                    {/* Batch / Lot Number */}
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white border border-emerald-100/80">
                      <span className="text-slate-500 font-medium">Số lô (Batch / Lot):</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {batchNum || "Không ghi chú"}
                      </span>
                    </div>

                    {/* Date Administered */}
                    {dateAdmin && (
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white border border-emerald-100/80">
                        <span className="text-slate-500 font-medium">Ngày tiêm:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(dateAdmin)}
                        </span>
                      </div>
                    )}

                    {/* Next Due Date */}
                    {nextDue && (
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-amber-900">
                        <span className="font-medium text-amber-800 flex items-center gap-1">
                          <Calendar size={13} className="text-amber-600" />
                          Tiêm nhắc lại (Next due):
                        </span>
                        <span className="font-bold text-amber-900">
                          {formatDate(nextDue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
