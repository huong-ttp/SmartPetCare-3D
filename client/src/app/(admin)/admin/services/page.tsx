"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  SlidersHorizontal,
  Power,
} from "lucide-react";
import { Service, ServiceFilterParams, ServicePagination } from "@/types/service.type";
import { service as serviceApi } from "@/services/serviceService";
import { useToast } from "@/components/ui/Toast";
import ServiceCategoryBadge from "@/components/admin/services/ServiceCategoryBadge";
import ServiceStatusBadge from "@/components/admin/services/ServiceStatusBadge";
import ServiceModal from "@/components/admin/services/ServiceModal";
import DeleteServiceModal from "@/components/admin/services/DeleteServiceModal";
import { cn } from "@/utils/cn";

const CATEGORY_TABS = [
  { value: "all", label: "Tất cả danh mục" },
  { value: "examination", label: "Khám bệnh" },
  { value: "vaccination", label: "Tiêm chủng" },
  { value: "surgery", label: "Phẫu thuật" },
  { value: "grooming", label: "Spa & Grooming" },
  { value: "other", label: "Khác" },
];

export default function AdminServicesPage() {
  const toast = useToast();

  // Data & Pagination State
  const [services, setServices] = useState<Service[]>([]);
  const [pagination, setPagination] = useState<ServicePagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch services from API: service.service.list(filters)
  const fetchServices = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage("");

      try {
        const filters: ServiceFilterParams = {
          search: debouncedSearch || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const result = await serviceApi.service.list(filters);
        if (result && Array.isArray(result.items)) {
          setServices(result.items);
          if (result.pagination) {
            setPagination(result.pagination);
          }
        } else if (Array.isArray(result)) {
          // Fallback array handling
          setServices(result);
          setPagination((prev) => ({
            ...prev,
            total: result.length,
            totalPages: Math.ceil(result.length / prev.limit) || 1,
          }));
        }
      } catch (err: any) {
        console.error("Failed to fetch services:", err);
        setErrorMessage(
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách dịch vụ. Vui lòng kiểm tra kết nối hệ thống."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, categoryFilter, statusFilter, pagination.page, pagination.limit]
  );

  // Re-fetch when filters change
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Manual refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchServices(false);
  };

  // Toggle Active/Inactive status with fast toast
  const handleToggleActive = async (targetService: Service) => {
    if (togglingId) return;
    setTogglingId(targetService.id);

    // Optimistic UI state
    const previousState = targetService.is_active;
    const nextState = !previousState;

    setServices((prev) =>
      prev.map((s) => (s.id === targetService.id ? { ...s, is_active: nextState } : s))
    );

    try {
      await serviceApi.service.toggleActive(targetService.id);
      if (nextState) {
        toast.success(`Đã kích hoạt dịch vụ "${targetService.name}".`);
      } else {
        toast.info(`Đã tạm dừng dịch vụ "${targetService.name}".`);
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setServices((prev) =>
        prev.map((s) => (s.id === targetService.id ? { ...s, is_active: previousState } : s))
      );
      toast.error(err?.response?.data?.message || "Không thể cập nhật trạng thái dịch vụ.");
    } finally {
      setTogglingId(null);
    }
  };

  // Handle modal submit success
  const handleServiceSaved = (savedService: Service, isEdit: boolean) => {
    if (isEdit) {
      setServices((prev) =>
        prev.map((s) => (s.id === savedService.id ? savedService : s))
      );
    } else {
      // Re-fetch to respect current sorting and pagination
      fetchServices(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = pagination.total || services.length;
    const activeCount = services.filter((s) => s.is_active).length;
    const inactiveCount = services.filter((s) => !s.is_active).length;
    return {
      total,
      active: activeCount,
      inactive: inactiveCount,
    };
  }, [pagination.total, services]);

  const formatVND = (price?: number) => {
    if (price === undefined || price === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white shadow-sm">
              <Sparkles size={20} />
            </span>
            Quản lý Dịch vụ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý bảng giá, danh mục, thời lượng và trạng thái hoạt động của các dịch vụ phòng khám
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw size={18} className={cn(isRefreshing && "animate-spin text-[#0EA5B7]")} />
          </button>

          <button
            onClick={() => {
              setEditingService(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus size={18} />
            <span>+ Thêm dịch vụ</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số dịch vụ
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đang hoạt động
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tạm dừng
            </p>
            <p className="text-2xl font-bold text-slate-600 mt-0.5">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên dịch vụ..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-52">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all cursor-pointer"
            >
              {CATEGORY_TABS.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchServices(true)}
            className="px-3 py-1.5 bg-white border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-100/50 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Tên Dịch vụ</th>
                <th className="px-5 py-3.5">Danh mục</th>
                <th className="px-5 py-3.5">Giá dịch vụ</th>
                <th className="px-5 py-3.5">Thời lượng</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 rounded w-44 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-64" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 bg-slate-200 rounded-full w-20" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                        <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : services.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0EA5B7] mb-4">
                        <Sparkles size={32} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800">
                        Chưa có dịch vụ nào
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Chưa có dịch vụ nào — hãy thêm dịch vụ đầu tiên để cung cấp danh mục khám chữa và chăm sóc cho thú cưng.
                      </p>
                      <button
                        onClick={() => {
                          setEditingService(null);
                          setIsCreateModalOpen(true);
                        }}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white gradient-primary rounded-xl shadow-sm hover:opacity-95 transition-opacity"
                      >
                        <Plus size={16} />
                        <span>Thêm dịch vụ ngay</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Service rows
                services.map((svc) => {
                  const isToggling = togglingId === svc.id;
                  return (
                    <tr
                      key={svc.id}
                      className={cn(
                        "hover:bg-slate-50/60 transition-colors",
                        !svc.is_active && "bg-slate-50/20 text-slate-500"
                      )}
                    >
                      {/* Name & Description */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 group-hover:text-[#0EA5B7] transition-colors">
                          {svc.name}
                        </div>
                        {svc.description ? (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                            {svc.description}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Chưa có mô tả
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ServiceCategoryBadge category={svc.category} />
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {formatVND(svc.price)}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Clock size={14} className="text-slate-400" />
                          <span>{svc.duration_minutes || 30} phút</span>
                        </div>
                      </td>

                      {/* Status + Fast Toggle Switch */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <ServiceStatusBadge isActive={svc.is_active} />

                          {/* Quick Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={svc.is_active}
                            disabled={isToggling}
                            onClick={() => handleToggleActive(svc)}
                            title={
                              svc.is_active
                                ? "Click để tạm dừng dịch vụ"
                                : "Click để kích hoạt dịch vụ"
                            }
                            className={cn(
                              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 disabled:opacity-50",
                              svc.is_active ? "bg-emerald-500" : "bg-slate-300"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                svc.is_active ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingService(svc);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeletingService(svc)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị{" "}
            <span className="font-semibold text-slate-700">
              {services.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-semibold text-slate-700">{pagination.total}</span> dịch vụ
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-medium text-slate-700">
              Trang {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Trang sau"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.totalPages }))
              }
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Create / Edit Service */}
      <ServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingService(null);
        }}
        serviceToEdit={editingService}
        onSuccess={handleServiceSaved}
      />

      {/* Modal Confirm Delete */}
      <DeleteServiceModal
        isOpen={Boolean(deletingService)}
        onClose={() => setDeletingService(null)}
        serviceToDelete={deletingService}
        onSuccess={() => {
          fetchServices(false);
        }}
        onToggleActiveInstead={(svc) => {
          handleToggleActive(svc);
        }}
      />
    </div>
  );
}
