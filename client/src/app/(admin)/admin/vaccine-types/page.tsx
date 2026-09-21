"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronRight,
  Dog,
  Cat,
  ShieldCheck,
  Calendar,
  Filter,
  X,
  HelpCircle,
} from "lucide-react";
import { VaccineType } from "@/types/vaccination.type";
import { vaccineType as vaccineTypeApi, vaccineTypeService } from "@/services/vaccineTypeService";
import { useToast } from "@/components/ui/Toast";
import VaccineTypeModal, { formatIntervalPreview } from "@/components/admin/vaccine-types/VaccineTypeModal";
import DeleteVaccineTypeModal from "@/components/admin/vaccine-types/DeleteVaccineTypeModal";
import { cn } from "@/utils/cn";

export default function AdminVaccineTypesPage() {
  const toast = useToast();

  // Data State
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [intervalFilter, setIntervalFilter] = useState<"all" | "short" | "medium" | "long">("all");

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<VaccineType | null>(null);
  const [deletingType, setDeletingType] = useState<VaccineType | null>(null);

  // Fetch vaccine types using API: vaccine-type.service.list()
  const fetchVaccineTypes = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await vaccineTypeApi.service.list();
      setVaccineTypes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load vaccine types:", err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh mục loại vắc xin. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVaccineTypes();
  }, [fetchVaccineTypes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVaccineTypes(false);
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return vaccineTypes.filter((vt) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = vt.name?.toLowerCase().includes(query);
        const matchDesc = vt.description?.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      // Interval filter
      const days = vt.recommended_interval_days || 0;
      if (intervalFilter === "short" && days >= 90) return false;
      if (intervalFilter === "medium" && (days < 90 || days > 180)) return false;
      if (intervalFilter === "long" && days < 360) return false;

      return true;
    });
  }, [vaccineTypes, searchQuery, intervalFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = vaccineTypes.length;
    const shortCount = vaccineTypes.filter((v) => (v.recommended_interval_days || 0) < 90).length;
    const mediumCount = vaccineTypes.filter(
      (v) => (v.recommended_interval_days || 0) >= 90 && (v.recommended_interval_days || 0) <= 180
    ).length;
    const longCount = vaccineTypes.filter((v) => (v.recommended_interval_days || 0) >= 360).length;

    return { total, shortCount, mediumCount, longCount };
  }, [vaccineTypes]);

  const handleOpenCreate = () => {
    setEditingType(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (type: VaccineType) => {
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (type: VaccineType) => {
    setDeletingType(type);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium">Quản lý loại vắc xin</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-[#0EA5B7] border border-sky-100 shadow-sm">
              <Syringe size={22} />
            </span>
            Danh mục loại vắc xin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cấu hình danh mục vắc xin và chu kỳ tiêm khuyến cáo phục vụ quản lý lịch tiêm chủng (VACCINE_TYPES).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 shadow-sm"
            title="Tải lại danh sách"
          >
            <RefreshCw size={18} className={cn(isRefreshing && "animate-spin text-[#0EA5B7]")} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0EA5B7] to-sky-600 text-white font-medium text-sm rounded-xl shadow-md shadow-sky-500/20 hover:opacity-95 transition-all"
          >
            <Plus size={18} />
            <span>Thêm loại vaccine</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng số loại vắc xin</p>
            <p className="text-2xl font-heading font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Định kỳ hàng năm (≥365d)</p>
            <p className="text-2xl font-heading font-bold text-slate-900 mt-0.5">{stats.longCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Chu kỳ trung (3 - 6 tháng)</p>
            <p className="text-2xl font-heading font-bold text-slate-900 mt-0.5">{stats.mediumCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Mũi nhắc ngắn (&lt; 3 tháng)</p>
            <p className="text-2xl font-heading font-bold text-slate-900 mt-0.5">{stats.shortCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên vắc xin hoặc nội dung mô tả..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:border-[#0EA5B7] focus:ring-2 focus:ring-[#0EA5B7]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter size={13} /> Lọc chu kỳ:
            </span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "long", label: "Hàng năm (≥ 365 ngày)" },
              { id: "medium", label: "3 - 6 tháng" },
              { id: "short", label: "Dưới 3 tháng" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setIntervalFilter(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  intervalFilter === tab.id
                    ? "bg-[#0EA5B7] text-white shadow-sm shadow-[#0EA5B7]/20"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search indicator */}
        {searchQuery && (
          <div className="text-xs text-slate-500 pt-1 flex items-center gap-2">
            <span>
              Tìm thấy <strong>{filteredList.length}</strong> kết quả cho từ khóa &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[#0EA5B7] hover:underline font-medium"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area (Error / Loading / Empty / Table) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Error State */}
        {errorMessage && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-semibold text-slate-900">Không thể tải dữ liệu</h3>
              <p className="text-sm text-slate-500">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchVaccineTypes(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0EA5B7] rounded-xl hover:opacity-95 shadow-sm"
            >
              <RefreshCw size={16} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !errorMessage && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="h-5 w-44 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-5 w-24 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-32 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && filteredList.length === 0 && (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center border border-sky-100 shadow-inner">
              <Syringe size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-semibold text-slate-800">
                {searchQuery || intervalFilter !== "all"
                  ? "Không tìm thấy loại vắc xin phù hợp"
                  : "Chưa có loại vắc xin nào trong hệ thống"}
              </h3>
              <p className="text-sm text-slate-500">
                {searchQuery || intervalFilter !== "all"
                  ? "Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để xem kết quả khác."
                  : "Bắt đầu bằng việc thêm loại vắc xin đầu tiên để quản lý hồ sơ tiêm chủng thú cưng chuẩn xác."}
              </p>
            </div>
            <div>
              {searchQuery || intervalFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIntervalFilter("all");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <RefreshCw size={15} />
                  <span>Xóa bộ lọc</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#0EA5B7] to-sky-600 rounded-xl shadow-md shadow-sky-500/20 hover:opacity-95 transition-all"
                >
                  <Plus size={16} />
                  <span>Thêm loại vaccine mới</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !errorMessage && filteredList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tên loại vaccine (Name)</th>
                  <th className="py-3.5 px-6">Mô tả (Description)</th>
                  <th className="py-3.5 px-6">Chu kỳ khuyến cáo (Recommended Interval)</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <AnimatePresence>
                  {filteredList.map((vt) => {
                    const id = vt.id ?? vt.vaccine_type_id;
                    const intervalPreview = formatIntervalPreview(vt.recommended_interval_days);
                    const species = vt.applicable_species || [];

                    return (
                      <motion.tr
                        key={String(id)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Name & Species */}
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/80 border border-sky-200 text-[#0EA5B7] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-xs">
                              <Syringe size={20} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 group-hover:text-[#0EA5B7] transition-colors">
                                  {vt.name}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400">
                                  #{id}
                                </span>
                              </div>

                              {/* Applicable species pills */}
                              {species.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {species.includes("dog") && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                                      <Dog size={11} /> Chó
                                    </span>
                                  )}
                                  {species.includes("cat") && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80">
                                      <Cat size={11} /> Mèo
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Description (Rút gọn) */}
                        <td className="py-4 px-6 max-w-xs md:max-w-md">
                          {vt.description ? (
                            <p
                              className="text-xs text-slate-600 line-clamp-2 leading-relaxed"
                              title={vt.description}
                            >
                              {vt.description}
                            </p>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Chưa có mô tả chi tiết
                            </span>
                          )}
                        </td>

                        {/* Recommended Interval */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="inline-flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                              <Clock size={13} className="text-[#0EA5B7]" />
                              {vt.recommended_interval_days} ngày
                            </span>
                            {intervalPreview && (
                              <span className="text-xs font-medium text-slate-500 pl-1">
                                {intervalPreview}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(vt)}
                              className="p-2 text-slate-500 hover:text-[#0EA5B7] hover:bg-sky-50 rounded-xl transition-all"
                              title="Chỉnh sửa loại vắc xin"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(vt)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Xóa loại vắc xin"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        {!isLoading && !errorMessage && filteredList.length > 0 && (
          <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{filteredList.length}</strong> / <strong>{vaccineTypes.length}</strong> loại vắc xin
            </span>
            <span className="text-slate-400">SmartPetCare 3D • Quản trị danh mục vắc xin</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <VaccineTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingType(null);
        }}
        onSuccess={() => fetchVaccineTypes(false)}
        vaccineTypeToEdit={editingType}
      />

      <DeleteVaccineTypeModal
        isOpen={Boolean(deletingType)}
        onClose={() => setDeletingType(null)}
        vaccineTypeToDelete={deletingType}
        onSuccess={() => fetchVaccineTypes(false)}
      />
    </div>
  );
}
