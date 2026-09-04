/**
 * paymentService.ts
 * payment_method: cash | bank_transfer ONLY.
 * status: pending | success | failed.
 */
import axiosClient from "@/lib/axiosClient";
import type { Payment, CreatePaymentDTO, UpdatePaymentStatusDTO } from "@/types/payment.type";
import { MOCK_PAYMENTS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const paymentService = {
  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    if (USE_MOCK) return mockDelay(MOCK_PAYMENTS.filter((p) => p.invoice_id === invoiceId));
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
    const res = await axiosClient.post<Payment>("/payments", dto);
    return res.data;
  },

  async updateStatus(id: string, dto: UpdatePaymentStatusDTO): Promise<Payment> {
    if (USE_MOCK) {
      const p = MOCK_PAYMENTS.find((p) => p.id === id);
      if (!p) throw new Error("Thanh toán không tồn tại.");
      return mockDelay({ ...p, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<Payment>(`/payments/${id}/status`, dto);
    return res.data;
  },
};
