// ============================================================
// INVOICES + INVOICE_ITEMS entity types
// Business rules:
//   - Invoice tự sinh khi Appointment → status: completed
//   - status: unpaid | paid | cancelled (KHÔNG có partially_paid)
// ============================================================

/**
 * KHÔNG có "partially_paid".
 */
export type InvoiceStatus = "unpaid" | "paid" | "cancelled";

export interface Invoice {
  id: string;
  appointment_id: string; // FK → Appointment.id (1-1)
  owner_id: string;       // FK → User.id (role: owner)
  status: InvoiceStatus;
  total_amount: number;   // VND — tổng từ InvoiceItem[]
  issued_at: string;      // ISO 8601 — tự sinh khi appointment completed
  due_date?: string;      // ISO date
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;   // FK → Invoice.id
  service_id?: string;  // FK → Service.id (nếu là dịch vụ)
  description: string;
  quantity: number;
  unit_price: number;   // VND
  subtotal: number;     // = quantity * unit_price
}

export interface UpdateInvoiceStatusDTO {
  status: InvoiceStatus;
}
