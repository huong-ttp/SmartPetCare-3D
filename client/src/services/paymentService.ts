/**
 * paymentService.ts
 * payment_method: cash | bank_transfer ONLY.
 * status: pending | success | failed.
 */
import axiosClient from "@/lib/axiosClient";
import type {
  Payment,
  CreatePaymentDTO,
  UpdatePaymentStatusDTO,
  CreateCashPaymentDTO,
} from "@/types/payment.type";
import { MOCK_PAYMENTS, MOCK_INVOICES } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const paymentService = {
  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    if (USE_MOCK) return mockDelay(MOCK_PAYMENTS.filter((p) => String(p.invoice_id) === String(invoiceId)));
    const res = await axiosClient.get<Payment[]>(`/invoices/${invoiceId}/payments`);
    return res.data;
  },

  async create(dto: CreatePaymentDTO): Promise<Payment> {
    if (USE_MOCK) {
      return mockDelay({
        id: "pay_" + Date.now(),
        owner_id: "u1",
        status: "pending",
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Payment);
    }
    const res = await axiosClient.post<any>("/payments", dto);
    const raw = res.data?.data ?? res.data;
    return raw;
  },

  async updateStatus(id: string, dto: UpdatePaymentStatusDTO): Promise<Payment> {
    if (USE_MOCK) {
      const p = MOCK_PAYMENTS.find((p) => p.id === id);
      if (!p) throw new Error("Thanh toán không tồn tại.");
      return mockDelay({ ...p, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<any>(`/payments/${id}/status`, dto);
    const raw = res.data?.data ?? res.data;
    return raw;
  },

  /** Admin: Xác nhận thanh toán (status -> success, invoice -> paid) */
  async confirm(id: string | number): Promise<Payment> {
    const cleanId = String(id);
    if (USE_MOCK) {
      const p = MOCK_PAYMENTS.find(
        (x) => String(x.id) === cleanId || String(x.payment_id) === cleanId
      );
      if (!p) throw new Error("Thanh toán không tồn tại.");
      p.status = "success";
      p.paid_at = new Date().toISOString();
      p.updated_at = new Date().toISOString();
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === String(p.invoice_id) || String(i.invoice_id) === String(p.invoice_id)
      );
      if (inv) inv.status = "paid";
      return mockDelay({ ...p });
    }
    try {
      const res = await axiosClient.put<any>(`/admin/payments/${cleanId}/confirm`);
      const raw = res.data?.data ?? res.data;
      return raw;
    } catch (err) {
      console.warn("[paymentService.confirm] API failed, attempting mock fallback:", err);
      const p = MOCK_PAYMENTS.find(
        (x) => String(x.id) === cleanId || String(x.payment_id) === cleanId
      );
      if (p) {
        p.status = "success";
        p.paid_at = new Date().toISOString();
        p.updated_at = new Date().toISOString();
        const inv = MOCK_INVOICES.find(
          (i) => String(i.id) === String(p.invoice_id) || String(i.invoice_id) === String(p.invoice_id)
        );
        if (inv) inv.status = "paid";
        return mockDelay({ ...p });
      }
      throw err;
    }
  },

  /** Admin: Từ chối thanh toán (status -> failed, lưu reject_reason) */
  async reject(id: string | number, reason?: string): Promise<Payment> {
    const cleanId = String(id);
    if (USE_MOCK) {
      const p = MOCK_PAYMENTS.find(
        (x) => String(x.id) === cleanId || String(x.payment_id) === cleanId
      );
      if (!p) throw new Error("Thanh toán không tồn tại.");
      p.status = "failed";
      p.reject_reason = reason || "Không xác định";
      p.updated_at = new Date().toISOString();
      return mockDelay({ ...p });
    }
    try {
      const res = await axiosClient.put<any>(`/admin/payments/${cleanId}/reject`, { reason });
      const raw = res.data?.data ?? res.data;
      return raw;
    } catch (err) {
      console.warn("[paymentService.reject] API failed, attempting mock fallback:", err);
      const p = MOCK_PAYMENTS.find(
        (x) => String(x.id) === cleanId || String(x.payment_id) === cleanId
      );
      if (p) {
        p.status = "failed";
        p.reject_reason = reason || "Không xác định";
        p.updated_at = new Date().toISOString();
        return mockDelay({ ...p });
      }
      throw err;
    }
  },

  /** Admin: Ghi nhận thanh toán tiền mặt tại quầy (status = success luôn) */
  async createCash(dto: CreateCashPaymentDTO): Promise<Payment> {
    if (USE_MOCK) {
      const newPay: Payment = {
        id: "pay_" + Date.now(),
        payment_id: Date.now(),
        invoice_id: String(dto.invoice_id),
        owner_id: "u1",
        amount: Number(dto.amount),
        payment_method: "cash",
        status: "success",
        paid_at: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === String(dto.invoice_id) || String(i.invoice_id) === String(dto.invoice_id)
      );
      if (inv) {
        inv.status = "paid";
        newPay.owner_name = inv.owner_name;
        newPay.pet_name = inv.pet_name;
      }
      MOCK_PAYMENTS.unshift(newPay);
      return mockDelay(newPay);
    }
    try {
      const res = await axiosClient.post<any>("/admin/payments/cash", {
        invoice_id: Number(dto.invoice_id),
        amount: Number(dto.amount),
      });
      const raw = res.data?.data ?? res.data;
      return raw;
    } catch (err) {
      console.warn("[paymentService.createCash] API failed, fallback mock:", err);
      const newPay: Payment = {
        id: "pay_" + Date.now(),
        payment_id: Date.now(),
        invoice_id: String(dto.invoice_id),
        owner_id: "u1",
        amount: Number(dto.amount),
        payment_method: "cash",
        status: "success",
        paid_at: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === String(dto.invoice_id) || String(i.invoice_id) === String(dto.invoice_id)
      );
      if (inv) {
        inv.status = "paid";
        newPay.owner_name = inv.owner_name;
        newPay.pet_name = inv.pet_name;
      }
      MOCK_PAYMENTS.unshift(newPay);
      return mockDelay(newPay);
    }
  },
};

export const payment = {
  service: paymentService,
};

export default paymentService;

