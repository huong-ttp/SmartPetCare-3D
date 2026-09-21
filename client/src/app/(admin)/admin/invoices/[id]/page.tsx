"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dog,
  Cat,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  ExternalLink,
  Receipt,
  ShieldCheck,
  Building2,
  QrCode,
  Sparkles,
  RefreshCw,
  X,
  Stethoscope,
  Banknote,
  Ban,
  AlertTriangle,
  History,
  Info,
} from "lucide-react";
import { invoice, invoiceService } from "@/services/invoiceService";
import { admin, adminService } from "@/services/adminService";
import type { Invoice, InvoiceStatus, InvoicePaymentInfo } from "@/types/invoice.type";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import CancelInvoiceModal from "@/components/admin/invoices/CancelInvoiceModal";
import { cn } from "@/utils/cn";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  const invoiceId = params?.id as string;

  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancel Invoice Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  // Load invoice using invoice.service.getById(id, asAdmin = true) / admin.service.getInvoiceById
  const loadInvoice = useCallback(
    async (isBackground = false) => {
      if (!invoiceId) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefetching(true);
      setErrorMessage(null);

      try {
        const data = await invoice.service.getById(invoiceId, true);
        setInvoiceData(data);
      } catch (err: any) {
        console.error("[AdminInvoiceDetail] Fetch error:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không tìm thấy hóa đơn hoặc có lỗi khi tải dữ liệu từ máy chủ."
        );
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [invoiceId]
  );

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleInvoiceCancelled = (updated: Invoice) => {
    setInvoiceData((prev) => (prev ? { ...prev, status: "cancelled", cancel_reason: updated.cancel_reason } : updated));
  };

  // Status Badge Helper
  const getStatusBadge = (inv: Invoice) => {
    switch (inv.status) {
      case "unpaid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Chờ thanh toán
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Đã thanh toán
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle size={14} className="text-rose-600" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const formattedIssuedDate = useMemo(() => {
    if (!invoiceData) return "—";
    const rawDate = invoiceData.issued_date || invoiceData.issued_at || invoiceData.created_at;
    if (!rawDate) return "—";
    return new Date(rawDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [invoiceData]);

  // Payment history list
  const paymentHistory: InvoicePaymentInfo[] = useMemo(() => {
    if (!invoiceData) return [];
    if (Array.isArray(invoiceData.payments) && invoiceData.payments.length > 0) {
      return invoiceData.payments;
    }
    if (invoiceData.payment) {
      return [invoiceData.payment];
    }
    return [];
  }, [invoiceData]);

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Breadcrumbs & Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/dashboard" className="hover:text-[#0EA5B7] transition-colors">
            Tổng quan
          </Link>
          <span>/</span>
          <Link href="/admin/invoices" className="hover:text-[#0EA5B7] transition-colors">
            Quản lý hóa đơn
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">
            Chi tiết #INV-{invoiceId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadInvoice(true)}
            disabled={isRefetching || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all shadow-xs"
            title="Làm mới trạng thái"
          >
            <RefreshCw
              size={13}
              className={cn((isLoading || isRefetching) && "animate-spin text-[#0EA5B7]")}
            />
            <span>{isRefetching ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>

          <Link
            href="/admin/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>

      {/* ─── UX State: Loading Skeleton ───────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-white rounded-3xl border border-slate-200/80 p-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-36 bg-white rounded-3xl border border-slate-200/80" />
            <div className="h-36 bg-white rounded-3xl border border-slate-200/80" />
            <div className="h-36 bg-white rounded-3xl border border-slate-200/80" />
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200/80" />
          <div className="h-48 bg-white rounded-3xl border border-slate-200/80" />
        </div>
      )}

      {/* ─── UX State: Error / Not Found ──────────────────────────────── */}
      {!isLoading && errorMessage && (
        <div className="bg-red-50/90 border border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-900">Không tìm thấy hóa đơn</h3>
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => loadInvoice()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Thử lại</span>
            </button>
            <Link
              href="/admin/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              <span>Về danh sách hóa đơn</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Populated Invoice Detail Content (Prompt 15 Layout for Admin) ─ */}
      {!isLoading && !errorMessage && invoiceData && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="text-[#0EA5B7]" size={24} />
                  <span>Hóa Đơn #INV-{invoiceData.invoice_id ?? invoiceData.id}</span>
                </h1>
                {getStatusBadge(invoiceData)}
              </div>
              <p className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
                <Calendar size={14} className="text-[#0EA5B7]" />
                <span>
                  Ngày phát hành: <strong>{formattedIssuedDate}</strong>
                </span>
              </p>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Action: Cancel Invoice (nếu status = unpaid) */}
              {invoiceData.status === "unpaid" && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <Ban size={15} />
                  <span>Hủy hóa đơn</span>
                </button>
              )}

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-95"
              >
                <FileText size={15} className="text-slate-400" />
                <span>In hóa đơn</span>
              </button>
            </div>
          </div>

          {/* Conditional Banner: Cancelled Notice with Reason */}
          {invoiceData.status === "cancelled" && (
            <div className="bg-rose-50/90 border border-rose-200 rounded-3xl p-5 shadow-xs flex items-start gap-3.5 text-rose-800 text-xs animate-in fade-in">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <XCircle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-rose-950 uppercase tracking-wider text-xs">
                  Hóa đơn đã bị hủy bỏ
                </h4>
                <p className="text-rose-700 leading-relaxed">
                  Lý do ghi nhận:{" "}
                  <strong className="text-rose-950 font-medium">
                    {invoiceData.cancel_reason || "Đã hủy bởi quản trị viên phòng khám"}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* Conditional Banner: Unpaid Notice for Admin */}
          {invoiceData.status === "unpaid" && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-xs flex items-start gap-3.5 text-amber-800 text-xs animate-in fade-in">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-amber-950 uppercase tracking-wider text-xs">
                  Chờ khách hàng thanh toán / đối soát viện phí
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  Tổng số tiền cần thanh toán:{" "}
                  <strong className="text-amber-950 font-bold font-mono">
                    {formatCurrency(invoiceData.total_amount)}
                  </strong>
                  . Khách hàng có thể thanh toán tiền mặt tại quầy tiếp tân hoặc chuyển khoản qua mã QR.
                </p>
              </div>
            </div>
          )}

          {/* ─── 3 Information Cards (Owner, Pet, Appointment) ─────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Khách hàng (Chủ nuôi) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <User size={16} className="text-[#0EA5B7]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Khách Hàng (Chủ Nuôi)
                </h3>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-extrabold text-slate-900 text-sm">
                  {invoiceData.owner_name || "Khách hàng"}
                </p>
                {invoiceData.owner_phone && (
                  <p className="text-slate-600 flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{invoiceData.owner_phone}</span>
                  </p>
                )}
                {invoiceData.owner_email && (
                  <p className="text-slate-600 flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{invoiceData.owner_email}</span>
                  </p>
                )}
                {invoiceData.owner_id && (
                  <p className="text-slate-400 text-[11px] pt-1">
                    Mã User: <span className="font-mono font-medium text-slate-600">#{invoiceData.owner_id}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Card 2: Thú Cưng (Pet) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Dog size={16} className="text-[#0EA5B7]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Thú Cưng Tiếp Nhận
                  </h3>
                </div>
                {invoiceData.pet_id && (
                  <Link
                    href={`/admin/pets`}
                    className="text-[11px] font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Hồ sơ</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
                  {invoiceData.pet_species?.toLowerCase() === "cat" ? <Cat size={22} /> : <Dog size={22} />}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm truncate">
                    {invoiceData.pet_name ? `Bé ${invoiceData.pet_name}` : "Thú cưng"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Loài:{" "}
                    <strong className="text-slate-700">
                      {invoiceData.pet_species?.toLowerCase() === "cat"
                        ? "Mèo"
                        : invoiceData.pet_species?.toLowerCase() === "dog"
                        ? "Chó"
                        : invoiceData.pet_species || "Chưa rõ"}
                    </strong>
                    {invoiceData.pet_breed && ` • ${invoiceData.pet_breed}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Lịch Hẹn Liên Quan (Appointment) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#0EA5B7]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Lịch Hẹn Liên Quan
                  </h3>
                </div>
                {invoiceData.appointment_id && (
                  <Link
                    href={`/admin/appointments`}
                    className="text-[11px] font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Lịch #{invoiceData.appointment_id}</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>

              <div className="space-y-1 text-xs">
                {invoiceData.appointment_date ? (
                  <p className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {new Date(invoiceData.appointment_date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {invoiceData.start_time && ` (${invoiceData.start_time})`}
                    </span>
                  </p>
                ) : (
                  <p className="text-slate-500">Lịch khám #{invoiceData.appointment_id}</p>
                )}
                <p className="text-slate-500 text-[11px] line-clamp-2">
                  Lý do: {invoiceData.reason || "Khám sức khỏe tổng quát"}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Invoice Items Table ────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope size={18} className="text-[#0EA5B7]" />
                <span>Chi Tiết Dịch Vụ & Hạng Mục Viện Phí</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {invoiceData.items?.length || 0} hạng mục
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Dịch vụ / Hạng mục</th>
                    <th className="py-3.5 px-6 text-center">Số lượng</th>
                    <th className="py-3.5 px-6 text-right">Đơn giá</th>
                    <th className="py-3.5 px-6 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoiceData.items && invoiceData.items.length > 0 ? (
                    invoiceData.items.map((item, idx) => (
                      <tr
                        key={item.id ?? item.item_id ?? idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900 text-sm">
                            {item.service_name || item.description || "Dịch vụ thú y"}
                          </p>
                          {item.service_description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {item.service_description}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-600">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-900 text-sm">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                        Chi tiết dịch vụ theo lịch hẹn #{invoiceData.appointment_id}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50/80">
                    <td
                      colSpan={3}
                      className="py-4 px-6 text-right font-bold text-slate-700 text-xs"
                    >
                      Tổng số tiền thanh toán (Total):
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-lg md:text-xl font-extrabold text-[#0EA5B7] tracking-tight">
                        {formatCurrency(invoiceData.total_amount)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ─── Payment History (Lịch sử thanh toán - Admin Perspective) ─── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-[#0EA5B7] flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Lịch Sử Giao Dịch & Thanh Toán
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Toàn bộ các lần thử giao dịch (thành công, thất bại, đang chờ đối soát)
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {paymentHistory.length} giao dịch
              </span>
            </div>

            {paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Mã GD / Tham chiếu</th>
                      <th className="py-3 px-6">Phương thức</th>
                      <th className="py-3 px-6">Ngày giờ giao dịch</th>
                      <th className="py-3 px-6 text-right">Số tiền</th>
                      <th className="py-3 px-6 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paymentHistory.map((pay, idx) => {
                      const isSuccess = pay.status === "success";
                      const isFailed = pay.status === "failed";
                      const isPending = pay.status === "pending";

                      return (
                        <tr key={pay.payment_id || idx} className="hover:bg-slate-50/50 transition-colors">
                          {/* ID & Ref */}
                          <td className="py-4 px-6">
                            <p className="font-mono font-bold text-slate-900">
                              #{pay.payment_id || `PAY-${idx + 1}`}
                            </p>
                            {pay.transaction_ref ? (
                              <p className="font-mono text-[11px] text-slate-500">
                                Ref: {pay.transaction_ref}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400">Không có mã tham chiếu</p>
                            )}
                          </td>

                          {/* Method */}
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                              {pay.payment_method === "cash" ? (
                                <>
                                  <Banknote size={15} className="text-emerald-600" />
                                  <span>Tiền mặt tại quầy</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard size={15} className="text-cyan-600" />
                                  <span>Chuyển khoản (QR)</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-6 text-slate-600">
                            {pay.payment_date ? (
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-slate-400" />
                                <span>{new Date(pay.payment_date).toLocaleString("vi-VN")}</span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6 text-right font-extrabold text-slate-900 font-mono text-sm">
                            {formatCurrency(pay.amount)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 text-center">
                            {isSuccess && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Thành công</span>
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle size={13} className="text-rose-600" />
                                <span>Thất bại</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={13} className="text-amber-500 animate-pulse" />
                                <span>Chờ đối soát</span>
                              </span>
                            )}
                            {!isSuccess && !isFailed && !isPending && (
                              <span className="text-slate-500 font-medium">
                                {pay.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CreditCard size={18} />
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Chưa có giao dịch thanh toán nào được ghi nhận cho hóa đơn này.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Cancel Invoice Modal ─────────────────────────────────────── */}
      <CancelInvoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        invoice={invoiceData}
        onSuccess={handleInvoiceCancelled}
      />
    </div>
  );
}
