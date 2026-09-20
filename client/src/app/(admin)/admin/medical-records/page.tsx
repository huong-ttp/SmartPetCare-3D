"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  ShieldAlert,
  Sparkles,
  Syringe,
  Clock,
  Weight,
  HelpCircle,
} from "lucide-react";
import type { MedicalRecord, AdminMedicalRecordFilterParams } from "@/types/medical-record.type";
import type { User as UserType } from "@/types/user.type";
import { admin, adminService } from "@/services/adminService";
import { medicalRecordService } from "@/services/medicalRecordService";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function AdminMedicalRecordsPage() {
  const router = useRouter();
  const { success: showToastSuccess, error: showToastError } = useToast();

  // Data & Pagination State
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Doctors list for filter dropdown
  const [doctors, setDoctors] = useState<UserType[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Delete Modal State
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Diagnosis View Popover
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load doctors list for filtering
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const docList = await adminService.listDoctors();
        setDoctors(docList || []);
      } catch (err) {
        console.warn("[AdminMedicalRecords] Failed to load doctors:", err);
      }
    };
    loadDoctors();
  }, []);

  // Fetch medical records via API admin.service.listMedicalRecords(filters)
  const fetchRecords = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage("");

      try {
        const filters: AdminMedicalRecordFilterParams = {
          search: debouncedSearch || undefined,
          doctorId: doctorFilter !== "all" ? doctorFilter : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const result = await admin.service.listMedicalRecords(filters);
        setRecords(result.items || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách hồ sơ bệnh án:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách hồ sơ bệnh án. Vui lòng kiểm tra kết nối."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, doctorFilter, dateFrom, dateTo, pagination.page, pagination.limit]
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecords(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setDoctorFilter("all");
    setDateFrom("");
    setDateTo("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    debouncedSearch !== "" || doctorFilter !== "all" || dateFrom !== "" || dateTo !== "";

  // Metrics calculation
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthCount = records.filter((r) => {
      const d = new Date(r.record_date || r.created_at || "");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const withVaccinationsCount = records.filter(
      (r) => r.vaccinations && r.vaccinations.length > 0
    ).length;

    const uniqueDoctors = new Set(records.map((r) => r.doctor_id).filter(Boolean)).size;

    return {
      total: pagination.total,
      thisMonth: thisMonthCount,
      uniqueDoctors: uniqueDoctors || doctors.length,
      withVaccinations: withVaccinationsCount,
    };
  }, [records, pagination.total, doctors.length]);

  // Delete Action Handler
  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    const recId = recordToDelete.id || recordToDelete.record_id;
    if (!recId) return;

    setIsDeleting(true);
    try {
      // API call: medical-record.service.delete(id)
      await medicalRecordService.delete(recId);
      showToastSuccess(`Đã xóa thành công hồ sơ bệnh án #${recId}!`);
      setRecordToDelete(null);
      fetchRecords(false);
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

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "-";
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
      {/* ─── Top Header Card ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-[#0EA5B7] flex items-center justify-center text-white shadow-md shadow-[#0EA5B7]/25 shrink-0">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Giám Sát Hồ Sơ Bệnh Án
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Admin Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Theo dõi và kiểm soát toàn bộ hồ sơ y tế khám chữa bệnh thú cưng trên hệ thống
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50",
              isRefreshing && "opacity-75 pointer-events-none"
            )}
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-[#0EA5B7]")} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ─── Business Rule Notice Banner ────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-sky-50/70 to-teal-50/80 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={17} />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <span>Lưu ý quy trình nghiệp vụ hồ sơ y tế:</span>
          </p>
          <p className="text-slate-700 leading-relaxed">
            Bác sĩ phụ trách là người trực tiếp <strong>TẠO &amp; CẬP NHẬT</strong> hồ sơ bệnh án trong
            quá trình thăm khám. Quản trị viên (Admin) đóng vai trò <strong>GIÁM SÁT</strong> toàn bộ
            hồ sơ trong hệ thống, chỉ can thiệp chỉnh sửa hoặc xóa trong trường hợp đặc biệt (sai sót
            dữ liệu hành chính hoặc chẩn đoán).
          </p>
        </div>
      </div>

      {/* ─── Summary Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng số hồ sơ
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{metrics.total}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Khám tháng này
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{metrics.thisMonth}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bác sĩ phụ trách
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{metrics.uniqueDoctors}</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Syringe size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kèm tiêm phòng
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{metrics.withVaccinations}</p>
          </div>
        </div>
      </div>

      {/* ─── Search & Filter Toolbar ──────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thú cưng, chủ nuôi, bác sĩ, chẩn đoán..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Doctor Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] cursor-pointer"
            >
              <option value="all">Tất cả bác sĩ phụ trách</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  BS. {doc.full_name || doc.email}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filters (4 cols) */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
                title="Từ ngày"
              />
            </div>
            <span className="text-slate-400 text-xs">→</span>
            <div className="flex-1 relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
                title="Đến ngày"
              />
            </div>
          </div>
        </div>

        {/* Filter status row & reset button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter size={13} className="text-[#0EA5B7]" />
              <span>Đang áp dụng bộ lọc tùy chỉnh</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#0EA5B7] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={13} />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Main Medical Records Table ───────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-3 text-slate-500 text-xs font-medium py-8">
              <RefreshCw size={18} className="animate-spin text-[#0EA5B7]" />
              <span>Đang tải danh sách hồ sơ y tế...</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={26} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-900">Không thể tải dữ liệu bệnh án</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchRecords(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && records.length === 0 && (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/80 text-3xl">
              📋
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-slate-900">Không tìm thấy hồ sơ nào</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {hasActiveFilters
                  ? "Không có hồ sơ bệnh án nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại."
                  : "Chưa có hồ sơ bệnh án nào được tạo trong hệ thống."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-sky-50 text-[#0EA5B7] hover:bg-sky-100 text-xs font-bold transition-all cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Table Content */}
        {!isLoading && !errorMessage && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Thú Cưng</th>
                  <th className="py-3.5 px-4 font-bold">Chủ Nuôi</th>
                  <th className="py-3.5 px-4 font-bold">Bác Sĩ</th>
                  <th className="py-3.5 px-4 font-bold">Lịch Hẹn</th>
                  <th className="py-3.5 px-4 font-bold">Ngày Khám</th>
                  <th className="py-3.5 px-4 font-bold min-w-[220px]">Chẩn Đoán (Rút gọn)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => {
                  const recId = record.id || record.record_id;
                  const isCat =
                    record.pet_species?.toLowerCase() === "cat" ||
                    record.pet_species?.toLowerCase() === "mèo";

                  return (
                    <tr
                      key={recId}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Pet column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0 border border-sky-100">
                            {isCat ? <Cat size={18} /> : <Dog size={18} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-xs truncate">
                              {record.pet_name || `Bé #${record.pet_id}`}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {record.pet_breed || (isCat ? "Mèo" : "Chó")}
                              {record.weight_at_visit && (
                                <span className="text-slate-400"> • {record.weight_at_visit}kg</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner column */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-xs">
                            {record.owner_name || "Chủ nuôi"}
                          </p>
                          {record.owner_phone && (
                            <p className="text-[11px] text-slate-400">{record.owner_phone}</p>
                          )}
                        </div>
                      </td>

                      {/* Doctor column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <UserCheck size={12} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">
                              {record.doctor_name || "Bác sĩ phụ trách"}
                            </p>
                            {record.doctor_id && (
                              <p className="text-[10px] text-slate-400">ID: {record.doctor_id}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Appointment column */}
                      <td className="py-3.5 px-4">
                        {record.appointment_id ? (
                          <div className="space-y-0.5">
                            <Link
                              href={`/admin/appointments`}
                              className="font-bold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                            >
                              <span>#{record.appointment_id}</span>
                            </Link>
                            <p className="text-[11px] text-slate-500">
                              {record.service_name || "Khám bệnh"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Vãng lai / Không có</span>
                        )}
                      </td>

                      {/* Record Date column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-xs">
                            {formatDateDisplay(record.record_date || record.created_at)}
                          </p>
                          {record.vaccinations && record.vaccinations.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              <Syringe size={10} />
                              <span>Tiêm phòng ({record.vaccinations.length})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Diagnosis (Truncated) column */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[280px]">
                          <p className="text-slate-700 line-clamp-2 leading-relaxed">
                            {record.diagnosis || "Chưa ghi nhận kết luận chẩn đoán."}
                          </p>
                          {record.diagnosis && record.diagnosis.length > 60 && (
                            <button
                              type="button"
                              onClick={() => setPreviewRecord(record)}
                              className="text-[10px] font-bold text-[#0EA5B7] hover:underline mt-0.5 cursor-pointer"
                            >
                              Xem đầy đủ
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Button */}
                          <Link
                            href={`/admin/medical-records/${recId}`}
                            title="Xem chi tiết bệnh án"
                            className="p-2 rounded-xl text-slate-600 hover:text-[#0EA5B7] hover:bg-sky-50 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </Link>

                          {/* Edit Button */}
                          <Link
                            href={`/admin/medical-records/${recId}/edit`}
                            title="Chỉnh sửa hồ sơ (Admin can thiệp)"
                            className="p-2 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </Link>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            title="Xóa hồ sơ bệnh án"
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
        )}

        {/* ─── Pagination Bar ───────────────────────────────────────────── */}
        {!isLoading && !errorMessage && records.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <p className="text-slate-500">
              Hiển thị{" "}
              <strong>
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              trên tổng số <strong>{pagination.total}</strong> hồ sơ
            </p>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map((p) => {
                const isCurrent = p === pagination.page;
                if (
                  p === 1 ||
                  p === pagination.totalPages ||
                  (p >= pagination.page - 1 && p <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      className={cn(
                        "w-8 h-8 rounded-xl font-bold transition-colors text-xs cursor-pointer",
                        isCurrent
                          ? "bg-[#0EA5B7] text-white shadow-xs"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === pagination.page - 2 || p === pagination.page + 2) {
                  return (
                    <span key={p} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Dialog (With Vaccination Cascade Warning) ─ */}
      <AnimatePresence>
        {recordToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start gap-3.5 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Xác nhận xóa hồ sơ bệnh án
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ #{recordToDelete.id || recordToDelete.record_id} • Thú cưng:{" "}
                    <strong>{recordToDelete.pet_name || "Thú cưng"}</strong>
                  </p>
                </div>
              </div>

              {/* Warning Context */}
              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ bệnh án này khỏi hệ thống cơ sở dữ liệu?
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy thao tác
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

      {/* ─── Diagnosis Preview Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {previewRecord && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope size={18} className="text-[#0EA5B7]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Chẩn đoán lâm sàng #{previewRecord.id || previewRecord.record_id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed max-h-60 overflow-y-auto">
                {previewRecord.diagnosis}
              </div>

              {previewRecord.treatment && (
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Hướng điều trị
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed">
                    {previewRecord.treatment}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
