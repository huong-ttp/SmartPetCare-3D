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

export interface InvoicePaymentInfo {
  payment_id: number | string;
  invoice_id: number | string;
  amount: number;
  payment_method: "cash" | "bank_transfer" | string;
  payment_date: string;
  transaction_ref?: string | null;
  status: "pending" | "success" | "failed" | string;
}

export interface InvoiceItem {
  id?: string;
  item_id?: number | string;
  invoice_id: string | number;
  service_id?: string | number;
  service_name?: string;
  service_description?: string;
  description?: string;
  quantity: number;
  unit_price: number; // VND
  subtotal: number;   // = quantity * unit_price
}

export interface Invoice {
  id: string;
  invoice_id?: number | string;
  appointment_id: string | number;
  owner_id: string | number;
  status: InvoiceStatus;
  total_amount: number; // VND
  issued_at?: string;
  issued_date?: string;
  due_date?: string;
  notes?: string;

  // Joined Pet details
  pet_id?: number | string;
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  pet_weight?: number;

  // Joined Appointment & Service details
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  service_name?: string;

  // Joined Owner details
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;

  // Items & Payment
  items?: InvoiceItem[];
  payment?: InvoicePaymentInfo | null;

  created_at: string;
  updated_at?: string;
}

export interface InvoiceFilterDTO {
  status?: InvoiceStatus | "all" | string;
  owner?: string;
}

export interface UpdateInvoiceStatusDTO {
  status: InvoiceStatus;
}

