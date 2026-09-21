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
  | "payment"
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
  offset?: number;
  page?: number;
  search?: string;
}

export interface MarkReadDTO {
  notification_ids?: string[] | number[];
}

export interface AdminNotificationItem {
  notification_id: number | string;
  id?: number | string;
  user_id: number | string;
  full_name?: string;
  user_email?: string;
  pet_id?: number | string | null;
  pet_name?: string | null;
  type: NotificationType;
  title: string;
  content: string;
  message?: string;
  is_read: boolean;
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface AdminNotificationFilterParams {
  search?: string;
  type?: string;
  userId?: number | string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminNotificationListResult {
  items: AdminNotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SendSystemNotificationDTO {
  target: "all" | "role" | "user";
  role?: "admin" | "doctor" | "owner";
  user_id?: number | string;
  title: string;
  content: string;
  type?: "system";
}

