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
  Send,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { invoiceService } from "@/services/invoiceService";
import { paymentService } from "@/services/paymentService";
import type { Invoice, InvoiceStatus } from "@/types/invoice.type";
import type { PaymentMethod } from "@/types/payment.type";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Counter Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Fetch Invoice Details
  const loadInvoice = useCallback(
    async (isBackground = false) => {
      if (!invoiceId) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefetching(true);
      setErrorMessage(null);
      try {
        const data = await invoiceService.getById(invoiceId);
        setInvoice(data);
      } catch (err: any) {
        console.error("[InvoiceDetail] Fetch error:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Không tìm thấy hóa đơn hoặc bạn không có quyền truy cập."
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

  // Open Payment Counter Modal
  const openPaymentModal = () => {
    setSelectedMethod("cash");
    setTransactionRef("");
    setInputError(null);
    setIsPaymentModalOpen(true);
  };

  // Handle Payment Submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setInputError(null);

    // Validation: Bank transfer requires transaction_ref
    if (selectedMethod === "bank_transfer") {
      if (!transactionRef.trim()) {
        setInputError("Vui lòng nhập mã tham chiếu giao dịch (Transaction Ref) để đối soát.");
        return;
      }
    }

    setIsSubmittingPayment(true);
    try {
      // Calls payment.service.create({ invoice_id, amount, payment_method, transaction_ref })
      await paymentService.create({
        invoice_id: Number(invoice.invoice_id ?? invoice.id),
        amount: Number(invoice.total_amount),
        payment_method: selectedMethod,
        transaction_ref: selectedMethod === "bank_transfer" ? transactionRef.trim() : undefined,
      });

      showSuccess("Đang chờ phòng khám xác nhận thanh toán.");
      setIsPaymentModalOpen(false);
      setTransactionRef("");

      // Refetch invoice to reflect pending payment state
      await loadInvoice(true);
    } catch (err: any) {
      console.error("[InvoiceDetail] Payment submit error:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.";
      setInputError(apiMsg);
      showError(apiMsg);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (inv: Invoice) => {
    // If invoice is unpaid but has a pending payment
    if (inv.status === "unpaid" && inv.payment?.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Payment: Pending
        </span>
      );
    }

    switch (inv.status) {
      case "unpaid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Chưa thanh toán
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Đã thanh toán
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <XCircle size={14} className="text-rose-600" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const formattedIssuedDate = useMemo(() => {
    if (!invoice) return "—";
    const rawDate = invoice.issued_date || invoice.issued_at || invoice.created_at;
    if (!rawDate) return "—";
    return new Date(rawDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [invoice]);

  const isPendingPayment =
    invoice?.status === "unpaid" && invoice?.payment?.status === "pending";

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Breadcrumbs & Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-[#0EA5B7] transition-colors">
            Tổng quan
          </Link>
          <span>/</span>
          <Link href="/invoices" className="hover:text-[#0EA5B7] transition-colors">
            Hóa đơn
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
            <span>{isRefetching ? "Đang kiểm tra..." : "Làm mới"}</span>
          </button>

          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>

      {/* ─── UX State: Loading ────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-white rounded-3xl border border-slate-200/80 p-6 flex justify-between items-center" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-36 bg-white rounded-3xl border border-slate-200/80" />
            <div className="h-36 bg-white rounded-3xl border border-slate-200/80" />
            <div className="h-36 bg-white rounded-3xl border border-slate-200/80" />
          </div>
          <div className="h-72 bg-white rounded-3xl border border-slate-200/80" />
        </div>
      )}

      {/* ─── UX State: Not Found / Error ──────────────────────────────── */}
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
              href="/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              <span>Về danh sách hóa đơn</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Populated Invoice Detail Content ─────────────────────────── */}
      {!isLoading && !errorMessage && invoice && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="text-[#0EA5B7]" size={24} />
                  <span>Hóa Đơn #INV-{invoice.invoice_id ?? invoice.id}</span>
                </h1>
                {getStatusBadge(invoice)}
              </div>
              <p className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
                <Calendar size={14} className="text-[#0EA5B7]" />
                <span>
                  Ngày phát hành: <strong>{formattedIssuedDate}</strong>
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {invoice.status === "unpaid" && !isPendingPayment && (
                <button
                  onClick={openPaymentModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <CreditCard size={15} />
                  <span>Thanh toán ngay</span>
                </button>
              )}

              {isPendingPayment && (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Clock size={14} className="text-amber-500 animate-spin" />
                  <span>Đang chờ đối soát</span>
                </div>
              )}

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-95"
              >
                <FileText size={15} className="text-slate-400" />
                <span>In hóa đơn</span>
              </button>
            </div>
          </div>

          {/* Conditional Banner: Pending Payment Alert */}
          {isPendingPayment && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock size={20} className="animate-pulse text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider">
                      Đang chờ phòng khám xác nhận thanh toán
                    </h3>
                    <p className="text-xs text-amber-800">
                      Yêu cầu thanh toán của bạn đã được ghi nhận vào hệ thống và đang được nhân viên lễ tân/kế toán đối soát.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => loadInvoice(true)}
                  disabled={isRefetching}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100/60 transition-all shadow-xs shrink-0 self-start sm:self-center"
                >
                  <RefreshCw size={13} className={cn(isRefetching && "animate-spin text-[#0EA5B7]")} />
                  <span>Kiểm tra trạng thái đối soát</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 space-y-1">
                  <span className="text-slate-400 font-medium block">Phương thức gửi</span>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {invoice.payment?.payment_method === "cash" ? (
                      <>
                        <Banknote size={15} className="text-amber-600" />
                        <span>Tiền mặt tại quầy lễ tân</span>
                      </>
                    ) : (
                      <>
                        <QrCode size={15} className="text-amber-600" />
                        <span>Chuyển khoản ngân hàng</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 space-y-1">
                  <span className="text-slate-400 font-medium block">Mã tham chiếu đối soát</span>
                  <p className="font-mono font-bold text-slate-900 text-sm truncate">
                    {invoice.payment?.transaction_ref || "(Không có — Tiền mặt tại quầy)"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 space-y-1">
                  <span className="text-slate-400 font-medium block">Số tiền chờ xác nhận</span>
                  <p className="font-extrabold text-amber-700 text-sm">
                    {formatCurrency(invoice.payment?.amount || invoice.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Banner: Unpaid (No pending payment yet) */}
          {invoice.status === "unpaid" && !isPendingPayment && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                    Hóa đơn viện phí chưa thanh toán
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Số tiền cần thanh toán:{" "}
                    <strong className="text-amber-950">{formatCurrency(invoice.total_amount)}</strong>.
                    Vui lòng thanh toán bằng tiền mặt tại quầy hoặc chuyển khoản ngân hàng.
                  </p>
                </div>
              </div>

              <button
                onClick={openPaymentModal}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-all shadow-md active:scale-95"
              >
                Mở quầy thanh toán (Payment Counter)
              </button>
            </div>
          )}

          {/* Conditional Banner: Cancelled Notice */}
          {invoice.status === "cancelled" && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-xs flex items-center gap-3 text-rose-800 text-xs animate-in fade-in">
              <XCircle size={20} className="text-rose-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-rose-950 uppercase tracking-wider">
                  Hóa đơn đã bị hủy
                </h4>
                <p className="text-rose-700">
                  Hóa đơn này đã được hủy bỏ và không còn giá trị thanh toán hoặc quyết toán.
                </p>
              </div>
            </div>
          )}

          {/* ─── 3 Information Cards (Owner, Pet, Appointment) ─────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Chủ Nuôi (Owner) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <User size={16} className="text-[#0EA5B7]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Khách Hàng (Chủ Nuôi)
                </h3>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-extrabold text-slate-900 text-sm">
                  {invoice.owner_name || "Khách hàng"}
                </p>
                {invoice.owner_phone && (
                  <p className="text-slate-600 flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{invoice.owner_phone}</span>
                  </p>
                )}
                {invoice.owner_email && (
                  <p className="text-slate-600 flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{invoice.owner_email}</span>
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
                {invoice.pet_id && (
                  <Link
                    href={`/pets/${invoice.pet_id}`}
                    className="text-[11px] font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Xem hồ sơ</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
                  {invoice.pet_species === "cat" ? <Cat size={22} /> : <Dog size={22} />}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-extrabold text-slate-900 text-sm truncate">
                    {invoice.pet_name ? `Bé ${invoice.pet_name}` : "Thú cưng"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Loài:{" "}
                    <strong className="text-slate-700">
                      {invoice.pet_species === "cat"
                        ? "Mèo"
                        : invoice.pet_species === "dog"
                        ? "Chó"
                        : invoice.pet_species || "Chưa rõ"}
                    </strong>
                    {invoice.pet_breed && ` • ${invoice.pet_breed}`}
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
                {invoice.appointment_id && (
                  <Link
                    href={`/appointments/${invoice.appointment_id}`}
                    className="text-[11px] font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Lịch #{invoice.appointment_id}</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>

              <div className="space-y-1 text-xs">
                {invoice.appointment_date ? (
                  <p className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {new Date(invoice.appointment_date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {invoice.start_time && ` (${invoice.start_time})`}
                    </span>
                  </p>
                ) : (
                  <p className="text-slate-500">Lịch khám #{invoice.appointment_id}</p>
                )}
                <p className="text-slate-500 text-[11px] line-clamp-2">
                  Lý do: {invoice.reason || "Khám sức khỏe tổng quát"}
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
                {invoice.items?.length || 0} hạng mục
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
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
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
                        Chi tiết dịch vụ theo lịch hẹn #{invoice.appointment_id}
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
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ─── Conditional Card: Payment Receipt (Nếu status = paid) ─── */}
          {invoice.status === "paid" && (
            <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-emerald-50/40 border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Biên Nhận Giao Dịch Thanh Toán
                    </h3>
                    <p className="text-[11px] text-emerald-700">
                      Hóa đơn đã được quyết toán và xác thực thành công trên hệ thống.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 size={13} />
                  Thành công
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* Payment Method */}
                <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Hình thức thanh toán</span>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {invoice.payment?.payment_method === "cash" ? (
                      <>
                        <Banknote size={14} className="text-emerald-600" />
                        <span>Tiền mặt tại quầy</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} className="text-emerald-600" />
                        <span>Chuyển khoản ngân hàng</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Payment Date */}
                <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Ngày giờ thanh toán</span>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-600" />
                    <span>
                      {invoice.payment?.payment_date
                        ? new Date(invoice.payment.payment_date).toLocaleString("vi-VN")
                        : formattedIssuedDate}
                    </span>
                  </p>
                </div>

                {/* Transaction Ref */}
                <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Mã tham chiếu đối soát</span>
                  <p className="font-bold text-slate-900 text-sm font-mono truncate">
                    {invoice.payment?.transaction_ref ||
                      `SPC-TXN-${invoice.invoice_id ?? invoice.id}`}
                  </p>
                </div>

                {/* Amount Paid */}
                <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Số tiền đã quyết toán</span>
                  <p className="font-extrabold text-emerald-700 text-sm">
                    {formatCurrency(invoice.payment?.amount || invoice.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Payment Counter Modal (Floating UI 2D Modal) ──────────────── */}
      {isPaymentModalOpen && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Quầy Thu Ngân (Payment Counter)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hóa đơn #INV-{invoice.invoice_id ?? invoice.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmittingPayment}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-[#0EA5B7]/10 border border-[#0EA5B7]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Số tiền cần thanh toán (Amount)
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-[#0EA5B7] tracking-tight">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 text-[#0EA5B7] flex items-center justify-center shadow-xs">
                <Receipt size={20} />
              </div>
            </div>

            {/* Payment Method Selector (STRICTLY Cash | Bank Transfer ONLY) */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn phương thức thanh toán:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Cash */}
                  <label
                    className={cn(
                      "p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative",
                      selectedMethod === "cash"
                        ? "border-[#0EA5B7] bg-[#0EA5B7]/5 shadow-xs ring-2 ring-[#0EA5B7]/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={selectedMethod === "cash"}
                      onChange={() => {
                        setSelectedMethod("cash");
                        setInputError(null);
                      }}
                      className="mt-1 text-[#0EA5B7] focus:ring-[#0EA5B7]"
                    />
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Banknote size={15} className="text-amber-600" />
                        <span>Tiền mặt</span>
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Thanh toán tại quầy lễ tân
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Bank Transfer */}
                  <label
                    className={cn(
                      "p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative",
                      selectedMethod === "bank_transfer"
                        ? "border-[#0EA5B7] bg-[#0EA5B7]/5 shadow-xs ring-2 ring-[#0EA5B7]/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="bank_transfer"
                      checked={selectedMethod === "bank_transfer"}
                      onChange={() => {
                        setSelectedMethod("bank_transfer");
                        setInputError(null);
                      }}
                      className="mt-1 text-[#0EA5B7] focus:ring-[#0EA5B7]"
                    />
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <QrCode size={15} className="text-[#0EA5B7]" />
                        <span>Chuyển khoản</span>
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Qua QR / Tài khoản ngân hàng
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Content Based On Method */}
              {selectedMethod === "cash" && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Info size={16} className="text-amber-600" />
                    <span>Hướng dẫn thanh toán tiền mặt</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed text-xs">
                    Vui lòng thanh toán tại quầy lễ tân, nhân viên sẽ xác nhận.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Sau khi nhấn xác nhận, yêu cầu của bạn sẽ được chuyển sang trạng thái <strong>Pending</strong> để nhân viên quầy thu ngân tiếp nhận và thu tiền.
                  </p>
                </div>
              )}

              {selectedMethod === "bank_transfer" && (
                <div className="space-y-3.5 animate-in fade-in">
                  {/* Bank Info Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-900">MB Bank (Ngân hàng Quân Đội)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Số tài khoản:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        0988 123 456
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tên chủ tài khoản:</span>
                      <span className="font-bold text-slate-900">
                        PHONG KHAM THU Y SMARTPETCARE
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Số tiền chuyển:</span>
                      <span className="font-extrabold text-[#0EA5B7] text-sm">
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nội dung chuyển khoản:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        THANHTOAN INV{invoice.invoice_id ?? invoice.id}
                      </span>
                    </div>
                  </div>

                  {/* Input: Transaction Ref (BẮT BUỘC) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Mã tham chiếu giao dịch (Transaction Ref) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => {
                        setTransactionRef(e.target.value);
                        setInputError(null);
                      }}
                      placeholder="Ví dụ: MB-89234812, FT2384920, mã giao dịch trên app ngân hàng..."
                      className={cn(
                        "w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-mono",
                        inputError
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-slate-200 focus:border-[#0EA5B7]"
                      )}
                    />
                    <p className="text-[11px] text-slate-500">
                      Nhập mã giao dịch thành công trên ứng dụng ngân hàng của bạn để nhân viên kế toán đối soát nhanh nhất.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {inputError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>{inputError}</span>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0EA5B7] hover:bg-[#0b8fa0] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>
                        {selectedMethod === "cash"
                          ? "Xác nhận thanh toán tại quầy"
                          : "Gửi xác nhận chuyển khoản"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
