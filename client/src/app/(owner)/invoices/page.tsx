"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Dog,
  Cat,
  ChevronRight,
  Filter,
  ExternalLink,
  Search,
  Receipt,
  ArrowRight,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { invoiceService } from "@/services/invoiceService";
import type { Invoice, InvoiceStatus } from "@/types/invoice.type";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function OwnerInvoicesPage() {
  const { error: showError } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status Filter: "all" | "unpaid" | "paid" | "cancelled" (STRICTLY NO partially_paid)
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Calls invoiceService.list({ status, owner: me })
      const data = await invoiceService.list({
        status: filterStatus !== "all" ? filterStatus : undefined,
      });
      setInvoices(data);
    } catch (err: any) {
      console.error("[InvoicesPage] Load error:", err);
      setErrorMessage("Không thể tải danh sách hóa đơn. Vui lòng kiểm tra lại kết nối.");
      showError("Không thể tải danh sách hóa đơn.");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, showError]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Client-side search filtering by pet name, invoice id, or service name
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter((inv) => {
      const invIdStr = String(inv.invoice_id ?? inv.id).toLowerCase();
      const petName = (inv.pet_name || "").toLowerCase();
      const serviceName = (inv.service_name || "").toLowerCase();
      return (
        invIdStr.includes(q) ||
        petName.includes(q) ||
        serviceName.includes(q) ||
        `#inv-${invIdStr}`.includes(q)
      );
    });
  }, [invoices, searchQuery]);

  // Status Badge Helper
  const getStatusBadge = (inv: Invoice) => {
    if (inv.status === "unpaid" && inv.payment?.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Payment: Pending
        </span>
      );
    }

    switch (inv.status) {
      case "unpaid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chưa thanh toán
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Đã thanh toán
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <XCircle size={13} className="text-rose-600" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  // Status tabs definition (KHÔNG có partially paid)
  const statusTabs: { key: InvoiceStatus | "all"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "unpaid", label: "Chưa thanh toán" },
    { key: "paid", label: "Đã thanh toán" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="text-[#0EA5B7]" size={28} />
            <span>Hóa Đơn Viện Phí</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Theo dõi chi phí khám, tiêm chủng và các dịch vụ chăm sóc thú cưng của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadInvoices}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95 shadow-xs"
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin text-[#0EA5B7]")} />
          </button>
        </div>
      </div>

      {/* ─── Filter Bar & Search ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none">
            {statusTabs.map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-white text-[#0EA5B7] shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã HĐ, tên bé..."
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0EA5B7] focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── UX State: Loading ────────────────────────────────────────── */}
      {isLoading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between px-4"
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── UX State: Error ─────────────────────────────────────────── */}
      {!isLoading && errorMessage && (
        <div className="bg-red-50/90 border border-red-200 rounded-3xl p-8 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-sm font-bold text-red-900">Không thể tải danh sách hóa đơn</h3>
          <p className="text-xs text-red-600">{errorMessage}</p>
          <button
            onClick={loadInvoices}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-md active:scale-95 mx-auto mt-2"
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* ─── UX State: Empty ─────────────────────────────────────────── */}
      {!isLoading && !errorMessage && filteredInvoices.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt size={32} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {filterStatus !== "all" || searchQuery
                ? "Không tìm thấy hóa đơn phù hợp"
                : "Chưa có hóa đơn nào"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {filterStatus !== "all" || searchQuery
                ? "Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm để xem các hóa đơn khác."
                : "Hóa đơn viện phí sẽ tự động được tạo khi lịch khám hoặc dịch vụ chăm sóc hoàn tất."}
            </p>
          </div>
          {(filterStatus !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all"
            >
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      )}

      {/* ─── UX State: Populated Table / Cards ───────────────────────── */}
      {!isLoading && !errorMessage && filteredInvoices.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Mã hóa đơn</th>
                  <th className="py-3.5 px-5">Thú cưng / Lịch hẹn</th>
                  <th className="py-3.5 px-5">Ngày phát hành</th>
                  <th className="py-3.5 px-5">Tổng số tiền</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInvoices.map((inv) => {
                  const id = inv.invoice_id ?? inv.id;
                  const formattedDate = inv.issued_date || inv.issued_at
                    ? new Date(inv.issued_date || inv.issued_at!).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/invoices/${id}`)}
                    >
                      {/* Invoice ID */}
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-900 group-hover:text-[#0EA5B7] transition-colors">
                          #INV-{id}
                        </span>
                      </td>

                      {/* Pet / Appointment */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
                            {inv.pet_species === "cat" ? <Cat size={16} /> : <Dog size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {inv.pet_name ? `Bé ${inv.pet_name}` : "Thú cưng"}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span>Lịch hẹn #{inv.appointment_id}</span>
                              {inv.appointment_date && (
                                <span>
                                  • {new Date(inv.appointment_date).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Issued Date */}
                      <td className="py-4 px-5 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(inv.total_amount)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        {getStatusBadge(inv)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === "unpaid" && inv.payment?.status !== "pending" && (
                            <Link
                              href={`/invoices/${id}`}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                            >
                              Thanh toán
                            </Link>
                          )}
                          {inv.status === "unpaid" && inv.payment?.status === "pending" && (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                              Chờ đối soát
                            </span>
                          )}
                          <Link
                            href={`/invoices/${id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredInvoices.map((inv) => {
              const id = inv.invoice_id ?? inv.id;
              const formattedDate = inv.issued_date || inv.issued_at
                ? new Date(inv.issued_date || inv.issued_at!).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "—";

              return (
                <div
                  key={id}
                  className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      #INV-{id}
                    </span>
                    {getStatusBadge(inv)}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
                      {inv.pet_species === "cat" ? <Cat size={18} /> : <Dog size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {inv.pet_name ? `Bé ${inv.pet_name}` : "Thú cưng"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Lịch hẹn #{inv.appointment_id} • Ngày phát hành: {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                        Tổng thanh toán
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(inv.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.status === "unpaid" && inv.payment?.status !== "pending" && (
                        <Link
                          href={`/invoices/${id}`}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                        >
                          Thanh toán
                        </Link>
                      )}
                      {inv.status === "unpaid" && inv.payment?.status === "pending" && (
                        <span className="px-2 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                          Chờ đối soát
                        </span>
                      )}
                      <Link
                        href={`/invoices/${id}`}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>Xem</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
