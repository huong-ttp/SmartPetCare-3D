import axiosClient from "@/lib/axiosClient";
import type {
  Invoice,
  InvoiceItem,
  InvoiceFilterDTO,
  UpdateInvoiceStatusDTO,
} from "@/types/invoice.type";
import { MOCK_INVOICES, MOCK_INVOICE_ITEMS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function normalizeInvoice(raw: any): Invoice {
  const cleanId = String(raw.invoice_id ?? raw.id ?? "");
  const items: InvoiceItem[] = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        id: String(it.item_id ?? it.id ?? ""),
        item_id: it.item_id ?? it.id,
        invoice_id: cleanId,
        service_id: it.service_id,
        service_name: it.service_name || it.description || "Dịch vụ thú y",
        service_description: it.service_description,
        description: it.description || it.service_name || "Dịch vụ y tế",
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        subtotal: Number(it.subtotal || 0),
      }))
    : [];

  return {
    id: cleanId,
    invoice_id: raw.invoice_id ?? raw.id,
    appointment_id: String(raw.appointment_id ?? ""),
    owner_id: String(raw.owner_id ?? ""),
    status: raw.status || "unpaid",
    total_amount: Number(raw.total_amount ?? 0),
    issued_at: raw.issued_at || raw.issued_date || raw.created_at,
    issued_date: raw.issued_date || raw.issued_at,
    due_date: raw.due_date,
    notes: raw.notes,

    pet_id: raw.pet_id,
    pet_name: raw.pet_name,
    pet_species: raw.pet_species,
    pet_breed: raw.pet_breed,
    pet_weight: raw.pet_weight ? Number(raw.pet_weight) : undefined,

    appointment_date: raw.appointment_date,
    start_time: raw.start_time,
    end_time: raw.end_time,
    reason: raw.reason,
    service_name: raw.service_name,

    owner_name: raw.owner_name,
    owner_phone: raw.owner_phone,
    owner_email: raw.owner_email,

    items,
    payment: raw.payment
      ? {
          payment_id: raw.payment.payment_id,
          invoice_id: raw.payment.invoice_id,
          amount: Number(raw.payment.amount || 0),
          payment_method: raw.payment.payment_method || "cash",
          payment_date: raw.payment.payment_date || raw.payment.created_at,
          transaction_ref: raw.payment.transaction_ref,
          status: raw.payment.status || "success",
        }
      : null,

    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at,
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

    try {
      const params: any = {};
      if (filter?.status && filter.status !== "all") {
        params.status = filter.status;
      }
      const res = await axiosClient.get<any>("/invoices", { params });
      const raw = res.data;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.data)) list = raw.data;
      else if (raw && Array.isArray(raw.invoices)) list = raw.invoices;
      return list.map(normalizeInvoice);
    } catch (err) {
      console.warn("[invoiceService] Backend fetch failed, fallback to mock:", err);
      return mockDelay(MOCK_INVOICES.map(normalizeInvoice));
    }
  },

  /** Alias: invoice.service.list({owner: me}) */
  async list(filter?: InvoiceFilterDTO): Promise<Invoice[]> {
    return invoiceService.getMyInvoices(filter);
  },

  /** Lấy chi tiết hóa đơn theo ID */
  async getById(id: string | number): Promise<Invoice> {
    const cleanId = String(id);
    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === cleanId || String(i.invoice_id) === cleanId
      );
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      return mockDelay(normalizeInvoice(inv));
    }

    const res = await axiosClient.get<any>(`/invoices/${cleanId}`);
    const raw = res.data?.data ?? res.data;
    if (!raw) throw new Error("Hóa đơn không tồn tại.");
    return normalizeInvoice(raw);
  },

  /** Alias: getInvoiceById */
  async getInvoiceById(id: string | number): Promise<Invoice> {
    return invoiceService.getById(id);
  },

  /** Lấy danh sách items của hóa đơn */
  async getItemsByInvoiceId(invoiceId: string | number): Promise<InvoiceItem[]> {
    const cleanId = String(invoiceId);
    if (USE_MOCK) {
      return mockDelay(
        MOCK_INVOICE_ITEMS.filter((i) => String(i.invoice_id) === cleanId)
      );
    }
    const res = await axiosClient.get<any>(`/invoices/${cleanId}/items`);
    const raw = res.data?.data ?? res.data;
    return Array.isArray(raw) ? raw : [];
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
    const res = await axiosClient.patch<any>(`/invoices/${cleanId}/status`, dto);
    const raw = res.data?.data ?? res.data;
    return normalizeInvoice(raw);
  },
};

export const invoice = {
  service: invoiceService,
};

export default invoiceService;

