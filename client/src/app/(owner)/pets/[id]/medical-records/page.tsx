"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  FileText,
  Clock,
  Weight,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";

import { petService } from "@/services/petService";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { Pet, PetSpecies } from "@/types/pet.type";
import type { MedicalRecord } from "@/types/medical-record.type";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatRelativeTime, calcAge } from "@/utils/formatDate";
import { getSpeciesEmoji, getSpeciesLabel, SPECIES_BADGE_COLORS } from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function MedicalRecordsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton width={80} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={100} height={16} />
        <span className="text-slate-300">/</span>
        <Skeleton width={120} height={16} />
      </div>

      {/* Pet Header Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* Timeline skeleton */}
      <div className="space-y-4 pt-2">
        <Skeleton width={180} height={22} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton width={36} height={36} rounded="lg" />
                <div className="space-y-1">
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={12} />
                </div>
              </div>
              <Skeleton width={100} height={24} rounded="full" />
            </div>
            <Skeleton width="90%" height={16} />
            <Skeleton width="70%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pet Not Found State ──────────────────────────────────────────────────────

function PetNotFoundState() {
  return (
    <div className="max-w-md mx-auto py-20 text-center">
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
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500">
        <RefreshCw size={26} />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Không thể tải hồ sơ bệnh án</h2>
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

function EmptyMedicalRecordsState({ petName }: { petName: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-5 text-sky-500 shadow-sm">
        <FileText size={36} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {petName} chưa có hồ sơ bệnh án nào
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
        Hồ sơ bệnh án sẽ được bác sĩ phụ trách cập nhật tự động sau mỗi lần khám bệnh hoặc điều trị tại phòng khám.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-600">
        <Sparkles size={14} className="text-amber-500" />
        Sức khỏe của {petName} đang được theo dõi tốt!
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PetMedicalRecordsPage() {
  const params = useParams();
  const router = useRouter();

  const petId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    if (!petId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [petData, recordsData] = await Promise.all([
        petService.getById(petId),
        medicalRecordService.listByPet(petId),
      ]);

      setPet(petData);

      // Sort by record_date descending (newest on top)
      const sortedRecords = [...recordsData].sort((a, b) => {
        const dateA = new Date(a.record_date || a.created_at || 0).getTime();
        const dateB = new Date(b.record_date || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setRecords(sortedRecords);
    } catch (err: any) {
      console.error("Lỗi khi tải hồ sơ bệnh án:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể tải thông tin hồ sơ bệnh án. Vui lòng kiểm tra lại kết nối."
      );
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter records by search term (diagnosis, doctor name, treatment)
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase();
    return records.filter((r) => {
      const diagnosis = (r.diagnosis || "").toLowerCase();
      const doctor = (r.doctor_name || "").toLowerCase();
      const treatment = (r.treatment || "").toLowerCase();
      return diagnosis.includes(q) || doctor.includes(q) || treatment.includes(q);
    });
  }, [records, searchTerm]);

  if (isLoading) {
    return <MedicalRecordsSkeleton />;
  }

  if (error && !pet) {
    return <PetNotFoundState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!pet) {
    return <PetNotFoundState />;
  }

  const petSpeciesKey = (pet.species?.toLowerCase() || "other") as PetSpecies;
  const speciesColors =
    SPECIES_BADGE_COLORS[petSpeciesKey] || SPECIES_BADGE_COLORS.other;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
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
        <span className="text-slate-900 font-semibold">Hồ sơ bệnh án</span>
      </nav>

      {/* ─── Pet Overview Header ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 flex items-center justify-center text-3xl shadow-sm">
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
            <Link
              href={`/pets/${pet.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              <ArrowLeft size={14} />
              Chi tiết bé
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Timeline Section Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-sky-600" />
            Lịch sử khám bệnh & Bệnh án
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng {records.length} lần ghi nhận khám bệnh theo trình tự thời gian
          </p>
        </div>

        {records.length > 1 && (
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm theo chẩn đoán, bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        )}
      </div>

      {/* ─── Main Content / Timeline / Empty State ───────────────────────── */}
      {records.length === 0 ? (
        <EmptyMedicalRecordsState petName={pet.name} />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">
            Không tìm thấy hồ sơ bệnh án phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-3 text-xs text-primary font-semibold hover:underline"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-6 border-l-2 border-slate-200/70 ml-3 sm:ml-4 space-y-6">
          {filteredRecords.map((record, index) => {
            const recordId = record.id ?? record.record_id;
            const dateStr = record.record_date || record.created_at;
            const formattedDate = formatDate(dateStr);
            const relativeTime = dateStr ? formatRelativeTime(dateStr) : "";

            return (
              <motion.div
                key={recordId || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Timeline node icon */}
                <div className="absolute -left-[27px] sm:-left-[35px] top-6 w-6 h-6 rounded-full bg-white border-2 border-sky-500 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-50 transition-all">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                </div>

                {/* Record Card */}
                <div
                  onClick={() => router.push(`/medical-records/${recordId}`)}
                  className="cursor-pointer bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Top Row: Date & Doctor Badge */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-xs font-semibold text-sky-700">
                        <Calendar size={13} className="text-sky-500" />
                        <span>{formattedDate}</span>
                      </div>

                      {relativeTime && (
                        <span className="text-[11px] text-slate-400">
                          ({relativeTime})
                        </span>
                      )}

                      {record.weight_at_visit && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/70 text-[11px] font-medium text-slate-600">
                          <Weight size={11} className="text-slate-400" />
                          {record.weight_at_visit} kg
                        </span>
                      )}
                    </div>

                    {/* Diagnosis (Shortened / Clamped) */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {record.diagnosis || "Khám tổng quát định kỳ"}
                      </h3>
                      {record.treatment && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          <span className="font-medium text-slate-600">Điều trị:</span>{" "}
                          {record.treatment}
                        </p>
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Stethoscope size={11} />
                      </div>
                      <span className="font-medium text-slate-700">
                        {record.doctor_name || "Bác sĩ thú y"}
                      </span>
                      {record.appointment_id && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-400">
                            Lịch hẹn #{record.appointment_id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right CTA */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-semibold text-sky-600 group-hover:underline flex items-center gap-1">
                      Chi tiết bệnh án
                      <ChevronRight
                        size={16}
                        className="text-sky-500 group-hover:translate-x-1 transition-transform"
                      />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
