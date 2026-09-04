// ============================================================
// PAYMENTS entity types
// Business rules:
//   - payment_method: cash | bank_transfer ONLY
//   - status: pending | success | failed
// ============================================================

/**
 * Chỉ 2 phương thức thanh toán hợp lệ.
 */
export type PaymentMethod = "cash" | "bank_transfer";

export type PaymentStatus = "pending" | "success" | "failed";

export interface Payment {
  id: string;
  invoice_id: string;           // FK → Invoice.id
  owner_id: string;             // FK → User.id (role: owner)
  amount: number;               // VND
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref?: string;     // mã tham chiếu (chuyển khoản)
  paid_at?: string;             // ISO 8601 khi status = success
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentDTO {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref?: string;
  notes?: string;
}

export interface UpdatePaymentStatusDTO {
  status: PaymentStatus;
  transaction_ref?: string;
  paid_at?: string;
}
