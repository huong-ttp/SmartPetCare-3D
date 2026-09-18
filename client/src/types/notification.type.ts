// ============================================================
// NOTIFICATIONS entity types
// ============================================================

export type NotificationType =
  | "appointment_reminder"
  | "vaccine_reminder"
  | "checkup_reminder"
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

export type ReminderType =
  | "appointment_reminder"
  | "vaccine_reminder"
  | "checkup_reminder";

export interface Notification {
  id: string;
  user_id: string;               // FK → User.id (người nhận)
  type: NotificationType;
  title: string;
  message: string;
  content?: string;
  is_read: boolean;
  /** ID của entity liên quan (appointment, invoice, ...) */
  reference_id?: string;
  reference_type?: "appointment" | "invoice" | "payment" | "vaccination";
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  pet_id?: number | string | null;
  pet_name?: string | null;
  pet_species?: string | null;
  pet_avatar?: string | null;
}

export interface ReminderNotification {
  notification_id: number | string;
  id?: number | string;
  user_id?: number | string;
  pet_id?: number | string | null;
  pet_name?: string | null;
  pet_species?: string | null;
  pet_avatar?: string | null;
  type: NotificationType;
  title: string;
  content: string;
  message?: string;
  is_read: boolean;
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  reference_id?: string;
  reference_type?: "appointment" | "invoice" | "payment" | "vaccination";
}

export interface NotificationFilterParams {
  user?: any;
  type?: string | string[];
  unread?: boolean;
  limit?: number;
}

export interface MarkReadDTO {
  notification_ids?: string[] | number[];
}

