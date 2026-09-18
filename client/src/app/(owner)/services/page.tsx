"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Stethoscope,
  Syringe,
  Scissors,
  Sparkles,
  Layers,
  ArrowUpDown,
  Calendar,
  X,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { serviceService } from "@/services/serviceService";
import type { Service, ServiceCategory } from "@/types/service.type";
import { ServiceCard, CATEGORY_META } from "@/components/services/ServiceCard";
import { cn } from "@/utils/cn";

// Danh sách category chuẩn để render tabs
const CATEGORIES: { key: ServiceCategory | "all"; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Tất cả", icon: <Layers size={16} /> },
  { key: "Examination", label: "Khám bệnh", icon: <Stethoscope size={16} /> },
  { key: "Vaccination", label: "Tiêm chủng", icon: <Syringe size={16} /> },
  { key: "Surgery", label: "Phẫu thuật", icon: <Scissors size={16} /> },
  { key: "Grooming", label: "Spa & Làm đẹp", icon: <Sparkles size={16} /> },
  { key: "Other", label: "Dịch vụ khác", icon: <Layers size={16} /> },
];

type SortOption = "default" | "price_asc" | "price_desc" | "duration_asc" | "name_asc";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Sorting state
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  // Fetch active services
  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // API call: serviceService.list({ is_active: true })
      const data = await serviceService.list({ is_active: true });
      // Đảm bảo chỉ lấy dịch vụ active
      const activeOnly = data.filter((s) => s.is_active);
      setServices(activeOnly);
    } catch (err: any) {
      console.error("[ServicesPage] Error loading services:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh mục dịch vụ. Vui lòng kiểm tra lại kết nối."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Thống kê số lượng theo từng category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    for (const cat of Object.keys(CATEGORY_META)) {
      counts[cat] = 0;
    }
    for (const s of services) {
      const cat = s.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [services]);

  // Lọc & sắp xếp
  const filteredServices = useMemo(() => {
    let result = services.filter((item) => {
      // Filter by category
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = (item.description || "").toLowerCase().includes(query);
        const matchCat = (item.category || "").toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "duration_asc") {
      result.sort((a, b) => (a.duration_minutes || 0) - (b.duration_minutes || 0));
    } else if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return result;
  }, [services, activeCategory, searchQuery, sortBy]);

  // Nhóm dịch vụ theo category (dành cho chế độ xem "Tất cả" khi không tìm kiếm)
  const groupedServices = useMemo(() => {
    if (activeCategory !== "all" || searchQuery.trim()) return null;

    const groups: { category: ServiceCategory; items: Service[] }[] = [];
    const order: ServiceCategory[] = ["Examination", "Vaccination", "Surgery", "Grooming", "Other"];

    for (const cat of order) {
      const items = filteredServices.filter((s) => s.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [filteredServices, activeCategory, searchQuery]);

  // Reset filters
  const handleResetFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setSortBy("default");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Hero / Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-900 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0EA5B7]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-teal-300">
            <CheckCircle2 size={13} className="text-[#0EA5B7]" />
            Dịch vụ thú y tiêu chuẩn 5 sao
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight">
            Danh mục Dịch vụ Phòng khám
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Khám phá trọn gói các giải pháp chăm sóc sức khỏe, tiêm phòng miễn dịch, phẫu thuật chuyên sâu
            và spa làm đẹp chuẩn mực dành riêng cho thú cưng của bạn.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3 text-center">
            <span className="block text-2xl font-black text-white">{services.length}</span>
            <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Dịch vụ Active</span>
          </div>
          <button
            onClick={fetchServices}
            disabled={isLoading}
            title="Làm mới danh sách"
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(isLoading && "animate-spin text-[#0EA5B7]")} />
          </button>
        </div>
      </div>

      {/* ─── Controls Bar: Search + Category Tabs + Sort ─────────────── */}
      <div className="space-y-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        {/* Row 1: Search input & Sort dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dịch vụ theo tên hoặc từ khóa..."
              className="w-full pl-10 pr-10 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30 focus:border-[#0EA5B7] transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sắp xếp dịch vụ"
                className="appearance-none pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs md:text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30 cursor-pointer"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="duration_asc">Thời gian nhanh nhất</option>
                <option value="name_asc">Tên: A → Z</option>
              </select>
              <ArrowUpDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Mobile Category Dropdown (hiển thị khi màn hình nhỏ) */}
            <div className="block lg:hidden">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value as any)}
                aria-label="Chọn danh mục"
                className="appearance-none px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({categoryCounts[c.key] ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Category Tabs (Desktop / Tablet) */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {CATEGORIES.map((tab) => {
            const isSelected = activeCategory === tab.key;
            const count = categoryCounts[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0",
                  isSelected
                    ? "bg-[#0EA5B7] text-white shadow-md shadow-[#0EA5B7]/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── State: Loading Skeleton ─────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                  <div className="h-5 w-16 bg-slate-100 rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3.5 w-full bg-slate-100 rounded" />
                  <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
                </div>
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                    <div className="h-5 w-24 bg-slate-200 rounded" />
                  </div>
                  <div className="h-10 w-full bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── State: Error Fallback ───────────────────────────────────── */}
      {!isLoading && errorMsg && (
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-red-900">Không thể tải danh mục dịch vụ</h3>
          <p className="text-xs text-red-600 max-w-md mx-auto">{errorMsg}</p>
          <button
            onClick={fetchServices}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <RefreshCw size={14} />
            <span>Thử lại ngay</span>
          </button>
        </div>
      )}

      {/* ─── State: Empty Clinic (No active services at all) ─────────── */}
      {!isLoading && !errorMsg && services.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Stethoscope size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có dịch vụ nào đang hoạt động</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hiện tại phòng khám đang cập nhật biểu phí và danh mục dịch vụ mới. Quý khách vui lòng liên hệ hotline hoặc quay lại sau ít phút.
          </p>
          <button
            onClick={fetchServices}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#0EA5B7] transition-all"
          >
            <RefreshCw size={14} />
            <span>Tải lại trang</span>
          </button>
        </div>
      )}

      {/* ─── State: Empty Filter/Search Result ───────────────────────── */}
      {!isLoading && !errorMsg && services.length > 0 && filteredServices.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center mx-auto">
            <Search size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy dịch vụ phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `Không có dịch vụ nào khớp với từ khóa "${searchQuery}". Vui lòng thử tìm với từ khóa khác.`
              : "Không có dịch vụ nào thuộc danh mục đã chọn."}
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5B7] text-white text-xs font-semibold hover:bg-[#0b8fa0] transition-all shadow-md shadow-[#0EA5B7]/20"
          >
            <X size={14} />
            <span>Xóa bộ lọc & Xem tất cả</span>
          </button>
        </div>
      )}

      {/* ─── Main Content: Services Display ─────────────────────────── */}
      {!isLoading && !errorMsg && filteredServices.length > 0 && (
        <>
          {/* Mode A: Grouped by Category (Hiển thị khi ở tab "Tất cả" & không tìm kiếm) */}
          {groupedServices ? (
            <div className="space-y-10">
              {groupedServices.map((group) => {
                const meta = CATEGORY_META[group.category] || CATEGORY_META.Other;
                return (
                  <section key={group.category} className="space-y-4">
                    {/* Category Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("p-2 rounded-xl border", meta.badgeClass)}>
                          {meta.icon}
                        </span>
                        <div>
                          <h2 className="text-lg font-heading font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{meta.label}</span>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {group.items.length}
                            </span>
                          </h2>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveCategory(group.category)}
                        className="text-xs font-semibold text-[#0EA5B7] hover:underline"
                      >
                        Xem riêng danh mục →
                      </button>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {group.items.map((srv) => (
                        <ServiceCard key={srv.id} service={srv} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            /* Mode B: Flat Grid (Khi đã chọn 1 category cụ thể hoặc đang gõ tìm kiếm) */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Hiển thị <strong>{filteredServices.length}</strong> dịch vụ
                  {activeCategory !== "all" && ` trong mục "${CATEGORY_META[activeCategory]?.label}"`}
                  {searchQuery && ` cho từ khóa "${searchQuery}"`}
                </span>
                {(activeCategory !== "all" || searchQuery || sortBy !== "default") && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[#0EA5B7] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <X size={12} />
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredServices.map((srv) => (
                  <ServiceCard key={srv.id} service={srv} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Bottom Booking Tip Banner ───────────────────────────────── */}
      {!isLoading && !errorMsg && services.length > 0 && (
        <div className="bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5B7] text-white flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-slate-900">
                Bạn chưa biết nên chọn dịch vụ nào cho bé?
              </h4>
              <p className="text-[11px] md:text-xs text-slate-600">
                Hãy đặt lịch "Khám sức khỏe tổng quát" để các bác sĩ chuyên khoa kiểm tra và tư vấn phác đồ phù hợp nhất.
              </p>
            </div>
          </div>
          <Link
            href="/appointments/create?service_id=1"
            className="shrink-0 px-4 py-2 rounded-xl bg-[#0EA5B7] text-white text-xs font-semibold hover:bg-[#0b8fa0] transition-colors shadow-xs"
          >
            Đặt lịch khám tổng quát
          </Link>
        </div>
      )}
    </div>
  );
}
