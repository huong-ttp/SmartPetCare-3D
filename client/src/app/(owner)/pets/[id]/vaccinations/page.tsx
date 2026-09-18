"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Syringe,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Weight,
  Lock,
  ExternalLink,
  Sparkles,
  Info,
  CalendarPlus,
  Stethoscope,
  Search,
} from "lucide-react";

import { petService } from "@/services/petService";
import { vaccinationService } from "@/services/vaccinationService";
import type { Pet, PetSpecies } from "@/types/pet.type";
import type { PetVaccination } from "@/types/vaccination.type";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatRelativeTime, calcAge } from "@/utils/formatDate";
import { getSpeciesEmoji, getSpeciesLabel, SPECIES_BADGE_COLORS } from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

// ─── Due Date Status Helpers ──────────────────────────────────────────────────

export type VaccineDueStatus = "overdue" | "due_soon" | "valid";

export interface VaccineStatusInfo {
  status: VaccineDueStatus;
  label: string;
  diffDays: number;
  badgeClass: string;
  dotClass: string;
}

export function getVaccineStatus(nextDueDateStr?: string | null): VaccineStatusInfo {
  if (!nextDueDateStr) {
    return {
      status: "valid",
      label: "Còn hạn",
      diffDays: 999,
      badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
      dotClass: "bg-slate-400",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextDueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "overdue",
      label: "Quá hạn",
      diffDays,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500",
    };
  }

  if (diffDays <= 30) {
    return {
      status: "due_soon",
      label: "Sắp đến hạn",
      diffDays,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      dotClass: "bg-amber-500",
    };
  }

  return {
    status: "valid",
    label: "Còn hạn",
    diffDays,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function VaccinationSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton width={80} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={100} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={110} height={16} />
      </div>

      {/* Pet Header Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton rounded="full" width={64} height={64} />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton width={140} height={24} />
              <Skeleton width={60} height={20} rounded="full" />
            </div>
            <Skeleton width={200} height={16} />
          </div>
        </div>
        <Skeleton width={120} height={36} rounded="lg" />
      </div>

      {/* Upcoming Section Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <Skeleton width={180} height={20} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton height={100} rounded="lg" />
          <Skeleton height={100} rounded="lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <Skeleton width={200} height={20} />
        <Skeleton width="100%" height={160} rounded="lg" />
      </div>
    </div>
  );
}

// ─── Pet Not Found State ──────────────────────────────────────────────────────

function PetNotFoundState() {
  return (
    <div className="max-w-md mx-auto py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
        🐾
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy thú cưng</h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        Thú cưng này không tồn tại hoặc bạn không có quyền truy cập hồ sơ này.
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
        Không thể tải lịch sử tiêm phòng
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

// ─── Empty State (Friendly, Not an Error) ──────────────────────────────────────

function EmptyVaccinationState({ petName, petId }: { petName: string; petId: string | number }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto space-y-5">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
        <Syringe size={36} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900">
          Thú cưng chưa có lịch sử tiêm phòng
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {petName} chưa được ghi nhận mũi tiêm nào trong hệ thống. Lịch sử tiêm phòng và lịch tiêm nhắc lại sẽ được bác sĩ thú y cập nhật sau khi hoàn tất tiêm chủng.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`/appointments?petId=${petId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-600 transition-all shadow-sm shadow-primary/20"
        >
          <CalendarPlus size={15} />
          Đặt lịch tiêm phòng cho {petName}
        </Link>
        <Link
          href={`/pets/${petId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Quay lại hồ sơ bé
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PetVaccinationsPage() {
  const routerParams = useParams();

  // Client component: lấy petId trực tiếp từ useParams()
  const rawId = routerParams?.id;
  const petId =
    typeof rawId === "string" ? rawId.trim() : Array.isArray(rawId) ? rawId[0]?.trim() : "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    // Guard clause: Nếu id chưa sẵn sàng hoặc rỗng/undefined, không gọi API
    if (!petId || petId === "undefined" || petId === "null") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsNotFound(false);
    setError(null);

    try {
      const [petData, vacData] = await Promise.all([
        petService.getById(petId),
        vaccinationService.listByPet(petId).catch((err) => {
          // Nếu pet tồn tại nhưng chưa có mũi tiêm nào hoặc API trả về 404, trả về mảng rỗng
          if (err?.response?.status === 404) return [] as PetVaccination[];
          throw err;
        }),
      ]);

      setPet(petData);
      setVaccinations(vacData);
    } catch (err: any) {
      const status = err?.response?.status;
      const isNotFoundErr =
        status === 404 ||
        err?.message === "NOT_FOUND" ||
        err?.message?.includes("không hợp lệ") ||
        err?.response?.data?.message?.toLowerCase?.()?.includes("not found");

      if (isNotFoundErr) {
        setIsNotFound(true);
      } else {
        console.error("Lỗi khi tải dữ liệu tiêm phòng:", err);
        setError(
          err?.response?.data?.message ||
            "Không thể tải thông tin tiêm phòng. Vui lòng kiểm tra lại kết nối."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Upcoming / Overdue vaccines (Section riêng ở đầu trang)
  // Sort theo next_due_date gần nhất lên đầu
  const upcomingVaccines = useMemo(() => {
    return vaccinations
      .filter((v) => {
        if (!v.next_due_date) return false;
        const status = getVaccineStatus(v.next_due_date);
        return status.status === "overdue" || status.status === "due_soon";
      })
      .sort((a, b) => {
        const timeA = new Date(a.next_due_date!).getTime();
        const timeB = new Date(b.next_due_date!).getTime();
        return timeA - timeB;
      });
  }, [vaccinations]);

  // Filtered vaccination list for the table
  const filteredVaccinations = useMemo(() => {
    if (!searchTerm.trim()) return vaccinations;
    const q = searchTerm.toLowerCase();
    return vaccinations.filter((v) => {
      const name = (v.vaccine_name || "").toLowerCase();
      const batch = (v.batch_number || v.lot_number || "").toLowerCase();
      const doctor = (v.doctor_name || "").toLowerCase();
      return name.includes(q) || batch.includes(q) || doctor.includes(q);
    });
  }, [vaccinations, searchTerm]);

  if (isLoading) {
    return <VaccinationSkeleton />;
  }

  if (isNotFound || !pet) {
    return <PetNotFoundState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const petSpeciesKey = (pet.species?.toLowerCase() || "other") as PetSpecies;
  const speciesColors =
    SPECIES_BADGE_COLORS[petSpeciesKey] || SPECIES_BADGE_COLORS.other;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ─── Breadcrumb Navigation ───────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/pets" className="hover:text-slate-800 transition-colors">
          Thú cưng
        </Link>
        <span>/</span>
        <Link href={`/pets/${pet.id}`} className="hover:text-slate-800 transition-colors font-medium">
          {pet.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Tiêm phòng</span>
      </nav>

      {/* ─── Pet Overview Header ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center text-3xl shadow-sm">
              {getSpeciesEmoji(pet.species)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-heading font-bold text-slate-900">
                  {pet.name}
                </h1>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border",
                    speciesColors.bg,
                    speciesColors.text,
                    speciesColors.border
                  )}
                >
                  {getSpeciesLabel(pet.species)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>{pet.breed || "Không rõ giống"}</span>
                <span>•</span>
                <span>{calcAge(pet.date_of_birth)}</span>
                {pet.weight_kg && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Weight size={12} className="text-slate-400" />
                      {pet.weight_kg} kg
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Read-Only Mode Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
              <Lock size={12} className="text-slate-400" />
              <span>Chế độ xem cho Chủ nuôi (Chỉ đọc)</span>
            </div>

            <Link
              href={`/pets/${pet.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              Hồ sơ bé
            </Link>
          </div>
        </div>
      </div>

      {/* ─── SECTION: Upcoming / Overdue Vaccines (Ở đầu trang) ─────────── */}
      {vaccinations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Upcoming Vaccines (Lịch tiêm cần lưu ý)
            </h2>
            {upcomingVaccines.length > 0 && (
              <span className="text-xs text-slate-500">
                {upcomingVaccines.length} mũi cần theo dõi
              </span>
            )}
          </div>

          {upcomingVaccines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingVaccines.map((vac, idx) => {
                const vacId = vac.vaccination_id || vac.id || idx;
                const statusInfo = getVaccineStatus(vac.next_due_date);
                const isOverdue = statusInfo.status === "overdue";

                return (
                  <motion.div
                    key={vacId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "p-5 rounded-3xl border shadow-sm space-y-3 transition-all",
                      isOverdue
                        ? "bg-rose-50/40 border-rose-200 hover:border-rose-300"
                        : "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                            isOverdue
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-600"
                          )}
                        >
                          {isOverdue ? (
                            <AlertTriangle size={20} />
                          ) : (
                            <Syringe size={20} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                            {vac.vaccine_name || "Vắc xin phòng bệnh"}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Lô: {vac.batch_number || vac.lot_number || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0",
                          statusInfo.badgeClass
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            statusInfo.dotClass
                          )}
                        />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-500">Hạn tiêm nhắc: </span>
                        <span className="font-bold text-slate-900">
                          {formatDate(vac.next_due_date)}
                        </span>
                        <span
                          className={cn(
                            "ml-2 font-medium",
                            isOverdue ? "text-rose-600" : "text-amber-600"
                          )}
                        >
                          ({isOverdue
                            ? `Quá hạn ${Math.abs(statusInfo.diffDays)} ngày`
                            : `Còn ${statusInfo.diffDays} ngày`})
                        </span>
                      </div>

                      <Link
                        href={`/appointments?petId=${pet.id}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        Đặt lịch
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Reassuring Card when all vaccines are up to date (> 30 days)
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Tất cả vắc xin của {pet.name} đều còn hạn!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Hiện tại bé không có mũi tiêm nào quá hạn hoặc cần tiêm nhắc trong 30 ngày tới.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 size={13} />
                Được bảo vệ đầy đủ
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SECTION: Full Vaccination History Table / List ─────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
              <Syringe size={20} className="text-emerald-600" />
              Lịch sử tiêm phòng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách chi tiết tất cả các mũi vắc xin đã được thực hiện
            </p>
          </div>

          {vaccinations.length > 1 && (
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Tìm loại vắc xin, số lô, bác sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          )}
        </div>

        {/* ─── Main Content: Empty vs Table ──────────────────────────────── */}
        {vaccinations.length === 0 ? (
          <EmptyVaccinationState petName={pet.name} petId={pet.id} />
        ) : filteredVaccinations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
            <p className="text-sm text-slate-500">
              Không tìm thấy mũi tiêm phòng nào phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-3 text-xs text-primary font-semibold hover:underline"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Loại Vắc Xin</th>
                    <th className="py-4 px-4">Ngày tiêm</th>
                    <th className="py-4 px-4">Bác sĩ phụ trách</th>
                    <th className="py-4 px-4">Số lô (Batch)</th>
                    <th className="py-4 px-4">Hạn tiêm nhắc</th>
                    <th className="py-4 px-4">Trạng thái</th>
                    <th className="py-4 px-6 text-right">Bệnh án</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredVaccinations.map((vac, idx) => {
                    const vacId = vac.vaccination_id || vac.id || idx;
                    const statusInfo = getVaccineStatus(vac.next_due_date);
                    const batch = vac.batch_number || vac.lot_number || "—";

                    return (
                      <tr
                        key={vacId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Vaccine Name */}
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Syringe size={15} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {vac.vaccine_name || "Vắc xin phòng bệnh"}
                              </p>
                              {vac.vaccine_description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs font-normal">
                                  {vac.vaccine_description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date Administered */}
                        <td className="py-4 px-4 font-medium text-slate-800">
                          {vac.date_administered
                            ? formatDate(vac.date_administered)
                            : "—"}
                        </td>

                        {/* Doctor */}
                        <td className="py-4 px-4 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope size={13} className="text-indigo-500 shrink-0" />
                            <span>{vac.doctor_name || "Bác sĩ thú y"}</span>
                          </div>
                        </td>

                        {/* Batch Number */}
                        <td className="py-4 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {batch}
                          </span>
                        </td>

                        {/* Next Due Date */}
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {vac.next_due_date ? formatDate(vac.next_due_date) : "—"}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                              statusInfo.badgeClass
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                statusInfo.dotClass
                              )}
                            />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Action: Link to Medical Record if linked */}
                        <td className="py-4 px-6 text-right">
                          {vac.medical_record_id ? (
                            <Link
                              href={`/medical-records/${vac.medical_record_id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                            >
                              <span>Bệnh án #{vac.medical_record_id}</span>
                              <ExternalLink size={12} />
                            </Link>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Read-Only Info Footer Note */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info size={13} className="text-slate-400" />
                Dữ liệu tiêm chủng do phòng khám SmartPetCare quản lý và cập nhật sau mỗi đợt tiêm.
              </span>
              <span>Tổng số mũi tiêm: {vaccinations.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
