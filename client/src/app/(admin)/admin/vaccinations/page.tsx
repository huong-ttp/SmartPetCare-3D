"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe,
  Search,
  Calendar,
  Dog,
  Cat,
  User,
  UserCheck,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  Clock,
  Stethoscope,
  Sparkles,
  Info,
  Phone,
  Mail,
  RotateCcw,
  Check,
} from "lucide-react";
import type {
  PetVaccination,
  VaccineType,
  AdminVaccinationFilterParams,
  UpdatePetVaccinationDTO,
} from "@/types/vaccination.type";
import { admin } from "@/services/adminService";
import { vaccination } from "@/services/vaccinationService";
import { vaccineTypeService } from "@/services/vaccineTypeService";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

// ─── Due Status Computation (Chuẩn Prompt 11) ──────────────────────────────────

export interface DueStatusInfo {
  status: "overdue" | "due_soon" | "valid" | "unknown";
  label: string;
  diffDays: number;
  badgeClass: string;
  dotClass: string;
}

export function getVaccineDueStatus(
  nextDueDateStr: string | null | undefined
): DueStatusInfo {
  if (!nextDueDateStr) {
    return {
      status: "unknown",
      label: "Chưa xác định",
      diffDays: 0,
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
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

// ─── Format Date Utility ───────────────────────────────────────────────────────

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

// ─── Calculate Next Due Date Helper ────────────────────────────────────────────

function calculateNextDueDate(
  dateAdministeredStr: string,
  intervalDays: number
): string {
  if (!dateAdministeredStr) return "";
  const d = new Date(dateAdministeredStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + (intervalDays || 365));
  return d.toISOString().split("T")[0];
}

// ─── Main Admin Vaccinations Page Component ────────────────────────────────────

export default function AdminVaccinationsPage() {
  const { success: showToastSuccess, error: showToastError } = useToast();

  // Data & Pagination State
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Vaccine Types for filter and form
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [vaccineTypeFilter, setVaccineTypeFilter] = useState<string>("all");
  const [dueStatusFilter, setDueStatusFilter] = useState<string>("all");

  // View Modal State
  const [viewItem, setViewItem] = useState<PetVaccination | null>(null);

  // Edit Modal State
  const [editItem, setEditItem] = useState<PetVaccination | null>(null);
  const [editBatchNumber, setEditBatchNumber] = useState("");
  const [editDateAdministered, setEditDateAdministered] = useState("");
  const [editNextDueDate, setEditNextDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirm Modal State
  const [itemToDelete, setItemToDelete] = useState<PetVaccination | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Vaccine Types catalog once
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await vaccineTypeService.list();
        setVaccineTypes(types || []);
      } catch (err) {
        console.warn("[AdminVaccinations] Failed to load vaccine types:", err);
      }
    };
    loadTypes();
  }, []);

  // Fetch Vaccinations via API: admin.service.listVaccinations(filters)
  const fetchVaccinations = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage("");

      try {
        const filters: AdminVaccinationFilterParams = {
          search: debouncedSearch || undefined,
          vaccineType: vaccineTypeFilter !== "all" ? vaccineTypeFilter : undefined,
          dueStatus:
            dueStatusFilter !== "all"
              ? (dueStatusFilter as any)
              : undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const result = await admin.service.listVaccinations(filters);
        setVaccinations(result.items || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách tiêm chủng:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      debouncedSearch,
      vaccineTypeFilter,
      dueStatusFilter,
      pagination.page,
      pagination.limit,
    ]
  );

  useEffect(() => {
    fetchVaccinations(true);
  }, [fetchVaccinations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVaccinations(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setVaccineTypeFilter("all");
    setDueStatusFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // ─── Open Edit Modal & Handle Date Recalculation ──────────────────────────────

  const handleOpenEdit = (item: PetVaccination) => {
    setEditItem(item);
    setEditBatchNumber(item.batch_number || item.lot_number || "");
    const dateAdmin = item.date_administered ? item.date_administered.slice(0, 10) : "";
    setEditDateAdministered(dateAdmin);
    setEditNextDueDate(item.next_due_date ? item.next_due_date.slice(0, 10) : "");
    setEditNotes(item.notes || "");
  };

  // Khi date_administered thay đổi trong form Edit, TỰ ĐỘNG tính lại next_due_date
  const handleDateAdministeredChange = (newDate: string) => {
    setEditDateAdministered(newDate);
    if (!editItem) return;

    const matchedVt = vaccineTypes.find(
      (vt) =>
        String(vt.id) === String(editItem.vaccine_type_id) ||
        String(vt.vaccine_type_id) === String(editItem.vaccine_type_id)
    );
    const intervalDays =
      editItem.recommended_interval_days ||
      matchedVt?.recommended_interval_days ||
      365;

    const calculatedDueDate = calculateNextDueDate(newDate, intervalDays);
    setEditNextDueDate(calculatedDueDate);
  };

  // Submit Edit Form via API: vaccination.service.update(id)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    if (!editBatchNumber.trim()) {
      showToastError("Vui lòng nhập số lô vắc xin (Batch / Lot number)");
      return;
    }
    if (!editDateAdministered) {
      showToastError("Vui lòng chọn ngày thực hiện tiêm phòng");
      return;
    }

    setIsSavingEdit(true);
    const targetId = editItem.vaccination_id || editItem.id;

    try {
      const payload: UpdatePetVaccinationDTO = {
        batch_number: editBatchNumber.trim(),
        date_administered: editDateAdministered,
        notes: editNotes.trim(),
      };

      await vaccination.service.update(targetId!, payload);
      showToastSuccess("Đã cập nhật hồ sơ tiêm chủng thành công!");
      setEditItem(null);
      fetchVaccinations(false);
    } catch (err: any) {
      console.error("Lỗi khi cập nhật mũi tiêm:", err);
      showToastError(
        err?.response?.data?.message ||
          err?.message ||
          "Cập nhật thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── Delete Action via API: vaccination.service.delete(id) ───────────────────

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const targetId = itemToDelete.vaccination_id || itemToDelete.id;

    try {
      await vaccination.service.delete(targetId!);
      showToastSuccess("Đã xóa bản ghi tiêm phòng khỏi hệ thống!");
      setItemToDelete(null);
      fetchVaccinations(false);
    } catch (err: any) {
      console.error("Lỗi khi xóa bản ghi tiêm phòng:", err);
      showToastError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể xóa bản ghi tiêm phòng. Vui lòng thử lại sau."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Stats calculation ───────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let overdueCount = 0;
    let dueSoonCount = 0;
    let validCount = 0;

    vaccinations.forEach((item) => {
      const statusInfo = getVaccineDueStatus(item.next_due_date);
      if (statusInfo.status === "overdue") overdueCount++;
      else if (statusInfo.status === "due_soon") dueSoonCount++;
      else if (statusInfo.status === "valid") validCount++;
    });

    return {
      total: pagination.total,
      overdue: overdueCount,
      dueSoon: dueSoonCount,
      valid: validCount,
    };
  }, [vaccinations, pagination.total]);

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    vaccineTypeFilter !== "all" ||
    dueStatusFilter !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* ─── Header & Breadcrumb ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Link href="/admin/dashboard" className="hover:text-primary transition-colors">
                  Admin Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-bold">Giám sát Tiêm chủng</span>
              </div>
              <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                Quản lý Tiêm Chủng Thú Cưng
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-primary")} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ─── Statistics Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Vaccinations */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tổng Mũi Tiêm
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Syringe size={22} />
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Quá Hạn Tiêm
              </p>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">
                {stats.overdue}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>

          {/* Due Soon (Sắp đến hạn) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Sắp Đến Hạn (30 ngày)
              </p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {stats.dueSoon}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>

          {/* Valid (Còn hạn) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Đang Còn Hạn
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {stats.valid}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* ─── Search & Filter Toolbar ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên thú cưng hoặc chủ nuôi..."
                className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Vaccine Type */}
            <div className="md:col-span-4 relative">
              <div className="relative">
                <select
                  value={vaccineTypeFilter}
                  onChange={(e) => {
                    setVaccineTypeFilter(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-3 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 font-medium appearance-none cursor-pointer"
                >
                  <option value="all">Tất cả loại vắc xin</option>
                  {vaccineTypes.map((vt) => (
                    <option key={String(vt.id || vt.vaccine_type_id)} value={String(vt.id || vt.vaccine_type_id)}>
                      {vt.name} ({vt.recommended_interval_days} ngày)
                    </option>
                  ))}
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Filter Due Status */}
            <div className="md:col-span-3 relative">
              <div className="relative">
                <select
                  value={dueStatusFilter}
                  onChange={(e) => {
                    setDueStatusFilter(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-3 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 font-medium appearance-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái hạn</option>
                  <option value="due_soon">Sắp đến hạn (≤ 30 ngày)</option>
                  <option value="overdue">Quá hạn tiêm</option>
                  <option value="valid">Còn hạn an toàn</option>
                </select>
                <Clock
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Badges & Reset */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-medium">Đang lọc:</span>

              {debouncedSearch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  Từ khóa: &ldquo;{debouncedSearch}&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-rose-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {vaccineTypeFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-medium">
                  Loại:{" "}
                  {vaccineTypes.find(
                    (v) => String(v.id || v.vaccine_type_id) === vaccineTypeFilter
                  )?.name || vaccineTypeFilter}
                  <button
                    type="button"
                    onClick={() => setVaccineTypeFilter("all")}
                    className="hover:text-rose-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {dueStatusFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-medium">
                  Trạng thái:{" "}
                  {dueStatusFilter === "overdue"
                    ? "Quá hạn"
                    : dueStatusFilter === "due_soon"
                    ? "Sắp đến hạn"
                    : "Còn hạn"}
                  <button
                    type="button"
                    onClick={() => setDueStatusFilter("all")}
                    className="hover:text-rose-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-teal-600 font-bold hover:underline ml-auto"
              >
                <RotateCcw size={12} />
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* ─── Main Content: Table / Loading / Empty / Error ──────────────────── */}
        {isLoading ? (
          <VaccinationsTableSkeleton />
        ) : errorMessage ? (
          <div className="bg-white rounded-3xl border border-rose-100 p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu tiêm phòng</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchVaccinations(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
            >
              <RefreshCw size={14} />
              Thử lại ngay
            </button>
          </div>
        ) : vaccinations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-sm space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
              <Syringe size={30} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {hasActiveFilters ? "Không có kết quả phù hợp" : "Chưa có dữ liệu tiêm chủng"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {hasActiveFilters
                  ? "Thử nới lỏng từ khóa tìm kiếm hoặc đặt lại các bộ lọc vắc xin / trạng thái hạn."
                  : "Hệ thống hiện tại chưa ghi nhận mũi tiêm phòng nào của thú cưng."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-colors"
              >
                <RotateCcw size={13} />
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5">Thú cưng (Pet)</th>
                    <th className="py-4 px-4">Chủ nuôi (Owner)</th>
                    <th className="py-4 px-4">Loại Vắc xin (Vaccine)</th>
                    <th className="py-4 px-4">Bác sĩ (Doctor)</th>
                    <th className="py-4 px-4 whitespace-nowrap">Ngày tiêm</th>
                    <th className="py-4 px-4 whitespace-nowrap">Hạn tiêm nhắc</th>
                    <th className="py-4 px-4">Số lô (Batch)</th>
                    <th className="py-4 px-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {vaccinations.map((vac, idx) => {
                    const vacId = vac.vaccination_id || vac.id || idx;
                    const dueInfo = getVaccineDueStatus(vac.next_due_date);
                    const isCat =
                      vac.pet_species?.toLowerCase() === "cat" ||
                      vac.pet_species?.toLowerCase() === "mèo";
                    const isRabbit =
                      vac.pet_species?.toLowerCase() === "rabbit" ||
                      vac.pet_species?.toLowerCase() === "thỏ";
                    const batch = vac.batch_number || vac.lot_number || "—";

                    return (
                      <tr
                        key={vacId}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* 1. Pet Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                              {isCat ? (
                                <Cat size={18} />
                              ) : isRabbit ? (
                                <span className="text-base leading-none">🐰</span>
                              ) : (
                                <Dog size={18} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 text-xs truncate">
                                {vac.pet_name || `Bé #${vac.pet_id}`}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate capitalize">
                                {vac.pet_breed || (isCat ? "Mèo" : isRabbit ? "Thỏ" : "Chó")}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Owner Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 text-xs">
                              {vac.owner_name || "Chủ nuôi"}
                            </p>
                            {vac.owner_phone ? (
                              <p className="text-[11px] text-slate-400 font-mono">
                                {vac.owner_phone}
                              </p>
                            ) : vac.owner_email ? (
                              <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                {vac.owner_email}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* 3. Vaccine Type Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {vac.vaccine_name || vac.vaccine_type || "Vắc xin phòng bệnh"}
                              </span>
                            </p>
                            {vac.recommended_interval_days && (
                              <p className="text-[10px] text-slate-400">
                                Chu kỳ nhắc: {vac.recommended_interval_days} ngày
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 4. Doctor Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Stethoscope size={11} />
                            </div>
                            <span className="font-medium text-slate-800 text-xs truncate max-w-[140px]">
                              {vac.doctor_name || "BS. Phụ trách"}
                            </span>
                          </div>
                        </td>

                        {/* 5. Date Administered */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 text-xs">
                          {formatDateDisplay(vac.date_administered)}
                        </td>

                        {/* 6. Next Due Date + Badge (Chuẩn Prompt 11) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 text-xs">
                              {formatDateDisplay(vac.next_due_date)}
                            </p>
                            <div>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs",
                                  dueInfo.badgeClass
                                )}
                              >
                                <span
                                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", dueInfo.dotClass)}
                                />
                                {dueInfo.label}
                                {dueInfo.status === "overdue" && (
                                  <span className="text-[10px] font-normal opacity-85">
                                    ({Math.abs(dueInfo.diffDays)} ngày)
                                  </span>
                                )}
                                {dueInfo.status === "due_soon" && (
                                  <span className="text-[10px] font-normal opacity-85">
                                    ({dueInfo.diffDays} ngày nữa)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 7. Batch Number */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md inline-block">
                            {batch}
                          </span>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Detail Button */}
                            <button
                              type="button"
                              onClick={() => setViewItem(vac)}
                              title="Xem chi tiết mũi tiêm"
                              className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(vac)}
                              title="Chỉnh sửa (Sửa số lô, ngày tiêm)"
                              className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Edit3 size={15} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setItemToDelete(vac)}
                              title="Xóa bản ghi tiêm phòng"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── Pagination Bar ──────────────────────────────────────────────── */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Hiển thị{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(
                    (pagination.page - 1) * pagination.limit + 1,
                    pagination.total
                  )}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-bold text-slate-800">
                  {pagination.total}
                </span>{" "}
                bản ghi
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft size={14} />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl">
                  {pagination.page} / {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang sau"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: VIEW DETAILS ────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                    <Syringe size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Chi tiết hồ sơ tiêm chủng
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ID: #{viewItem.vaccination_id || viewItem.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Due Status Banner */}
                {(() => {
                  const dueInfo = getVaccineDueStatus(viewItem.next_due_date);
                  return (
                    <div
                      className={cn(
                        "p-3.5 rounded-2xl border flex items-center justify-between gap-3",
                        dueInfo.badgeClass
                      )}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <span className={cn("w-2 h-2 rounded-full", dueInfo.dotClass)} />
                        <span>Trạng thái: {dueInfo.label}</span>
                      </div>
                      <span className="text-[11px]">
                        Hạn: {formatDateDisplay(viewItem.next_due_date)}
                      </span>
                    </div>
                  );
                })()}

                {/* Pet & Owner Info */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Thú cưng</p>
                    <p className="font-extrabold text-slate-900 mt-0.5 text-sm">
                      {viewItem.pet_name || "—"}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {viewItem.pet_breed || viewItem.pet_species || "Không rõ"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Chủ nuôi</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {viewItem.owner_name || "—"}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {viewItem.owner_phone || viewItem.owner_email || "Chưa có liên hệ"}
                    </p>
                  </div>
                </div>

                {/* Vaccine & Doctor Info */}
                <div className="space-y-2.5">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Loại vắc xin:</span>
                    <span className="font-bold text-slate-900">
                      {viewItem.vaccine_name || viewItem.vaccine_type || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Bác sĩ phụ trách:</span>
                    <span className="font-bold text-slate-800">
                      {viewItem.doctor_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Số lô vắc xin (Batch):</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {viewItem.batch_number || viewItem.lot_number || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Ngày thực hiện tiêm:</span>
                    <span className="font-bold text-slate-800">
                      {formatDateDisplay(viewItem.date_administered)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Hạn tiêm nhắc lại:</span>
                    <span className="font-bold text-slate-900">
                      {formatDateDisplay(viewItem.next_due_date)}
                    </span>
                  </div>
                  {viewItem.appointment_id && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Lịch hẹn liên kết:</span>
                      <Link
                        href={`/admin/appointments`}
                        className="font-bold text-teal-600 hover:underline"
                      >
                        #{viewItem.appointment_id}
                      </Link>
                    </div>
                  )}
                  {viewItem.notes && (
                    <div className="pt-2">
                      <p className="text-slate-500 font-medium mb-1">Ghi chú lâm sàng:</p>
                      <p className="p-3 rounded-xl bg-slate-50 text-slate-700 text-[11px] leading-relaxed border border-slate-100">
                        {viewItem.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = viewItem;
                    setViewItem(null);
                    handleOpenEdit(item);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: EDIT VACCINATION ─────────────────────────────────────────── */}
      <AnimatePresence>
        {editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <form onSubmit={handleSaveEdit}>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Edit3 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Chỉnh sửa hồ sơ tiêm chủng
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {editItem.pet_name} • {editItem.vaccine_name || editItem.vaccine_type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditItem(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="p-6 space-y-4 text-xs">
                  {/* Field: Batch Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số lô sản xuất (Batch / Lot number) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editBatchNumber}
                      onChange={(e) => setEditBatchNumber(e.target.value)}
                      placeholder="Ví dụ: RAB-2025-088"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mã lô dùng để truy xuất nguồn gốc và nhà sản xuất vắc xin.
                    </p>
                  </div>

                  {/* Field: Date Administered */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ngày tiêm thực tế (Date administered) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editDateAdministered}
                      onChange={(e) => handleDateAdministeredChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800"
                    />
                  </div>

                  {/* Field: Next Due Date (AUTOMATICALLY RECALCULATED, READONLY) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-600" />
                        Hạn tiêm nhắc (Tự động tính lại)
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Khóa sửa tay
                      </span>
                    </div>

                    <input
                      type="date"
                      disabled
                      readOnly
                      value={editNextDueDate}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-white/80 font-bold text-amber-950 cursor-not-allowed select-none"
                    />

                    <p className="text-[11px] text-amber-800 leading-relaxed flex items-start gap-1.5 pt-0.5">
                      <Info size={13} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        Theo quy định y tế, hạn tiêm nhắc được tính tự động từ{" "}
                        <strong>Ngày tiêm</strong> cộng với chu kỳ khuyến cáo của vắc xin (
                        {editItem.recommended_interval_days || 365} ngày).
                      </span>
                    </p>
                  </div>

                  {/* Field: Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ghi chú phản ứng sau tiêm
                    </label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ghi nhận vị trí tiêm, thân nhiệt bé sau tiêm hoặc phản ứng phụ..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={() => setEditItem(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-sm shadow-amber-600/20 disabled:opacity-50"
                  >
                    {isSavingEdit ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
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

      {/* ─── MODAL: DELETE CONFIRM DIALOG ────────────────────────────────────── */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-sm">
                <Trash2 size={24} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa bản ghi tiêm phòng?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Bạn có chắc chắn muốn xóa bản ghi tiêm vắc xin{" "}
                  <strong className="text-slate-800">
                    {itemToDelete.vaccine_name || itemToDelete.vaccine_type}
                  </strong>{" "}
                  của bé <strong className="text-slate-800">{itemToDelete.pet_name}</strong>?
                  Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Số lô (Batch):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {itemToDelete.batch_number || itemToDelete.lot_number || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ngày tiêm:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateDisplay(itemToDelete.date_administered)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-600/20 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Xóa vĩnh viễn</span>
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

// ─── Loading Skeleton Component ────────────────────────────────────────────────

function VaccinationsTableSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-pulse">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-4 bg-slate-100 rounded w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-slate-100" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-24" />
                <div className="h-2.5 bg-slate-100 rounded w-16" />
              </div>
            </div>
            <div className="h-3.5 bg-slate-100 rounded w-28 hidden md:block" />
            <div className="h-3.5 bg-slate-200 rounded w-32 hidden sm:block" />
            <div className="h-3 bg-slate-100 rounded w-20 hidden lg:block" />
            <div className="h-5 bg-slate-100 rounded-full w-24" />
            <div className="h-7 bg-slate-100 rounded-xl w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
