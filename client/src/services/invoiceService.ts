/**
 * invoiceService.ts
 * Invoice tự sinh khi Appointment → completed.
 * Status: unpaid | paid | cancelled ONLY (không partially_paid).
 */
import axiosClient from "@/lib/axiosClient";
import type { Invoice, InvoiceItem, UpdateInvoiceStatusDTO } from "@/types/invoice.type";
import { MOCK_INVOICES, MOCK_INVOICE_ITEMS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const invoiceService = {
  async getMyInvoices(): Promise<Invoice[]> {
    if (USE_MOCK) return mockDelay(MOCK_INVOICES);
    const res = await axiosClient.get<Invoice[]>("/invoices");
    return res.data;
  },

  async getById(id: string): Promise<Invoice> {
    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find((i) => i.id === id);
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      return mockDelay(inv);
    }
    const res = await axiosClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },

  async getItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    if (USE_MOCK) return mockDelay(MOCK_INVOICE_ITEMS.filter((i) => i.invoice_id === invoiceId));
    const res = await axiosClient.get<InvoiceItem[]>(`/invoices/${invoiceId}/items`);
    return res.data;
  },

  async updateStatus(id: string, dto: UpdateInvoiceStatusDTO): Promise<Invoice> {
    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find((i) => i.id === id);
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      return mockDelay({ ...inv, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<Invoice>(`/invoices/${id}/status`, dto);
    return res.data;
  },
};
