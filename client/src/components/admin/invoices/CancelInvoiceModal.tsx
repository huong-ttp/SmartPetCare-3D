"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Receipt,
  User,
  Dog,
  Calendar,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Invoice } from "@/types/invoice.type";
import { invoiceService } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: (updatedInvoice: Invoice) => void;
}

const QUICK_REASONS = [
  "Khách hủy lịch khám",
  "Nhập sai danh mục dịch vụ",
  "Hóa đơn tạo trùng lặp",
  "Chuyển sang đợt điều trị mới",
  "Bác sĩ điều chỉnh viện phí",
];

export default function CancelInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: CancelInvoiceModalProps) {
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
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const invoiceId = invoice.invoice_id ?? invoice.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setValidationError("Vui lòng nhập lý do hủy hóa đơn.");
      return;
    }
    if (cleanReason.length < 5) {
      setValidationError("Lý do hủy cần có ít nhất 5 ký tự để ghi nhận đối soát.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const updated = await invoiceService.cancel(invoiceId, cleanReason);
      showSuccess(`Đã hủy hóa đơn #INV-${invoiceId} thành công.`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("[CancelInvoiceModal] Error cancelling invoice:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể hủy hóa đơn. Vui lòng kiểm tra lại trạng thái.";
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
              <h3 className="text-base font-extrabold text-slate-900">
                Hủy Hóa Đơn #INV-{invoiceId}
              </h3>
              <p className="text-xs text-slate-500">
                Thao tác quản trị dành riêng cho trường hợp đặc biệt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Alert */}
        <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-rose-900">
            <AlertTriangle size={14} className="text-rose-600" />
            <span>Cảnh báo hành động không thể hoàn tác</span>
          </p>
          <p className="text-rose-700 leading-relaxed text-[11px]">
            Hóa đơn sẽ chuyển trạng thái sang <strong>Đã hủy (Cancelled)</strong>. Các dịch vụ trong hóa đơn sẽ không thể thanh toán tiếp.
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Khách hàng (Chủ nuôi):</span>
            <span className="font-bold text-slate-900">{invoice.owner_name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Thú cưng / Lịch hẹn:</span>
            <span className="font-bold text-slate-900">
              {invoice.pet_name || "Thú cưng"} • #{invoice.appointment_id}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium">Tổng tiền viện phí:</span>
            <span className="font-extrabold text-[#0EA5B7] text-sm">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Lý do hủy hóa đơn <span className="text-rose-500">*</span>
            </label>

            {/* Quick reason suggestions */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    reason === r
                      ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Nhập lý do chi tiết để lưu trữ đối soát kế toán..."
              disabled={isSubmitting}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
            />

            {validationError && (
              <p className="text-[11px] font-semibold text-rose-600 animate-in fade-in">
                {validationError}
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận hủy hóa đơn</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
