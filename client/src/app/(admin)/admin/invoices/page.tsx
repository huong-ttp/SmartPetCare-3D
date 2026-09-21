"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  User,
  Dog,
  Cat,
  Filter,
  X,
  CreditCard,
  Ban,
  ArrowRight,
  TrendingUp,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Invoice, InvoiceStatus, AdminInvoiceFilterParams } from "@/types/invoice.type";
import { admin, adminService } from "@/services/adminService";
import { invoice, invoiceService } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import CancelInvoiceModal from "@/components/admin/invoices/CancelInvoiceModal";
import { cn } from "@/utils/cn";

export default function AdminInvoicesPage() {
  const { error: showError } = useToast();

  // Data & UX States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal State for Cancel Invoice
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  // Debounce search query (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Invoices via admin.service.listInvoices(filters)
  const fetchInvoices = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const filters: AdminInvoiceFilterParams = {
          search: debouncedSearch || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const res = await admin.service.listInvoices(filters);
        setInvoices(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err: any) {
        console.error("[AdminInvoices] Failed to load invoices:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách hóa đơn. Vui lòng kiểm tra kết nối hệ thống."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter, fromDate, toDate, pagination.page, pagination.limit]
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleRefresh = () => {
    fetchInvoices(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  // Callback when an invoice is cancelled
  const handleInvoiceCancelled = (updatedInvoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        String(inv.invoice_id ?? inv.id) === String(updatedInvoice.invoice_id ?? updatedInvoice.id)
          ? { ...inv, status: "cancelled", cancel_reason: updatedInvoice.cancel_reason }
          : inv
      )
    );
  };

  // Quick statistics calculated from current or total
  const stats = useMemo(() => {
    const totalCount = pagination.total || invoices.length;
    const paidList = invoices.filter((i) => i.status === "paid");
    const unpaidList = invoices.filter((i) => i.status === "unpaid");
    const cancelledList = invoices.filter((i) => i.status === "cancelled");
    const totalRevenue = paidList.reduce((acc, cur) => acc + (cur.total_amount || 0), 0);

    return {
      total: totalCount,
      paid: paidList.length,
      unpaid: unpaidList.length,
      cancelled: cancelledList.length,
      revenue: totalRevenue,
    };
  }, [invoices, pagination.total]);

  // Status Badge Component
  const renderStatusBadge = (status: InvoiceStatus, reason?: string | null) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Đã thanh toán
          </span>
        );
      case "unpaid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Chờ thanh toán
          </span>
        );
      case "cancelled":
        return (
          <span
            title={reason ? `Lý do: ${reason}` : "Đã hủy"}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs cursor-help"
          >
            <XCircle size={13} className="text-rose-600" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Header & Business Rule Notice ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-[#0EA5B7] flex items-center justify-center shadow-xs">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                Quản Lý Hóa Đơn Viện Phí
              </h1>
              <p className="text-xs text-slate-500">
                Theo dõi và đối soát toàn bộ hóa đơn viện phí tự động sinh từ lịch hẹn khám
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              size={14}
              className={cn((isRefreshing || isLoading) && "animate-spin text-[#0EA5B7]")}
            />
            <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* ─── Business Rule Banner (Admin không tự tạo thủ công) ─────────── */}
      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-start gap-3 text-sky-900 text-xs">
        <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#0EA5B7] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-sky-950">Quy chuẩn sinh hóa đơn tự động</p>
          <p className="text-sky-800 leading-relaxed text-[11px]">
            Hóa đơn viện phí được hệ thống <strong>tự động khởi tạo ngay khi bác sĩ hoàn thành lịch hẹn khám</strong> (Appointment &rarr; Completed). Admin không tạo hóa đơn thủ công tại đây để đảm bảo tính toàn vẹn dữ liệu điều trị và hồ sơ bệnh án.
          </p>
        </div>
      </div>

      {/* ─── Stats Overview Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Hóa Đơn</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{stats.total}</div>
          <p className="text-[11px] text-slate-400">Toàn bộ hồ sơ viện phí</p>
        </div>

        {/* Unpaid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ Thanh Toán</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-700">{stats.unpaid}</div>
          <p className="text-[11px] text-slate-400">Cần đối soát tại quầy/CK</p>
        </div>

        {/* Paid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Thanh Toán</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">{stats.paid}</div>
          <p className="text-[11px] text-slate-400">Đã quyết toán thành công</p>
        </div>

        {/* Cancelled */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Đã Hủy</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-700">{stats.cancelled}</div>
          <p className="text-[11px] text-slate-400">Trường hợp hủy đặc biệt</p>
        </div>
      </div>

      {/* ─── Filters & Search Toolbar ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 md:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chủ nuôi, tên thú cưng, mã hóa đơn..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as InvoiceStatus | "all");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all bg-white font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unpaid">Chờ thanh toán (Unpaid)</option>
              <option value="paid">Đã thanh toán (Paid)</option>
              <option value="cancelled">Đã hủy (Cancelled)</option>
            </select>
          </div>

          {/* Date From */}
          <div className="lg:col-span-2 relative">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all bg-white"
              title="Từ ngày"
            />
          </div>

          {/* Date To */}
          <div className="lg:col-span-2 relative">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all bg-white"
              title="Đến ngày"
            />
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1 flex items-center justify-end">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5"
                title="Xóa bộ lọc"
              >
                <X size={13} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── UX State: Error ──────────────────────────────────────────── */}
      {errorMessage && !isLoading && (
        <div className="bg-red-50/90 border border-red-200 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-900">Không thể tải danh sách hóa đơn</h3>
            <p className="text-xs text-red-600 max-w-md mx-auto">{errorMessage}</p>
          </div>
          <button
            onClick={() => fetchInvoices(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-md"
          >
            <RefreshCw size={13} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* ─── Main Invoices Table Card ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Mã HĐ</th>
                <th className="py-3.5 px-5">Chủ nuôi (Khách hàng)</th>
                <th className="py-3.5 px-5">Thú cưng & Lịch hẹn</th>
                <th className="py-3.5 px-5">Ngày phát hành</th>
                <th className="py-3.5 px-5 text-right">Tổng tiền</th>
                <th className="py-3.5 px-5 text-center">Trạng thái</th>
                <th className="py-3.5 px-5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* UX State: Loading Skeletons */}
              {isLoading &&
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 w-16 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 w-28 bg-slate-200 rounded-md mb-1" />
                      <div className="h-3 w-20 bg-slate-100 rounded-md" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 w-24 bg-slate-200 rounded-md mb-1" />
                      <div className="h-3 w-16 bg-slate-100 rounded-md" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 w-24 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-4 w-20 bg-slate-200 rounded-md ml-auto" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="h-6 w-24 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 w-16 bg-slate-200 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))}

              {/* UX State: Empty State */}
              {!isLoading && invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Receipt size={28} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {hasActiveFilters ? "Không có kết quả phù hợp" : "Chưa có hóa đơn nào"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {hasActiveFilters
                            ? "Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
                            : "Hóa đơn sẽ tự động xuất hiện khi các lịch hẹn khám hoàn thành."}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                        >
                          <X size={13} />
                          <span>Xóa bộ lọc</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Populated Rows */}
              {!isLoading &&
                invoices.map((inv) => {
                  const invoiceId = inv.invoice_id ?? inv.id;
                  const formattedDate = inv.issued_date || inv.issued_at || inv.created_at;

                  return (
                    <tr
                      key={invoiceId}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Invoice ID */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
                          <Receipt size={14} className="text-[#0EA5B7]" />
                          <span>#INV-{invoiceId}</span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            <span>{inv.owner_name || "Khách hàng"}</span>
                          </p>
                          {inv.owner_phone && (
                            <p className="text-[11px] text-slate-500 font-mono">
                              {inv.owner_phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Pet & Appointment */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            {inv.pet_species === "cat" ? (
                              <Cat size={13} className="text-amber-500" />
                            ) : (
                              <Dog size={13} className="text-[#0EA5B7]" />
                            )}
                            <span>{inv.pet_name ? `Bé ${inv.pet_name}` : "Thú cưng"}</span>
                          </p>
                          {inv.appointment_id && (
                            <p className="text-[11px] text-slate-400">
                              Lịch hẹn: <strong className="text-slate-600 font-mono">#{inv.appointment_id}</strong>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Issued Date */}
                      <td className="py-4 px-5 text-slate-600">
                        {formattedDate ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{new Date(formattedDate).toLocaleDateString("vi-VN")}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-5 text-right">
                        <span className="font-extrabold text-slate-900 text-sm font-mono tracking-tight">
                          {formatCurrency(inv.total_amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        {renderStatusBadge(inv.status, inv.cancel_reason)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Detail Button */}
                          <Link
                            href={`/admin/invoices/${invoiceId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:border-[#0EA5B7]/40 hover:text-[#0EA5B7]"
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </Link>

                          {/* Action: Cancel Invoice (Chỉ cho hóa đơn unpaid) */}
                          {inv.status === "unpaid" && (
                            <button
                              onClick={() => {
                                setCancellingInvoice(inv);
                                setIsCancelModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 text-xs font-semibold transition-all shadow-2xs"
                              title="Hủy hóa đơn trường hợp đặc biệt"
                            >
                              <Ban size={13} />
                              <span>Hủy</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ──────────────────────────────────────── */}
        {!isLoading && invoices.length > 0 && (
          <div className="p-4 md:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị{" "}
              <strong className="text-slate-800">
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
              </strong>{" "}
              đến{" "}
              <strong className="text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              trên tổng số <strong className="text-slate-800">{pagination.total}</strong> hóa đơn
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                title="Trang trước"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded-xl">
                {pagination.page} / {pagination.totalPages || 1}
              </div>

              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.page + 1, pagination.totalPages),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                title="Trang sau"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Cancel Invoice Modal ─────────────────────────────────────── */}
      <CancelInvoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancellingInvoice(null);
        }}
        invoice={cancellingInvoice}
        onSuccess={handleInvoiceCancelled}
      />
    </div>
  );
}
