"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Banknote,
  Receipt,
  User,
  Dog,
  Cat,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Invoice } from "@/types/invoice.type";
import { Payment } from "@/types/payment.type";
import { admin } from "@/services/adminService";
import { payment } from "@/services/paymentService";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";

interface CreateCashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPayment: Payment) => void;
}

export default function CreateCashPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCashPaymentModalProps) {
  const { success: showSuccess, error: showError } = useToast();

  // State
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [manualInvoiceId, setManualInvoiceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load unpaid invoices when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setSelectedInvoice(null);
    setManualInvoiceId("");
    setAmount(0);
    setSearchQuery("");
    setErrorMessage(null);
    setIsSubmitting(false);

    const fetchUnpaid = async () => {
      setIsLoadingInvoices(true);
      try {
        const res = await admin.service.listInvoices({
          status: "unpaid",
          limit: 50,
        });
        setUnpaidInvoices(res.items || []);
      } catch (err: any) {
        console.error("[CreateCashPaymentModal] Failed to fetch unpaid invoices:", err);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    fetchUnpaid();
  }, [isOpen]);

  // Select an invoice
  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setManualInvoiceId(String(inv.invoice_id ?? inv.id));
    setAmount(Number(inv.total_amount || 0));
    setErrorMessage(null);
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return unpaidInvoices;
    const q = searchQuery.toLowerCase().trim();
    return unpaidInvoices.filter(
      (inv) =>
        String(inv.invoice_id ?? inv.id).toLowerCase().includes(q) ||
        inv.owner_name?.toLowerCase().includes(q) ||
        inv.pet_name?.toLowerCase().includes(q) ||
        inv.owner_phone?.toLowerCase().includes(q)
    );
  }, [unpaidInvoices, searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetInvoiceId = selectedInvoice
      ? selectedInvoice.invoice_id ?? selectedInvoice.id
      : manualInvoiceId.trim();

    if (!targetInvoiceId) {
      setErrorMessage("Vui lòng chọn một hóa đơn chưa thanh toán hoặc nhập mã hóa đơn.");
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMessage("Số tiền thanh toán phải lớn hơn 0 VND.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await payment.service.createCash({
        invoice_id: targetInvoiceId,
        amount: Number(amount),
      });

      showSuccess(`Đã ghi nhận thanh toán tiền mặt cho hóa đơn #INV-${targetInvoiceId} thành công!`);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error("[CreateCashPaymentModal] Error creating cash payment:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể ghi nhận thanh toán tiền mặt. Vui lòng kiểm tra lại.";
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Banknote size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Ghi nhận thanh toán tiền mặt
              </h3>
              <p className="text-xs text-slate-500">
                Thu tiền mặt tại quầy & tự động hoàn tất thanh toán hóa đơn
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
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Invoice */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt size={14} className="text-slate-400" />
                Chọn hóa đơn chưa thanh toán <span className="text-rose-500">*</span>
              </span>
              {selectedInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    setAmount(0);
                  }}
                  className="text-[11px] text-[#0EA5B7] font-semibold hover:underline"
                >
                  Chọn hóa đơn khác
                </button>
              )}
            </label>

            {!selectedInvoice ? (
              <div className="space-y-2.5">
                {/* Search input for invoices */}
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo Mã HĐ, Tên khách hàng, Thú cưng, SĐT..."
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0EA5B7] focus:bg-white transition-all"
                  />
                </div>

                {/* List of unpaid invoices */}
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-1 bg-slate-50/50">
                  {isLoadingInvoices ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                      <Loader2 size={18} className="animate-spin text-[#0EA5B7]" />
                      <span>Đang tải danh sách hóa đơn chưa thanh toán...</span>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-400">
                      Không tìm thấy hóa đơn chưa thanh toán nào phù hợp.
                    </div>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const id = inv.invoice_id ?? inv.id;
                      return (
                        <div
                          key={id}
                          onClick={() => handleSelectInvoice(inv)}
                          className="p-3 bg-white border border-slate-200/70 hover:border-[#0EA5B7] rounded-xl cursor-pointer transition-all hover:shadow-xs flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-[#0EA5B7] transition-colors">
                                #INV-{id}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700">
                                • {inv.owner_name || "Khách hàng"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              {inv.pet_name && <span>Bé: {inv.pet_name}</span>}
                              {inv.owner_phone && <span>SĐT: {inv.owner_phone}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xs text-emerald-600 block">
                              {formatCurrency(inv.total_amount)}
                            </span>
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                              Chưa thanh toán
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Selected Invoice Card */
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="font-mono font-bold text-sm text-slate-900">
                      #INV-{selectedInvoice.invoice_id ?? selectedInvoice.id}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-emerald-100">
                  <div>
                    <span className="text-slate-400">Khách hàng: </span>
                    <strong className="text-slate-700">{selectedInvoice.owner_name || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Thú cưng: </span>
                    <strong className="text-slate-700">{selectedInvoice.pet_name ? `Bé ${selectedInvoice.pet_name}` : "N/A"}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Amount Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote size={14} className="text-slate-400" />
              Số tiền thu thực tế (VND) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="1000"
                value={amount || ""}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập số tiền thu tại quầy..."
                className="w-full text-sm font-bold text-emerald-700 pl-4 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VND
              </span>
            </div>
            {selectedInvoice && amount !== Number(selectedInvoice.total_amount) && (
              <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                Lưu ý: Số tiền nên bằng chính xác tổng tiền hóa đơn ({formatCurrency(selectedInvoice.total_amount)}).
              </p>
            )}
          </div>

          {/* Live highlight box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <Sparkles size={16} className="text-[#0EA5B7] shrink-0 mt-0.5" />
            <p>
              Vì khách thanh toán trực tiếp tại quầy, giao dịch sẽ được lưu với trạng thái{" "}
              <strong className="text-emerald-600">Thành công (Success)</strong> và hóa đơn liên quan sẽ chuyển sang{" "}
              <strong className="text-emerald-600">Đã thanh toán (Paid)</strong> ngay lập tức.
            </p>
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
              disabled={isSubmitting || (!selectedInvoice && !manualInvoiceId)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang ghi nhận...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Xác nhận thu tiền</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
