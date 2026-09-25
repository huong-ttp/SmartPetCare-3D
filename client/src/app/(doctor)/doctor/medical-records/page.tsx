"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Stethoscope,
  Search,
  Calendar,
  CalendarDays,
  Dog,
  Cat,
  User,
  Phone,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  SlidersHorizontal,
  FolderHeart,
  ArrowUpRight,
  Syringe,
  Pill,
  Thermometer,
  Weight,
  Clock,
  Receipt,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  Info,
  CalendarCheck,
  Save,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { MedicalRecord, UpdateMedicalRecordDTO } from "@/types/medical-record.type";
import type { PetSpecies } from "@/types/pet.type";
import { cn } from "@/utils/cn";
import { getSpeciesEmoji, getSpeciesLabel, SPECIES_BADGE_COLORS } from "@/utils/petHelpers";
import { useToast } from "@/components/ui/Toast";

type SpeciesFilter = "all" | "dog" | "cat" | "other";
type ViewMode = "table" | "cards";

// ─── SKELETON LOADERS ────────────────────────────────────────────────────────
function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-7 w-16 bg-slate-200 rounded" />
      <div className="h-3 w-32 bg-slate-200 rounded" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-200 rounded" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
      </td>
      <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
      <td className="py-4 px-4"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
      <td className="py-4 px-4"><div className="h-6 w-24 bg-slate-200 rounded-full" /></td>
      <td className="py-4 px-4"><div className="h-8 w-20 bg-slate-200 rounded-xl ml-auto" /></td>
    </tr>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
        <div className="h-3.5 bg-slate-200 rounded w-full" />
      </div>
      <div className="pt-2 flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-24" />
        <div className="h-8 bg-slate-200 rounded-xl w-20" />
      </div>
    </div>
  );
}

// ─── MAIN DOCTOR MEDICAL RECORDS PAGE ────────────────────────────────────────
export default function DoctorMedicalRecordsPage() {
  const { user } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  // Data states
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Modals state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MedicalRecord | null>(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<MedicalRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    diagnosis: string;
    treatment: string;
    prescription: string;
    weight_at_visit: string;
    temperature: string;
    follow_up_date: string;
    notes: string;
  }>({
    diagnosis: "",
    treatment: "",
    prescription: "",
    weight_at_visit: "",
    temperature: "",
    follow_up_date: "",
    notes: "",
  });

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load records
  const fetchRecords = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const docId = user?.user_id || user?.id || "u2";
        const data = await medicalRecordService.listByDoctor(docId);
        setRecords(data || []);
      } catch (err: any) {
        console.error("[DoctorMedicalRecordsPage] Failed to load medical records:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải hồ sơ bệnh án. Đã tự động kích hoạt chế độ dự phòng cục bộ."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Client-side Filter
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Filter by search query (pet name, owner name, diagnosis, record id)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((r) => {
        const petName = (r.pet_name || "").toLowerCase();
        const ownerName = (r.owner_name || "").toLowerCase();
        const diagnosis = (r.diagnosis || "").toLowerCase();
        const code = String(r.id || r.record_id || "").toLowerCase();
        const breed = (r.pet_breed || "").toLowerCase();
        return (
          petName.includes(q) ||
          ownerName.includes(q) ||
          diagnosis.includes(q) ||
          code.includes(q) ||
          breed.includes(q)
        );
      });
    }

    // Filter by species
    if (speciesFilter !== "all") {
      if (speciesFilter === "other") {
        result = result.filter((r) => {
          const sp = (r.pet_species || "").toLowerCase();
          return sp !== "dog" && sp !== "cat";
        });
      } else {
        result = result.filter(
          (r) => (r.pet_species || "").toLowerCase() === speciesFilter
        );
      }
    }

    // Filter by date range (dateFrom - dateTo)
    if (dateFrom) {
      result = result.filter((r) => {
        const rDate = (r.record_date || r.created_at || "").slice(0, 10);
        return rDate >= dateFrom;
      });
    }
    if (dateTo) {
      result = result.filter((r) => {
        const rDate = (r.record_date || r.created_at || "").slice(0, 10);
        return rDate <= dateTo;
      });
    }

    // Sắp xếp ngày mới nhất lên đầu
    result.sort((a, b) => {
      const dateA = new Date(a.record_date || a.created_at || "").getTime();
      const dateB = new Date(b.record_date || b.created_at || "").getTime();
      return dateB - dateA;
    });

    return result;
  }, [records, debouncedSearch, speciesFilter, dateFrom, dateTo]);

  // Aggregate clinical metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonth = records.filter((r) => {
      const d = new Date(r.record_date || r.created_at || "");
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const withPrescription = records.filter(
      (r) => r.prescription && r.prescription.trim() !== ""
    ).length;

    const withVaccine = records.filter(
      (r) => r.vaccinations && r.vaccinations.length > 0
    ).length;

    return {
      total,
      thisMonth,
      withPrescription,
      withVaccine,
    };
  }, [records]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSpeciesFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    speciesFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  // Open Edit Modal
  const handleOpenEdit = (rec: MedicalRecord) => {
    setSelectedRecordForEdit(rec);
    setEditForm({
      diagnosis: rec.diagnosis || "",
      treatment: rec.treatment || "",
      prescription: rec.prescription || "",
      weight_at_visit: rec.weight_at_visit ? String(rec.weight_at_visit) : "",
      temperature: rec.temperature ? String(rec.temperature) : "",
      follow_up_date: rec.follow_up_date ? rec.follow_up_date.slice(0, 10) : "",
      notes: rec.notes || "",
    });
  };

  // Submit Update Record
  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForEdit) return;

    if (!editForm.diagnosis.trim()) {
      showToastError("Vui lòng nhập kết luận chẩn đoán bệnh.");
      return;
    }

    const recId = selectedRecordForEdit.id || selectedRecordForEdit.record_id;
    if (!recId) return;

    setIsUpdating(true);
    try {
      const dto: UpdateMedicalRecordDTO = {
        diagnosis: editForm.diagnosis.trim(),
        treatment: editForm.treatment.trim() || undefined,
        prescription: editForm.prescription.trim() || undefined,
        weight_at_visit: editForm.weight_at_visit ? Number(editForm.weight_at_visit) : undefined,
        temperature: editForm.temperature ? Number(editForm.temperature) : undefined,
        follow_up_date: editForm.follow_up_date || undefined,
        notes: editForm.notes.trim() || undefined,
      };

      const updated = await medicalRecordService.update(recId, dto);

      // Cập nhật lại record trong state
      setRecords((prev) =>
        prev.map((r) =>
          String(r.id || r.record_id) === String(recId)
            ? { ...r, ...updated, ...dto }
            : r
        )
      );

      // Nếu đang xem chi tiết record này, cập nhật cả modal chi tiết
      if (selectedRecordForDetail && String(selectedRecordForDetail.id || selectedRecordForDetail.record_id) === String(recId)) {
        setSelectedRecordForDetail((prev) => (prev ? { ...prev, ...updated, ...dto } : null));
      }

      showToastSuccess(`Đã cập nhật hồ sơ bệnh án #${recId} thành công!`);
      setSelectedRecordForEdit(null);
    } catch (err: any) {
      console.error("[DoctorMedicalRecordsPage] Update record error:", err);
      showToastError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể cập nhật hồ sơ bệnh án. Vui lòng thử lại."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper date formatter
  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.slice(0, 10);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* ─── 1. TOP HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
              <Stethoscope size={14} className="text-sky-400" />
              <span>Bác sĩ phụ trách: {user?.full_name || "Bác sĩ thú y"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Hồ Sơ Bệnh Án
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quản lý toàn bộ hồ sơ y tế, chẩn đoán bệnh, phác đồ điều trị, đơn thuốc và lịch sử tiêm chủng của thú cưng do bạn trực tiếp phụ trách.
            </p>
          </div>

          {/* Actions & Refresh */}
          <div className="flex items-center gap-3">
            <button
              id="refresh-medical-records-btn"
              type="button"
              onClick={() => fetchRecords(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 shadow-xs cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw
                size={15}
                className={cn(isRefreshing ? "animate-spin text-sky-400" : "")}
              />
              <span>Làm mới</span>
            </button>

            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all shadow-md shadow-sky-500/25 active:scale-95 cursor-pointer"
            >
              <CalendarCheck size={15} />
              <span>Lịch khám hôm nay</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. TOP METRIC CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <MetricCardSkeleton key={idx} />)
        ) : (
          <>
            {/* Card 1: Tổng số bệnh án */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tổng bệnh án
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  {metrics.total}
                </div>
                <p className="text-xs text-slate-400 mt-1">Đã lưu trữ trên hệ thống</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-600 opacity-80" />
            </motion.div>

            {/* Card 2: Bệnh án trong tháng */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trong tháng này
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading">
                  {metrics.thisMonth}
                </div>
                <p className="text-xs text-slate-400 mt-1">Ca khám hoàn tất tháng này</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-80" />
            </motion.div>

            {/* Card 3: Ca có kê đơn thuốc */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Có đơn thuốc
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Pill size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-heading">
                  {metrics.withPrescription}
                </div>
                <p className="text-xs text-slate-400 mt-1">Đã kê đơn điều trị tại nhà</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-80" />
            </motion.div>

            {/* Card 4: Kết hợp tiêm vắc xin */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tiêm phòng kèm theo
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Syringe size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-heading">
                  {metrics.withVaccine}
                </div>
                <p className="text-xs text-slate-400 mt-1">Ca có mũi tiêm phòng lưu hồ sơ</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600 opacity-80" />
            </motion.div>
          </>
        )}
      </div>

      {/* ─── ERROR STATE BANNER ──────────────────────────────────────────── */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchRecords(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shrink-0"
            >
              Tải lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 3. SEARCH & ADVANCED FILTER TOOLBAR ─────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar with debounce 400ms */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="medical-record-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thú cưng, chủ nuôi, chẩn đoán hoặc mã hồ sơ..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Date range filter: dateFrom - dateTo */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[11px] font-medium text-slate-400">Từ:</span>
              <input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[11px] font-medium text-slate-400">Đến:</span>
              <input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
                title="Xem dạng Bảng"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                )}
                title="Xem dạng Thẻ"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Species Filter Pills & Reset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Loài thú cưng:</span>
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
                  type="button"
                  onClick={() => setSpeciesFilter(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-sky-500 text-white shadow-xs shadow-sky-500/25"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  )}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
              >
                <X size={13} />
                <span>Xóa bộ lọc</span>
              </button>
            )}

            <span className="text-xs text-slate-400 font-medium">
              Hiển thị <strong className="text-slate-700">{filteredRecords.length}</strong> / {records.length} hồ sơ
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. MEDICAL RECORDS DATA LIST / TABLE ─────────────────────────── */}
      {isLoading ? (
        viewMode === "table" ? (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã hồ sơ</th>
                    <th className="py-3.5 px-4">Ngày khám</th>
                    <th className="py-3.5 px-4">Thú cưng</th>
                    <th className="py-3.5 px-4">Chủ nuôi</th>
                    <th className="py-3.5 px-4">Chỉ số khám</th>
                    <th className="py-3.5 px-4">Chẩn đoán tóm tắt</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )
      ) : records.length === 0 ? (
        /* Empty state: No records recorded by this doctor */
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs max-w-xl mx-auto my-6 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center text-4xl mx-auto">
            📋
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">Chưa có hồ sơ bệnh án nào</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Khi bạn hoàn thành các buổi khám bệnh và lập bệnh án cho thú cưng, danh sách hồ sơ y tế sẽ tự động lưu trữ và hiển thị tại đây.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-sky-500/20"
            >
              <CalendarCheck size={16} />
              <span>Tiến hành khám lịch hẹn</span>
            </Link>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty state: Filter returned 0 results */
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs max-w-md mx-auto my-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bệnh án phù hợp</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Không có hồ sơ nào khớp với điều kiện tìm kiếm hoặc khoảng thời gian đã chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <X size={14} />
            <span>Xóa bộ lọc tìm kiếm</span>
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* ─── TABLE VIEW ─── */
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4">Mã hồ sơ</th>
                  <th className="py-4 px-4">Ngày khám</th>
                  <th className="py-4 px-4">Thú cưng</th>
                  <th className="py-4 px-4">Chủ nuôi</th>
                  <th className="py-4 px-4">Chỉ số khám</th>
                  <th className="py-4 px-4 min-w-[200px]">Chẩn đoán</th>
                  <th className="py-4 px-4">Trạng thái</th>
                  <th className="py-4 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRecords.map((record) => {
                  const recId = record.id || record.record_id || "MR";
                  const petSpeciesKey = (record.pet_species?.toLowerCase() || "other") as PetSpecies;
                  const speciesColors = SPECIES_BADGE_COLORS[petSpeciesKey] || SPECIES_BADGE_COLORS.other;
                  const hasPrescription = !!(record.prescription && record.prescription.trim());
                  const hasVaccines = !!(record.vaccinations && record.vaccinations.length > 0);

                  return (
                    <tr
                      key={String(recId)}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Record ID */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        #{recId}
                      </td>

                      {/* Visit Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formatDateVN(record.record_date || record.created_at)}</span>
                        </div>
                      </td>

                      {/* Pet Information */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {record.pet_avatar_url ? (
                            <img
                              src={record.pet_avatar_url}
                              alt={record.pet_name || "Pet"}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border",
                                speciesColors.bg,
                                speciesColors.border
                              )}
                            >
                              {getSpeciesEmoji(petSpeciesKey)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                              {record.pet_name || "Bé cưng"}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={cn(
                                  "text-[10px] font-semibold px-1.5 py-0.2 rounded-md border",
                                  speciesColors.bg,
                                  speciesColors.text,
                                  speciesColors.border
                                )}
                              >
                                {getSpeciesLabel(petSpeciesKey)}
                              </span>
                              {record.pet_breed && (
                                <span className="text-[11px] text-slate-500 truncate max-w-[90px]">
                                  {record.pet_breed}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Information */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 truncate max-w-[140px]">
                            <User size={12} className="text-slate-400 shrink-0" />
                            <span>{record.owner_name || "Chủ nuôi"}</span>
                          </div>
                          {record.owner_phone && (
                            <a
                              href={`tel:${record.owner_phone}`}
                              className="flex items-center gap-1 text-[11px] text-sky-600 hover:underline"
                            >
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{record.owner_phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Vitals: Weight & Temp */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <Weight size={12} className="text-teal-500" />
                            <span>
                              {record.weight_at_visit ? `${record.weight_at_visit} kg` : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <Thermometer size={12} className="text-rose-500" />
                            <span>
                              {record.temperature ? `${record.temperature} °C` : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Diagnosis Summary */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <p className="line-clamp-2 text-slate-700 leading-relaxed">
                          {record.diagnosis || "Chưa có kết luận chẩn đoán."}
                        </p>
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {hasPrescription ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              <Pill size={10} />
                              Đã kê đơn thuốc
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                              Không kê đơn
                            </span>
                          )}

                          {hasVaccines && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              <Syringe size={10} />
                              Có tiêm vắc xin
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            <Receipt size={10} />
                            Đã xuất hóa đơn
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForDetail(record)}
                            className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Xem chi tiết bệnh án"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(record)}
                            className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Cập nhật hồ sơ bệnh án"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── CARD VIEW (GRID) ─── */
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredRecords.map((record, index) => {
            const recId = record.id || record.record_id || "MR";
            const petSpeciesKey = (record.pet_species?.toLowerCase() || "other") as PetSpecies;
            const speciesColors = SPECIES_BADGE_COLORS[petSpeciesKey] || SPECIES_BADGE_COLORS.other;
            const hasPrescription = !!(record.prescription && record.prescription.trim());
            const hasVaccines = !!(record.vaccinations && record.vaccinations.length > 0);

            return (
              <motion.div
                key={String(recId)}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="group relative bg-white rounded-3xl border border-slate-100 hover:border-sky-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Accent Top Gradient Line */}
                <div className="h-1.5 bg-gradient-to-r from-sky-400 via-teal-400 to-indigo-500" />

                <div className="p-5 space-y-4 flex-1">
                  {/* Card Header: Code & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      #{recId}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400 font-medium">
                      <Calendar size={12} />
                      <span>{formatDateVN(record.record_date || record.created_at)}</span>
                    </div>
                  </div>

                  {/* Pet Info Section */}
                  <div className="flex items-start gap-3.5">
                    {record.pet_avatar_url ? (
                      <img
                        src={record.pet_avatar_url}
                        alt={record.pet_name || "Pet"}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-2xs group-hover:scale-105 transition-transform shrink-0",
                          speciesColors.bg,
                          speciesColors.border
                        )}
                      >
                        {getSpeciesEmoji(petSpeciesKey)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                        {record.pet_name || "Bé cưng"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                            speciesColors.bg,
                            speciesColors.text,
                            speciesColors.border
                          )}
                        >
                          {getSpeciesEmoji(petSpeciesKey)} {getSpeciesLabel(petSpeciesKey)}
                        </span>
                        {record.pet_breed && (
                          <span className="text-xs text-slate-500 truncate max-w-[120px]">
                            {record.pet_breed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Owner & Vitals Box */}
                  <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <User size={12} />
                        Chủ nuôi:
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                        {record.owner_name || "Chủ nuôi"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Weight size={12} className="text-teal-500" />
                        <span>Cân nặng: <strong>{record.weight_at_visit ? `${record.weight_at_visit} kg` : "—"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Thermometer size={12} className="text-rose-500" />
                        <span>Nhiệt độ: <strong>{record.temperature ? `${record.temperature} °C` : "—"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Chẩn đoán lâm sàng
                    </span>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {record.diagnosis || "Chưa ghi nhận kết luận chẩn đoán."}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hasPrescription && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        <Pill size={10} />
                        Có kê đơn thuốc
                      </span>
                    )}
                    {hasVaccines && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                        <Syringe size={10} />
                        Có tiêm vắc xin
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                      <Receipt size={10} />
                      Đã xuất hóa đơn
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>Xem chi tiết</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(record)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-200 hover:border-amber-500 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Cập nhật</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ─── 5. FULL DETAIL MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRecordForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <FolderHeart size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 font-heading">
                        Chi Tiết Hồ Sơ Bệnh Án
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        #{selectedRecordForDetail.id || selectedRecordForDetail.record_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Khám ngày {formatDateVN(selectedRecordForDetail.record_date || selectedRecordForDetail.created_at)} • Bác sĩ:{" "}
                      <strong>{selectedRecordForDetail.doctor_name || user?.full_name || "BS. Phụ trách"}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Pet & Owner Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pet Info */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Bệnh nhân thú cưng
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedRecordForDetail.pet_avatar_url ? (
                      <img
                        src={selectedRecordForDetail.pet_avatar_url}
                        alt={selectedRecordForDetail.pet_name || "Pet"}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                        {getSpeciesEmoji((selectedRecordForDetail.pet_species?.toLowerCase() || "other") as PetSpecies)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {selectedRecordForDetail.pet_name || "Bé cưng"}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {selectedRecordForDetail.pet_breed || "Chưa rõ giống"} (
                        {getSpeciesLabel((selectedRecordForDetail.pet_species?.toLowerCase() || "other") as PetSpecies)}
                        )
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-medium">
                        <span>Cân: {selectedRecordForDetail.weight_at_visit ? `${selectedRecordForDetail.weight_at_visit} kg` : "—"}</span>
                        <span>Nhiệt: {selectedRecordForDetail.temperature ? `${selectedRecordForDetail.temperature} °C` : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Chủ sở hữu
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                      <User size={14} className="text-slate-400" />
                      <span>{selectedRecordForDetail.owner_name || "Chủ nuôi"}</span>
                    </div>
                    {selectedRecordForDetail.owner_phone && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={13} className="text-slate-400" />
                        <a
                          href={`tel:${selectedRecordForDetail.owner_phone}`}
                          className="text-sky-600 hover:underline font-medium"
                        >
                          {selectedRecordForDetail.owner_phone}
                        </a>
                      </div>
                    )}
                    {selectedRecordForDetail.owner_email && (
                      <p className="text-slate-500 truncate">
                        {selectedRecordForDetail.owner_email}
                      </p>
                    )}
                    {selectedRecordForDetail.service_name && (
                      <div className="pt-1 text-[11px] text-teal-700 font-semibold">
                        Dịch vụ: {selectedRecordForDetail.service_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnosis, Treatment, Prescription, Notes */}
              <div className="space-y-4">
                {/* Diagnosis */}
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
                    <Stethoscope size={15} className="text-sky-600" />
                    <span>Kết luận chẩn đoán lâm sàng</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedRecordForDetail.diagnosis || "Chưa có chẩn đoán."}
                  </p>
                </div>

                {/* Treatment */}
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={15} className="text-teal-600" />
                    <span>Phác đồ điều trị</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedRecordForDetail.treatment || "Không có chỉ định phác đồ đặc biệt."}
                  </p>
                </div>

                {/* Prescription */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <Pill size={15} className="text-amber-600" />
                    <span>Đơn thuốc & Hướng dẫn liều dùng</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono bg-white/70 p-3 rounded-xl border border-amber-200/60">
                    {selectedRecordForDetail.prescription || "Không có đơn thuốc chỉ định."}
                  </p>
                </div>

                {/* Notes & Follow up date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dặn dò & Ghi chú
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecordForDetail.notes || "Không có dặn dò bổ sung."}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hẹn tái khám
                    </span>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <CalendarDays size={16} className="text-sky-500" />
                      <span>
                        {selectedRecordForDetail.follow_up_date
                          ? formatDateVN(selectedRecordForDetail.follow_up_date)
                          : "Không có lịch hẹn tái khám"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vaccinations Section */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                      <Syringe size={15} className="text-purple-600" />
                      <span>Lịch sử tiêm phòng trong buổi khám</span>
                    </div>
                    {selectedRecordForDetail.vaccinations && selectedRecordForDetail.vaccinations.length > 0 && (
                      <span className="text-[11px] font-bold text-purple-700 px-2 py-0.5 rounded-full bg-purple-100">
                        {selectedRecordForDetail.vaccinations.length} mũi tiêm
                      </span>
                    )}
                  </div>

                  {selectedRecordForDetail.vaccinations && selectedRecordForDetail.vaccinations.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRecordForDetail.vaccinations.map((vac, i) => (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-xl border border-purple-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {vac.vaccine_name || "Vắc xin phòng bệnh"}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Số lô sản xuất (Batch No):{" "}
                              <strong className="font-mono text-purple-700">
                                {vac.batch_number || "Chưa rõ số lô"}
                              </strong>
                            </span>
                          </div>
                          <div className="text-left sm:text-right text-[11px] text-slate-500 space-y-0.5">
                            <div>Ngày tiêm: <strong>{formatDateVN(vac.date_administered)}</strong></div>
                            {vac.next_due_date && (
                              <div className="text-purple-600 font-medium">
                                Tái chủng: <strong>{formatDateVN(vac.next_due_date)}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Không có vắc xin nào được tiêm trong ca khám này.
                    </p>
                  )}
                </div>

                {/* Auto Generated Invoice Info */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold uppercase tracking-wider">
                      <Receipt size={15} className="text-emerald-600" />
                      <span>Hóa đơn phát sinh tự động</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      <CheckCircle2 size={11} />
                      Đã phát hành
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 pt-1">
                    <span>
                      Liên kết lịch hẹn:{" "}
                      <strong className="font-mono text-slate-900">
                        #{selectedRecordForDetail.appointment_id || "APT"}
                      </strong>
                    </span>
                    <span>
                      Trạng thái khám:{" "}
                      <strong className="text-emerald-700 capitalize">
                        {selectedRecordForDetail.appointment_status || "completed"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForDetail;
                    setSelectedRecordForDetail(null);
                    handleOpenEdit(rec);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Cập nhật hồ sơ này</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 6. UPDATE RECORD MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRecordForEdit && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Edit3 size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-heading">
                      Cập Nhật Hồ Sơ Bệnh Án
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hồ sơ #{selectedRecordForEdit.id || selectedRecordForEdit.record_id} • Bệnh nhân:{" "}
                      <strong>{selectedRecordForEdit.pet_name || "Thú cưng"}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRecordForEdit(null)}
                  disabled={isUpdating}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveUpdate} className="space-y-4">
                {/* Diagnosis (Required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Kết luận chẩn đoán</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="edit-diagnosis-input"
                    rows={3}
                    required
                    value={editForm.diagnosis}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Nhập chẩn đoán lâm sàng bệnh của thú cưng..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                  />
                </div>

                {/* Treatment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Phác đồ điều trị
                  </label>
                  <textarea
                    id="edit-treatment-input"
                    rows={2}
                    value={editForm.treatment}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, treatment: e.target.value }))}
                    placeholder="Chỉ định rửa vết thương, tiêm truyền dịch, vệ sinh tai..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                  />
                </div>

                {/* Prescription */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Toa thuốc & Hướng dẫn sử dụng
                  </label>
                  <textarea
                    id="edit-prescription-input"
                    rows={3}
                    value={editForm.prescription}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, prescription: e.target.value }))}
                    placeholder="Tên thuốc, liều lượng (viên/ngày, giọt/lần), thời gian dùng thuốc..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                  />
                </div>

                {/* Vitals: Weight & Temperature */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Weight size={13} className="text-teal-500" />
                      <span>Cân nặng khi khám (kg)</span>
                    </label>
                    <input
                      id="edit-weight-input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="150"
                      value={editForm.weight_at_visit}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, weight_at_visit: e.target.value }))}
                      placeholder="VD: 4.5"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Thermometer size={13} className="text-rose-500" />
                      <span>Thân nhiệt (°C)</span>
                    </label>
                    <input
                      id="edit-temperature-input"
                      type="number"
                      step="0.1"
                      min="35"
                      max="43"
                      value={editForm.temperature}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, temperature: e.target.value }))}
                      placeholder="VD: 38.5"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                {/* Follow up date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CalendarDays size={13} className="text-sky-500" />
                    <span>Ngày hẹn tái khám</span>
                  </label>
                  <input
                    id="edit-followup-input"
                    type="date"
                    value={editForm.follow_up_date}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, follow_up_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Dặn dò & Ghi chú thêm
                  </label>
                  <textarea
                    id="edit-notes-input"
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Lưu ý chăm sóc, theo dõi phản ứng sau tiêm, chế độ ăn kiêng..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForEdit(null)}
                    disabled={isUpdating}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-all shadow-sm shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
