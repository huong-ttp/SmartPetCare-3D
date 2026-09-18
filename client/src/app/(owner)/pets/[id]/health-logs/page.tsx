"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, RefreshCw, Sparkles, Scale, Heart } from "lucide-react";
import { motion } from "framer-motion";

import { petService } from "@/services/petService";
import { healthLogService } from "@/services/healthLogService";
import { medicalRecordService } from "@/services/medicalRecordService";

import type { Pet } from "@/types/pet.type";
import type { PetHealthLog } from "@/types/health-log.type";
import type { MedicalRecord } from "@/types/medical-record.type";

import { HealthLogStatsCards } from "@/components/health-logs/HealthLogStatsCards";
import { HealthLogQuickForm } from "@/components/health-logs/HealthLogQuickForm";
import { HealthLogCharts } from "@/components/health-logs/HealthLogCharts";
import { HealthLogHistoryTable } from "@/components/health-logs/HealthLogHistoryTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSpeciesEmoji, getSpeciesLabel, SPECIES_BADGE_COLORS } from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function HealthLogsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top bar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton width={120} height={20} />
      </div>

      {/* Header skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton rounded="lg" width={60} height={60} />
          <div className="space-y-2">
            <Skeleton width={160} height={24} />
            <Skeleton width={100} height={16} />
          </div>
        </div>
        <Skeleton width={100} height={36} rounded="lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={32} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={32} />
        </div>
      </div>

      {/* Grid: Form + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <Skeleton width={180} height={20} />
          <Skeleton width="100%" height={150} />
        </div>
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <Skeleton width={200} height={20} />
          <Skeleton width="100%" height={260} />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
        <Skeleton width={160} height={20} />
        <Skeleton width="100%" height={120} />
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function PetHealthLogsPage() {
  const params = useParams();
  const petId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [logs, setLogs] = useState<PetHealthLog[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load all pet health data
  const loadData = useCallback(async () => {
    if (!petId) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const [petData, logsData, mrData] = await Promise.all([
        petService.getById(petId),
        healthLogService.getByPetId(petId).catch((e) => {
          console.error("Không thể lấy health logs:", e);
          return [] as PetHealthLog[];
        }),
        medicalRecordService.getByPetId(petId).catch((e) => {
          console.error("Không thể lấy medical records:", e);
          return [] as MedicalRecord[];
        }),
      ]);

      setPet(petData);
      setLogs(logsData);
      setMedicalRecords(mrData);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu trang nhật ký sức khỏe:", err);
      setFetchError("Không thể tải thông tin sức khỏe của thú cưng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler when a new log is created
  const handleLogCreated = (newLog: PetHealthLog) => {
    setLogs((prev) => [newLog, ...prev]);

    // Also optimistically update pet weight cache in state if weight was provided
    if (newLog.weight_kg !== undefined && newLog.weight_kg !== null) {
      setPet((prev) => (prev ? { ...prev, weight_kg: newLog.weight_kg } : null));
    }
  };

  // Handler when a log is deleted
  const handleLogDeleted = (deletedId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== deletedId));
  };

  if (isLoading) return <HealthLogsSkeleton />;

  if (fetchError || !pet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <RefreshCw size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Đã xảy ra lỗi</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-5">
          {fetchError || "Không tìm thấy thông tin thú cưng."}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-600 transition-colors shadow-sm"
          >
            <RefreshCw size={15} />
            Thử lại
          </button>
          <Link
            href={`/pets/${petId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Quay lại hồ sơ
          </Link>
        </div>
      </div>
    );
  }

  const speciesColors = SPECIES_BADGE_COLORS[pet.species];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Breadcrumb / Back link ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href={`/pets/${pet.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Hồ sơ của {pet.name}
        </Link>
      </div>

      {/* ── Pet Summary Header ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {pet.avatar_url ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
            />
          ) : (
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-sm shrink-0",
                speciesColors.bg
              )}
            >
              {getSpeciesEmoji(pet.species)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{pet.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                  speciesColors.bg,
                  speciesColors.text,
                  speciesColors.border
                )}
              >
                {getSpeciesEmoji(pet.species)} {getSpeciesLabel(pet.species)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Mục tiêu theo dõi: Cân nặng, Chiều cao & Chỉ số thể chất</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Pet Cache Weight</div>
            <div className="text-sm font-bold text-slate-800">
              {pet.weight_kg !== undefined && pet.weight_kg !== null
                ? `${pet.weight_kg} kg`
                : "Chưa ghi nhận"}
            </div>
          </div>
          <Link
            href={`/pets/${pet.id}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            Xem hồ sơ chính
          </Link>
        </div>
      </motion.div>

      {/* ── Empty State guidance if zero logs exist ───────────────────────── */}
      {logs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/70 text-amber-950 flex items-start gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} />
          </div>
          <div className="text-xs leading-relaxed">
            <h4 className="font-bold text-sm text-amber-900 mb-0.5">
              Bắt đầu theo dõi thể chất cho {pet.name}!
            </h4>
            <p className="text-amber-800/90">
              Chưa có bản ghi đo lường nào cho bé. Hãy dùng bảng <strong>Ghi nhận chỉ số thể chất</strong> bên dưới để nhập số cân nặng và chiều cao đầu tiên. Biểu đồ xu hướng và bảng lịch sử sẽ tự động kích hoạt ngay sau đó!
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Current Stats Cards ───────────────────────────────────────────── */}
      <HealthLogStatsCards logs={logs} petName={pet.name} />

      {/* ── Main Interactive Section: Quick Form + Charts ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quick entry form */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <HealthLogQuickForm petId={pet.id} petName={pet.name} onSuccess={handleLogCreated} />
        </div>

        {/* Trend charts */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <HealthLogCharts logs={logs} medicalRecords={medicalRecords} petName={pet.name} />
        </div>
      </div>

      {/* ── History Table ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <HealthLogHistoryTable
          logs={logs}
          petName={pet.name}
          onLogDeleted={handleLogDeleted}
        />
      </motion.div>
    </div>
  );
}
