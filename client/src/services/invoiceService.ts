import axiosClient from "@/lib/axiosClient";
import type {
  Invoice,
  InvoiceItem,
  InvoicePaymentInfo,
  InvoiceFilterDTO,
  UpdateInvoiceStatusDTO,
} from "@/types/invoice.type";
import type { ApiResponse } from "@/types/api.type";
import { MOCK_INVOICES, MOCK_INVOICE_ITEMS, MOCK_PAYMENTS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function normalizeInvoice(item: unknown): Invoice {
  if (!item) return item as unknown as Invoice;
  const raw = item as Record<string, unknown>;
  const cleanId = String(raw.invoice_id ?? raw.id ?? "");
  const items: InvoiceItem[] = Array.isArray(raw.items)
    ? (raw.items as Array<Record<string, unknown>>).map((it) => ({
        id: String(it.item_id ?? it.id ?? ""),
        item_id: (it.item_id as number | undefined) ?? (it.id as number | undefined),
        invoice_id: cleanId,
        service_id: it.service_id as number | string | undefined,
        service_name: (it.service_name as string) || (it.description as string) || "Dịch vụ thú y",
        service_description: it.service_description as string | undefined,
        description: (it.description as string) || (it.service_name as string) || "Dịch vụ y tế",
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        subtotal: Number(it.subtotal || 0),
      }))
    : [];

  const rawPayments = Array.isArray(raw.payments) ? (raw.payments as Array<Record<string, unknown>>) : [];

  const mapPayment = (p: Record<string, unknown>): InvoicePaymentInfo => ({
    payment_id: (p.payment_id as number | string | undefined) ?? (p.id as number | string | undefined) ?? 0,
    invoice_id: String(p.invoice_id ?? cleanId),
    amount: Number(p.amount || 0),
    payment_method: (p.payment_method as "cash" | "bank_transfer") || "cash",
    payment_date: (p.payment_date as string) || (p.created_at as string) || new Date().toISOString(),
    transaction_ref: p.transaction_ref as string | undefined,
    status: (p.status as "pending" | "success" | "failed") || "pending",
  });

  const paymentObj = raw.payment
    ? mapPayment(raw.payment as Record<string, unknown>)
    : rawPayments.length > 0
    ? mapPayment(rawPayments[0])
    : null;

  return {
    ...(item as Invoice),
    id: cleanId,
    invoice_id: (raw.invoice_id as number | undefined) ?? (raw.id as number | undefined),
    appointment_id: String(raw.appointment_id ?? ""),
    owner_id: String(raw.owner_id ?? ""),
    status: (raw.status as Invoice["status"]) || "unpaid",
    total_amount: Number(raw.total_amount ?? 0),
    issued_at: (raw.issued_at as string) || (raw.issued_date as string) || (raw.created_at as string),
    issued_date: (raw.issued_date as string) || (raw.issued_at as string),
    due_date: raw.due_date as string | undefined,
    notes: raw.notes as string | undefined,

    pet_id: raw.pet_id as number | string | undefined,
    pet_name: raw.pet_name as string | undefined,
    pet_species: raw.pet_species as string | undefined,
    pet_breed: raw.pet_breed as string | undefined,
    pet_weight: raw.pet_weight ? Number(raw.pet_weight) : undefined,

    appointment_date: raw.appointment_date as string | undefined,
    start_time: raw.start_time as string | undefined,
    end_time: raw.end_time as string | undefined,
    reason: raw.reason as string | undefined,
    service_name: raw.service_name as string | undefined,

    owner_name: raw.owner_name as string | undefined,
    owner_phone: raw.owner_phone as string | undefined,
    owner_email: raw.owner_email as string | undefined,

    items,
    payments: rawPayments.length > 0 ? rawPayments.map(mapPayment) : undefined,
    payment: paymentObj,
    cancel_reason: raw.cancel_reason as string | undefined,

    created_at: (raw.created_at as string) || new Date().toISOString(),
    updated_at: raw.updated_at as string | undefined,
  };
}

export const invoiceService = {
  /** Lấy danh sách hóa đơn của owner hiện tại (hỗ trợ filter status) */
  async getMyInvoices(filter?: InvoiceFilterDTO): Promise<Invoice[]> {
    if (USE_MOCK) {
      let list = MOCK_INVOICES.map(normalizeInvoice);
      if (filter?.status && filter.status !== "all") {
        list = list.filter((i) => i.status === filter.status);
      }
      return mockDelay(list);
    }

    const params: Record<string, unknown> = {};
    if (filter?.status && filter.status !== "all") {
      params.status = filter.status;
    }
    const res = await axiosClient.get<ApiResponse<Invoice[]> | Invoice[]>("/invoices", { params });
    const raw = res.data;
    let list: unknown[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray((raw as ApiResponse<Invoice[]>).data)) list = (raw as ApiResponse<Invoice[]>).data ?? [];
    else if (raw && typeof raw === "object" && "invoices" in raw && Array.isArray((raw as { invoices?: Invoice[] }).invoices)) {
      list = (raw as { invoices: Invoice[] }).invoices;
    }
    return list.map(normalizeInvoice);
  },

  /** Alias: invoice.service.list({owner: me}) */
  async list(filter?: InvoiceFilterDTO): Promise<Invoice[]> {
    return invoiceService.getMyInvoices(filter);
  },

  /** Lấy chi tiết hóa đơn theo ID (tự động thử route admin nếu có quyền) */
  async getById(id: string | number, asAdmin = false): Promise<Invoice> {
    const cleanId = String(id);
    const getMockInvoice = () => {
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === cleanId || String(i.invoice_id) === cleanId
      );
      if (!inv) return null;
      const items = MOCK_INVOICE_ITEMS.filter((it) => String(it.invoice_id) === cleanId);
      const payments = MOCK_PAYMENTS.filter((p) => String(p.invoice_id) === cleanId);
      return normalizeInvoice({
        ...inv,
        items: items.length ? items : inv.items,
        payments: payments.length ? payments : inv.payments,
      });
    };

    if (USE_MOCK) {
      const mockInv = getMockInvoice();
      if (!mockInv) throw new Error("Hóa đơn không tồn tại.");
      return mockDelay(mockInv);
    }

    const endpoint = asAdmin ? `/admin/invoices/${cleanId}` : `/invoices/${cleanId}`;
    try {
      const res = await axiosClient.get<ApiResponse<Invoice> | Invoice>(endpoint);
      const raw = (res.data as ApiResponse<Invoice>)?.data ?? (res.data as Invoice);
      if (!raw) throw new Error("Hóa đơn không tồn tại.");
      return normalizeInvoice(raw as Partial<Invoice> & Record<string, unknown>);
    } catch (err: unknown) {
      // Try admin endpoint if owner endpoint failed (e.g. 403 / not owner)
      if (!asAdmin) {
        try {
          const adminRes = await axiosClient.get<ApiResponse<Invoice> | Invoice>(`/admin/invoices/${cleanId}`);
          const adminRaw = (adminRes.data as ApiResponse<Invoice>)?.data ?? (adminRes.data as Invoice);
          if (adminRaw) return normalizeInvoice(adminRaw as Partial<Invoice> & Record<string, unknown>);
        } catch {
          // Ignore and rethrow original error
        }
      }
      throw err;
    }
  },

  /** Alias: getInvoiceById */
  async getInvoiceById(id: string | number, asAdmin = false): Promise<Invoice> {
    return invoiceService.getById(id, asAdmin);
  },

  /** Lấy danh sách items của hóa đơn */
  async getItemsByInvoiceId(invoiceId: string | number): Promise<InvoiceItem[]> {
    const cleanId = String(invoiceId);
    if (USE_MOCK) {
      return mockDelay(
        MOCK_INVOICE_ITEMS.filter((i) => String(i.invoice_id) === cleanId)
      );
    }
    const res = await axiosClient.get<ApiResponse<InvoiceItem[]> | InvoiceItem[]>(`/invoices/${cleanId}/items`);
    const raw = (res.data as ApiResponse<InvoiceItem[]>)?.data ?? res.data;
    return Array.isArray(raw) ? raw : [];
  },

  /** Hủy hóa đơn (Admin action) */
  async cancel(id: string | number, reason: string): Promise<Invoice> {
    const cleanId = String(id);
    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === cleanId || String(i.invoice_id) === cleanId
      );
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      if (inv.status === "paid") throw new Error("Không thể hủy hóa đơn đã thanh toán.");
      inv.status = "cancelled";
      inv.cancel_reason = reason;
      return mockDelay(normalizeInvoice(inv));
    }
    const res = await axiosClient.put<ApiResponse<Invoice> | Invoice>(`/admin/invoices/${cleanId}/cancel`, { reason });
    const raw = (res.data as ApiResponse<Invoice>)?.data ?? (res.data as Invoice);
    return normalizeInvoice(raw as Partial<Invoice> & Record<string, unknown>);
  },

  /** Cập nhật trạng thái hóa đơn */
  async updateStatus(id: string | number, dto: UpdateInvoiceStatusDTO): Promise<Invoice> {
    const cleanId = String(id);
    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find((i) => String(i.id) === cleanId);
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      return mockDelay(
        normalizeInvoice({ ...inv, ...dto, updated_at: new Date().toISOString() })
      );
    }
    const res = await axiosClient.patch<ApiResponse<Invoice> | Invoice>(`/invoices/${cleanId}/status`, dto);
    const raw = (res.data as ApiResponse<Invoice>)?.data ?? (res.data as Invoice);
    return normalizeInvoice(raw as Partial<Invoice> & Record<string, unknown>);
  },
};

export const invoice = {
  service: invoiceService,
};

export default invoiceService;
