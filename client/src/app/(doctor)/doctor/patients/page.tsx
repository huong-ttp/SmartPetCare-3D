"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dog,
  Cat,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Phone,
  ChevronRight,
  Stethoscope,
  FileText,
  Activity,
  CheckCircle2,
  X,
  SlidersHorizontal,
  FolderHeart,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { DoctorPatient } from "@/types/medical-record.type";
import type { PetSpecies } from "@/types/pet.type";
import { cn } from "@/utils/cn";
import { getSpeciesEmoji, getSpeciesLabel, SPECIES_BADGE_COLORS } from "@/utils/petHelpers";

type SpeciesFilter = "all" | "dog" | "cat" | "other";
type SortOption = "recent" | "name" | "visits";

// ─── Skeleton Loading Component ──────────────────────────────────────────────
function PatientCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-3.5 bg-slate-200 rounded w-1/2" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
      <div className="pt-2 flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-8 bg-slate-200 rounded-xl w-24" />
      </div>
    </div>
  );
}

// ─── Main Doctor Patients Page ───────────────────────────────────────────────
export default function DoctorPatientsPage() {
  const { user } = useAuth();

  // Data states
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Fetch patients list
  const loadPatients = useCallback(async (showRefreshing = false, query?: string) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const data = await medicalRecordService.listPatientsByDoctor(
        user?.user_id || user?.id,
        query
      );
      setPatients(data || []);
    } catch (err: any) {
      console.error("[DoctorPatientsPage] Error fetching patients:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh sách bệnh nhân. Vui lòng kiểm tra kết nối và thử lại."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Client-side Filter & Sort
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Filter by search query (pet name or owner name or breed)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.owner_name.toLowerCase().includes(q) ||
          (p.breed && p.breed.toLowerCase().includes(q)) ||
          (p.owner_phone && p.owner_phone.includes(q))
      );
    }

    // Filter by species
    if (speciesFilter !== "all") {
      if (speciesFilter === "other") {
        result = result.filter(
          (p) => p.species.toLowerCase() !== "dog" && p.species.toLowerCase() !== "cat"
        );
      } else {
        result = result.filter((p) => p.species.toLowerCase() === speciesFilter);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi");
      }
      if (sortBy === "visits") {
        const aVisits = (a.total_records || 0) + (a.total_appointments || 0);
        const bVisits = (b.total_records || 0) + (b.total_appointments || 0);
        return bVisits - aVisits;
      }
      // default: "recent" (by last_visit_date)
      const dateA = a.last_visit_date ? new Date(a.last_visit_date).getTime() : 0;
      const dateB = b.last_visit_date ? new Date(b.last_visit_date).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [patients, searchQuery, speciesFilter, sortBy]);

  // Aggregate stats
  const totalVisitsCount = useMemo(() => {
    return patients.reduce(
      (acc, curr) => acc + (curr.total_records || 0) + (curr.total_appointments || 0),
      0
    );
  }, [patients]);

  return (
    <div className="space-y-6">
      {/* ─── HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
              <Stethoscope size={14} className="text-sky-400" />
              <span>Bác sĩ Phụ trách: {user?.full_name || "Bác sĩ thú y"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Danh sách Bệnh nhân
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Tổng hợp tất cả thú cưng từng được bạn khám, điều trị hoặc hoàn thành lịch hẹn.
              Nhấp vào hồ sơ để xem chi tiết bệnh án và lịch sử tiêm chủng.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl text-center min-w-[110px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
                Bệnh nhân
              </span>
              <span className="text-xl font-bold text-white font-heading">
                {isLoading ? "..." : patients.length}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl text-center min-w-[110px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
                Lượt khám
              </span>
              <span className="text-xl font-bold text-sky-400 font-heading">
                {isLoading ? "..." : totalVisitsCount}
              </span>
            </div>

            <button
              id="refresh-patients-btn"
              onClick={() => loadPatients(true)}
              disabled={isRefreshing}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors active:scale-95 disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RefreshCw size={18} className={cn(isRefreshing ? "animate-spin text-sky-400" : "")} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── ERROR STATE NOTIFICATION ──────────────────────────────────────── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => loadPatients(false)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shrink-0 shadow-sm"
            >
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SEARCH & FILTER CONTROLS BAR ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="patient-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên pet, tên chủ nuôi hoặc giống..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={16} className="text-slate-400 hidden sm:block" />
            <span className="text-xs text-slate-500 font-medium hidden sm:block">Sắp xếp:</span>
            <select
              id="patient-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              <option value="recent">Khám gần nhất</option>
              <option value="name">Tên thú cưng (A-Z)</option>
              <option value="visits">Nhiều lượt khám nhất</option>
            </select>
          </div>
        </div>

        {/* Species Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-1">Loài:</span>
          {(
            [
              { id: "all", label: "Tất cả", emoji: "🐾" },
              { id: "dog", label: "Chó", emoji: "🐕" },
              { id: "cat", label: "Mèo", emoji: "🐈" },
              { id: "other", label: "Khác", emoji: "🐇" },
            ] as const
          ).map((tab) => {
            const isActive = speciesFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSpeciesFilter(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                )}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="ml-auto text-xs text-slate-400 font-medium">
            Hiển thị <span className="font-bold text-slate-700">{filteredPatients.length}</span> / {patients.length} bệnh nhân
          </div>
        </div>
      </div>

      {/* ─── PATIENTS GRID / UX STATES ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </div>
      ) : patients.length === 0 ? (
        /* Empty state: Doctor has zero patients recorded */
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm max-w-2xl mx-auto my-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-4xl mx-auto">
            🩺
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">
              Bạn chưa từng khám bệnh nhân nào
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Khi bạn tạo hồ sơ bệnh án hoặc hoàn thành các lịch khám với thú cưng,
              danh sách bệnh nhân sẽ tự động hiển thị tại đây để bạn tiện theo dõi.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Calendar size={16} />
              Xem lịch hẹn hôm nay
            </Link>
          </div>
        </div>
      ) : filteredPatients.length === 0 ? (
        /* Empty state: Filter or search yields 0 results */
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm max-w-md mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              Không tìm thấy bệnh nhân phù hợp
            </h3>
            <p className="text-sm text-slate-500">
              Không có kết quả nào khớp với từ khóa{" "}
              <span className="font-semibold text-slate-700">"{searchQuery}"</span>.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setSpeciesFilter("all");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <X size={14} />
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        /* Grid of Patients (Condensed PetCards) */
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredPatients.map((patient, index) => {
            const petSpeciesKey = (patient.species?.toLowerCase() || "other") as PetSpecies;
            const speciesColors = SPECIES_BADGE_COLORS[petSpeciesKey] || SPECIES_BADGE_COLORS.other;

            return (
              <motion.div
                key={patient.pet_id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-sky-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top Banner Accent */}
                <div className="h-2 bg-gradient-to-r from-sky-400 via-teal-400 to-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="p-5 space-y-4 flex-1">
                  {/* Top section: Avatar, Name, Species badge */}
                  <div className="flex items-start gap-4">
                    {/* Pet Avatar */}
                    <div className="relative shrink-0">
                      {patient.avatar_url ? (
                        <img
                          src={patient.avatar_url}
                          alt={patient.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform",
                            speciesColors.bg
                          )}
                        >
                          {getSpeciesEmoji(petSpeciesKey)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {patient.gender === "female" ? "♀️" : "♂️"}
                      </span>
                    </div>

                    {/* Pet Title & Badges */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/pets/${patient.pet_id}`}
                        className="font-heading font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors truncate block"
                      >
                        {patient.name}
                      </Link>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                            speciesColors.bg,
                            speciesColors.text,
                            speciesColors.border
                          )}
                        >
                          {getSpeciesEmoji(petSpeciesKey)} {getSpeciesLabel(petSpeciesKey)}
                        </span>
                        {patient.breed && (
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[130px]">
                            {patient.breed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Owner Information Section */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <User size={13} className="text-slate-400" />
                        Chủ nuôi:
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                        {patient.owner_name}
                      </span>
                    </div>

                    {patient.owner_phone && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Phone size={13} className="text-slate-400" />
                          Điện thoại:
                        </span>
                        <a
                          href={`tel:${patient.owner_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          {patient.owner_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Medical Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        Khám gần nhất:{" "}
                        <strong className="text-slate-700 font-semibold">
                          {patient.last_visit_date
                            ? new Date(patient.last_visit_date).toLocaleDateString("vi-VN")
                            : "—"}
                        </strong>
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      <CheckCircle2 size={11} />
                      {(patient.total_records || 0) + (patient.total_appointments || 0)} ca khám
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Chế độ xem Bác sĩ</span>
                  <Link
                    href={`/pets/${patient.pet_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-500 hover:text-white text-sky-600 border border-sky-200 hover:border-sky-500 text-xs font-semibold transition-all shadow-sm group/btn"
                  >
                    <span>Xem hồ sơ</span>
                    <ArrowUpRight size={13} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
