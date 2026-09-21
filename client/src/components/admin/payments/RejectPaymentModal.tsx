"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Receipt,
  User,
  Loader2,
  XCircle,
  FileText,
} from "lucide-react";
import { Payment } from "@/types/payment.type";
import { payment } from "@/services/paymentService";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";

interface RejectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentItem: Payment | null;
  onSuccess: (updatedPayment: Payment) => void;
}

const QUICK_REASONS = [
  "Chưa nhận được tiền vào tài khoản",
  "Sai nội dung chuyển khoản / mã giao dịch",
  "Số tiền chuyển khoản không khớp hóa đơn",
  "Khách hàng yêu cầu đổi hình thức thanh toán",
  "Giao dịch nghi ngờ trùng lặp",
];

export default function RejectPaymentModal({
  isOpen,
  onClose,
  paymentItem,
  onSuccess,
}: RejectPaymentModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setValidationError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, paymentItem]);

  if (!isOpen || !paymentItem) return null;

  const paymentId = paymentItem.payment_id ?? paymentItem.id;
  const invoiceId = paymentItem.invoice_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setValidationError("Vui lòng nhập lý do từ chối thanh toán.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const res = await payment.service.reject(paymentId, cleanReason);
      showSuccess(`Đã từ chối thanh toán #PAY-${paymentId}.`);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error("[RejectPaymentModal] Error rejecting payment:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể từ chối thanh toán. Vui lòng kiểm tra lại.";
      setValidationError(msg);
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
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Từ chối thanh toán
              </h3>
              <p className="text-xs text-slate-500">
                Chuyển giao dịch sang trạng thái Thất bại (Failed)
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

        {/* Payment Summary */}
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Mã thanh toán:</span>
            <span className="font-mono font-bold text-slate-900">#PAY-{paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hóa đơn:</span>
            <span className="font-mono font-semibold text-slate-800">#INV-{invoiceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Khách hàng:</span>
            <span className="font-semibold text-slate-800">{paymentItem.owner_name || "Chưa xác định"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số tiền:</span>
            <span className="font-bold text-rose-600 text-sm">
              {formatCurrency(paymentItem.amount)}
            </span>
          </div>
          {paymentItem.transaction_ref && (
            <div className="flex justify-between">
              <span className="text-slate-500">Mã GD tham chiếu:</span>
              <span className="font-mono font-semibold text-slate-800">{paymentItem.transaction_ref}</span>
            </div>
          )}
        </div>

        {/* Reason Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" />
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>

            {/* Quick Reason Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setValidationError(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    reason === r
                      ? "bg-rose-100 border-rose-300 text-rose-800 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Nhập chi tiết lý do từ chối giao dịch này..."
              rows={3}
              className={`w-full text-sm p-3 rounded-2xl border transition-all outline-none resize-none ${
                validationError
                  ? "border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-200 focus:border-[#0EA5B7] focus:ring-2 focus:ring-[#0EA5B7]/10"
              }`}
            />
            {validationError && (
              <p className="text-xs text-rose-600 font-medium">{validationError}</p>
            )}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-[11px] text-amber-800 leading-relaxed">
            Lưu ý: Sau khi từ chối, giao dịch sẽ chuyển sang <strong>Failed</strong>. Khách hàng có thể thực hiện lại thanh toán mới cho hóa đơn này.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span>Từ chối giao dịch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
