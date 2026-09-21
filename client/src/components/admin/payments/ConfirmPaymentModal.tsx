"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Receipt,
  User,
  Dog,
  Loader2,
  CreditCard,
  Banknote,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Payment } from "@/types/payment.type";
import { payment } from "@/services/paymentService";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentItem: Payment | null;
  onSuccess: (updatedPayment: Payment) => void;
}

export default function ConfirmPaymentModal({
  isOpen,
  onClose,
  paymentItem,
  onSuccess,
}: ConfirmPaymentModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !paymentItem) return null;

  const paymentId = paymentItem.payment_id ?? paymentItem.id;
  const invoiceId = paymentItem.invoice_id;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await payment.service.confirm(paymentId);
      showSuccess(`Đã xác nhận thanh toán #PAY-${paymentId} thành công.`);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error("[ConfirmPaymentModal] Error confirming payment:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xác nhận thanh toán. Vui lòng kiểm tra lại.";
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Xác nhận thanh toán
              </h3>
              <p className="text-xs text-slate-500">
                Phê duyệt giao dịch và cập nhật hóa đơn sang Đã thanh toán
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Payment Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mã thanh toán
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              #PAY-{paymentId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 flex items-center gap-1.5">
              <Receipt size={14} className="text-slate-400" />
              Hóa đơn liên quan
            </span>
            <span className="font-mono font-bold text-[#0EA5B7] text-sm">
              #INV-{invoiceId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 flex items-center gap-1.5">
              <User size={14} className="text-slate-400" />
              Khách hàng
            </span>
            <span className="font-semibold text-slate-800 text-sm">
              {paymentItem.owner_name || "Chưa xác định"}
            </span>
          </div>

          {paymentItem.pet_name && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <Dog size={14} className="text-[#0EA5B7]" />
                Thú cưng
              </span>
              <span className="font-medium text-slate-700 text-sm">
                Bé {paymentItem.pet_name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 flex items-center gap-1.5">
              {paymentItem.payment_method === "cash" ? (
                <Banknote size={14} className="text-emerald-500" />
              ) : (
                <CreditCard size={14} className="text-blue-500" />
              )}
              Phương thức
            </span>
            <span className="font-semibold text-xs text-slate-800">
              {paymentItem.payment_method === "cash"
                ? "Tiền mặt tại quầy"
                : "Chuyển khoản ngân hàng"}
            </span>
          </div>

          {paymentItem.transaction_ref && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Mã giao dịch</span>
              <span className="font-mono font-bold text-xs bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-800">
                {paymentItem.transaction_ref}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Số tiền thanh toán</span>
            <span className="text-lg font-extrabold text-emerald-600">
              {formatCurrency(paymentItem.amount)}
            </span>
          </div>
        </div>

        {/* Notice Info Box */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <p>
            Hệ thống sẽ chuyển trạng thái thanh toán sang{" "}
            <strong className="font-semibold text-emerald-700">Thành công (Success)</strong> và
            tự động đổi hóa đơn <strong className="font-semibold font-mono">#INV-{invoiceId}</strong> sang{" "}
            <strong className="font-semibold text-emerald-700">Đã thanh toán (Paid)</strong>.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Xác nhận thanh toán</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
