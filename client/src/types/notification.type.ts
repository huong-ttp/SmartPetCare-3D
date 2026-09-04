// ============================================================
// NOTIFICATIONS entity types
// ============================================================

export type NotificationType =
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_completed"
  | "doctor_assigned"
  | "vaccination_reminder"
  | "invoice_created"
  | "payment_success"
  | "payment_failed"
  | "health_log_reminder"
  | "system";

export interface Notification {
  id: string;
  user_id: string;               // FK → User.id (người nhận)
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  /** ID của entity liên quan (appointment, invoice, ...) */
  reference_id?: string;
  reference_type?: "appointment" | "invoice" | "payment" | "vaccination";
  created_at: string;
}

export interface MarkReadDTO {
  notification_ids: string[];
}
