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
  payment_id?: number | string;
  invoice_id: string;           // FK → Invoice.id
  owner_id: string;             // FK → User.id (role: owner)
  amount: number;               // VND
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref?: string;     // mã tham chiếu (chuyển khoản)
  paid_at?: string;             // ISO 8601 khi status = success
  payment_date?: string;        // Thời điểm nộp thanh toán
  reject_reason?: string;       // Lý do từ chối nếu status = failed
  notes?: string;
  created_at: string;
  updated_at: string;

  // Joined fields từ admin list query
  owner_name?: string;
  owner_phone?: string;
  pet_id?: string | number;
  pet_name?: string;
  total_amount?: number;
  issued_date?: string;
}

export interface CreatePaymentDTO {
  invoice_id: string | number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref?: string;
  notes?: string;
}

export interface CreateCashPaymentDTO {
  invoice_id: number | string;
  amount: number;
}

export interface UpdatePaymentStatusDTO {
  status: PaymentStatus;
  transaction_ref?: string;
  paid_at?: string;
  reason?: string;
}

export interface AdminPaymentFilterParams {
  status?: PaymentStatus;
  search?: string;
  method?: PaymentMethod;
  page?: number;
  limit?: number;
}

export interface AdminPaymentListResult {
  items: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

