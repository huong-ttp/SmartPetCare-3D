"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
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
  Filter,
  X,
  CreditCard,
  Banknote,
  ArrowRight,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Check,
  Ban,
  Receipt,
  Plus,
} from "lucide-react";
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  AdminPaymentFilterParams,
} from "@/types/payment.type";
import { admin } from "@/services/adminService";
import { payment } from "@/services/paymentService";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

import PaymentStatusBadge from "@/components/admin/payments/PaymentStatusBadge";
import PaymentMethodBadge from "@/components/admin/payments/PaymentMethodBadge";
import ConfirmPaymentModal from "@/components/admin/payments/ConfirmPaymentModal";
import RejectPaymentModal from "@/components/admin/payments/RejectPaymentModal";
import CreateCashPaymentModal from "@/components/admin/payments/CreateCashPaymentModal";

type ActiveTab = "pending" | "success" | "failed" | "all";

export default function AdminPaymentsPage() {
  const { error: showError, success: showSuccess } = useToast();

  // Active tab (Default: "pending" as requested)
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");

  // Data & UX States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");

  // Stats State (counts across statuses)
  const [stats, setStats] = useState({
    pending: 0,
    success: 0,
    failed: 0,
    totalSuccessAmount: 0,
  });

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modals State
  const [confirmingPayment, setConfirmingPayment] = useState<Payment | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const [rejectingPayment, setRejectingPayment] = useState<Payment | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);

  // Debounce search query (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When tab changes, reset page to 1
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Fetch payments list
  const fetchPayments = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const filters: AdminPaymentFilterParams = {
          search: debouncedSearch || undefined,
          status: activeTab === "all" ? undefined : activeTab,
          method: methodFilter !== "all" ? methodFilter : undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const res = await admin.service.listPayments(filters);
        setPayments(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }

        // Also fetch general counts for stats badges (without status filter)
        try {
          const allRes = await admin.service.listPayments({ limit: 100 });
          const allItems = allRes.items || [];
          const pendingCount = allItems.filter((p) => p.status === "pending").length;
          const successCount = allItems.filter((p) => p.status === "success").length;
          const failedCount = allItems.filter((p) => p.status === "failed").length;
          const totalSuccess = allItems
            .filter((p) => p.status === "success")
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

          setStats({
            pending: pendingCount,
            success: successCount,
            failed: failedCount,
            totalSuccessAmount: totalSuccess,
          });
        } catch (e) {
          // ignore stat fetch error
        }
      } catch (err: any) {
        console.error("[AdminPayments] Failed to load payments:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách thanh toán. Vui lòng kiểm tra kết nối hệ thống."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, debouncedSearch, methodFilter, pagination.page, pagination.limit]
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefresh = () => {
    fetchPayments(false);
  };

  // Callback on successful actions
  const handleActionSuccess = () => {
    fetchPayments(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
                Xác nhận & Quản lý Thanh toán
              </h1>
              <p className="text-xs text-slate-500">
                Xác nhận giao dịch chuyển khoản/tiền mặt, từ chối giao dịch không hợp lệ và thu tiền tại quầy
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={cn(isRefreshing && "animate-spin text-[#0EA5B7]")} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {/* Record Cash Payment Button (Recommendation) */}
          <button
            onClick={() => setIsCashModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Banknote size={16} />
            <span>Ghi nhận thanh toán tiền mặt</span>
          </button>
        </div>
      </div>

      {/* ─── QUICK STATS OVERVIEW CARDS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => handleTabChange("pending")}
          className={cn(
            "bg-white p-4.5 rounded-3xl border transition-all cursor-pointer shadow-xs relative overflow-hidden group",
            activeTab === "pending"
              ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
              : "border-slate-100 hover:border-amber-200"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Chờ xác nhận
              </span>
              <div className="text-2xl font-bold font-heading text-amber-600 flex items-center gap-2">
                <span>{stats.pending}</span>
                {stats.pending > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Cần duyệt
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={22} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Giao dịch chờ Admin đối soát & duyệt</p>
        </div>

        {/* Success Card */}
        <div
          onClick={() => handleTabChange("success")}
          className={cn(
            "bg-white p-4.5 rounded-3xl border transition-all cursor-pointer shadow-xs relative overflow-hidden group",
            activeTab === "success"
              ? "border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/20"
              : "border-slate-100 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Đã xác nhận
              </span>
              <div className="text-2xl font-bold font-heading text-emerald-600">
                {stats.success}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Thanh toán hoàn tất thành công</p>
        </div>

        {/* Failed Card */}
        <div
          onClick={() => handleTabChange("failed")}
          className={cn(
            "bg-white p-4.5 rounded-3xl border transition-all cursor-pointer shadow-xs relative overflow-hidden group",
            activeTab === "failed"
              ? "border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20"
              : "border-slate-100 hover:border-rose-200"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Đã từ chối
              </span>
              <div className="text-2xl font-bold font-heading text-rose-600">
                {stats.failed}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle size={22} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Giao dịch sai thông tin hoặc bị hủy</p>
        </div>

        {/* Total Revenue Approved Card */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Doanh thu đã duyệt
              </span>
              <div className="text-xl md:text-2xl font-bold font-heading text-[#0EA5B7]">
                {formatCurrency(stats.totalSuccessAmount)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Tổng giá trị thanh toán thành công</p>
        </div>
      </div>

      {/* ─── TABS & FILTERS BAR ───────────────────────────────────────────── */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
            {/* Tab: Pending (DEFAULT) */}
            <button
              onClick={() => handleTabChange("pending")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "pending"
                  ? "bg-white text-amber-700 shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock size={14} className={cn(activeTab === "pending" ? "text-amber-500" : "text-slate-400")} />
              <span>Chờ xác nhận (Pending)</span>
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                  {stats.pending}
                </span>
              )}
            </button>

            {/* Tab: Success */}
            <button
              onClick={() => handleTabChange("success")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "success"
                  ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CheckCircle2 size={14} className={cn(activeTab === "success" ? "text-emerald-500" : "text-slate-400")} />
              <span>Thành công (Success)</span>
            </button>

            {/* Tab: Failed */}
            <button
              onClick={() => handleTabChange("failed")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "failed"
                  ? "bg-white text-rose-700 shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <XCircle size={14} className={cn(activeTab === "failed" ? "text-rose-500" : "text-slate-400")} />
              <span>Đã từ chối (Failed)</span>
            </button>

            {/* Tab: All */}
            <button
              onClick={() => handleTabChange("all")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Tất cả</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {activeTab === "pending" && (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Ưu tiên xử lý các giao dịch chờ xác nhận
              </span>
            )}
            {activeTab === "success" && "Lịch sử các giao dịch đã duyệt thành công"}
            {activeTab === "failed" && "Lịch sử các giao dịch đã bị từ chối"}
            {activeTab === "all" && "Toàn bộ giao dịch trong hệ thống"}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-8 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Khách hàng, Thú cưng, Mã hóa đơn #INV..., Mã GD..."
              className="w-full text-xs pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:border-[#0EA5B7] focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="md:col-span-4">
            <div className="relative">
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value as any);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:border-[#0EA5B7] focus:bg-white text-slate-700 font-medium transition-all cursor-pointer"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="cash">Tiền mặt tại quầy</option>
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DATA TABLE / UX STATES ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* ERROR STATE */}
        {errorMessage && (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Đã xảy ra lỗi</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={() => fetchPayments(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {!errorMessage && isLoading && (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block animate-spin text-[#0EA5B7]">
              <RefreshCw size={28} />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Đang tải danh sách thanh toán...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!errorMessage && !isLoading && payments.length === 0 && (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
              {activeTab === "pending" ? (
                <Clock size={26} className="text-amber-500" />
              ) : activeTab === "failed" ? (
                <XCircle size={26} className="text-rose-400" />
              ) : (
                <CheckCircle2 size={26} className="text-emerald-500" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {activeTab === "pending"
                ? "Không có thanh toán nào đang chờ xác nhận"
                : activeTab === "success"
                ? "Chưa có giao dịch thanh toán thành công"
                : activeTab === "failed"
                ? "Không có giao dịch thanh toán bị từ chối"
                : "Không tìm thấy giao dịch nào"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === "pending"
                ? "Tuyệt vời! Toàn bộ các yêu cầu thanh toán đã được xử lý xong."
                : debouncedSearch || methodFilter !== "all"
                ? "Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả."
                : "Các giao dịch thanh toán phát sinh sẽ hiển thị tại đây."}
            </p>
            {activeTab === "pending" && (
              <button
                onClick={() => setIsCashModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
              >
                <Banknote size={14} />
                <span>Ghi nhận thanh toán tiền mặt tại quầy</span>
              </button>
            )}
          </div>
        )}

        {/* DATA TABLE */}
        {!errorMessage && !isLoading && payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Mã thanh toán & Thời gian</th>
                  <th className="py-3.5 px-5">Hóa đơn</th>
                  <th className="py-3.5 px-5">Khách hàng & Thú cưng</th>
                  <th className="py-3.5 px-5">Số tiền</th>
                  <th className="py-3.5 px-5">Phương thức</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  {(activeTab === "failed" || activeTab === "all") && (
                    <th className="py-3.5 px-5">Lý do từ chối</th>
                  )}
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((item) => {
                  const paymentId = item.payment_id ?? item.id;
                  const invoiceId = item.invoice_id;
                  const dateStr = item.payment_date || item.created_at;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors group",
                        item.status === "pending" && "bg-amber-50/10"
                      )}
                    >
                      {/* Payment ID & Date */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            #PAY-{paymentId}
                          </span>
                          {dateStr && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <Calendar size={11} />
                              {new Date(dateStr).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Related Invoice */}
                      <td className="py-4 px-5">
                        <Link
                          href={`/admin/invoices/${invoiceId}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-[#0EA5B7]/10 text-slate-700 hover:text-[#0EA5B7] font-mono font-bold transition-colors group/inv"
                          title="Xem chi tiết hóa đơn"
                        >
                          <Receipt size={13} className="text-slate-400 group-hover/inv:text-[#0EA5B7]" />
                          <span>#INV-{invoiceId}</span>
                        </Link>
                      </td>

                      {/* Owner & Pet */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            <span>{item.owner_name || "Khách hàng"}</span>
                          </p>
                          {item.pet_name && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Dog size={12} className="text-[#0EA5B7]" />
                              <span>Bé {item.pet_name}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(item.amount)}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-4 px-5">
                        <PaymentMethodBadge
                          method={item.payment_method}
                          transactionRef={item.transaction_ref}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <PaymentStatusBadge status={item.status} />
                      </td>

                      {/* Reject Reason (if failed or all) */}
                      {(activeTab === "failed" || activeTab === "all") && (
                        <td className="py-4 px-5 max-w-[200px]">
                          {item.reject_reason ? (
                            <span className="text-[11px] text-rose-700 font-medium line-clamp-2" title={item.reject_reason}>
                              {item.reject_reason}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {item.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Action: Confirm */}
                            <button
                              onClick={() => {
                                setConfirmingPayment(item);
                                setIsConfirmModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                              title="Xác nhận giao dịch và cập nhật hóa đơn sang paid"
                            >
                              <Check size={14} />
                              <span>Xác nhận</span>
                            </button>

                            {/* Action: Reject */}
                            <button
                              onClick={() => {
                                setRejectingPayment(item);
                                setIsRejectModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/80 font-bold text-xs transition-all flex items-center gap-1"
                              title="Từ chối giao dịch kèm lý do"
                            >
                              <Ban size={14} />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] font-semibold text-slate-400">
                              Đã xử lý
                            </span>
                            <Link
                              href={`/admin/invoices/${invoiceId}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Xem hóa đơn liên quan"
                            >
                              <Eye size={14} />
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PAGINATION BAR ──────────────────────────────────────────────── */}
        {!isLoading && !errorMessage && payments.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị{" "}
              <strong className="text-slate-800 font-bold">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-800 font-bold">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              trên tổng số{" "}
              <strong className="text-slate-800 font-bold">{pagination.total}</strong> giao dịch
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(prev.page - 1, 1),
                  }))
                }
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="px-3 py-1.5 font-bold font-mono text-slate-800 bg-slate-100 rounded-xl">
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
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}
      {/* 1. Confirm Payment Modal */}
      <ConfirmPaymentModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setConfirmingPayment(null);
        }}
        paymentItem={confirmingPayment}
        onSuccess={handleActionSuccess}
      />

      {/* 2. Reject Payment Modal */}
      <RejectPaymentModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectingPayment(null);
        }}
        paymentItem={rejectingPayment}
        onSuccess={handleActionSuccess}
      />

      {/* 3. Create Cash Payment Modal */}
      <CreateCashPaymentModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
