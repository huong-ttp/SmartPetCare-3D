import React from "react";
import {
  Calendar,
  Syringe,
  Stethoscope,
  CreditCard,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react";
import type { NotificationType, ReminderNotification } from "@/types/notification.type";

export interface NotificationMeta {
  label: string;
  badgeClass: string;
  iconClass: string;
  iconBg: string;
  icon: React.ReactNode;
}

/**
 * Lấy cấu hình hiển thị (icon, màu sắc, tên loại) theo type của thông báo
 */
export function getNotificationMeta(type: NotificationType | string): NotificationMeta {
  switch (type) {
    case "appointment_reminder":
      return {
        label: "Nhắc lịch khám",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        iconClass: "text-blue-600",
        iconBg: "bg-blue-100/80",
        icon: <Calendar className="w-4 h-4 text-blue-600" />,
      };

    case "appointment_confirmed":
      return {
        label: "Lịch hẹn đã xác nhận",
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
        iconClass: "text-teal-600",
        iconBg: "bg-teal-100/80",
        icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,
      };

    case "appointment_cancelled":
      return {
        label: "Lịch hẹn đã hủy",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        iconClass: "text-rose-600",
        iconBg: "bg-rose-100/80",
        icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      };

    case "vaccine_reminder":
    case "vaccination_reminder":
      return {
        label: "Nhắc tiêm phòng",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconClass: "text-emerald-600",
        iconBg: "bg-emerald-100/80",
        icon: <Syringe className="w-4 h-4 text-emerald-600" />,
      };

    case "checkup_reminder":
      return {
        label: "Nhắc tái khám",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        iconClass: "text-purple-600",
        iconBg: "bg-purple-100/80",
        icon: <Stethoscope className="w-4 h-4 text-purple-600" />,
      };

    case "payment":
    case "payment_success":
    case "invoice_created":
      return {
        label: "Thanh toán & Hóa đơn",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        iconClass: "text-amber-600",
        iconBg: "bg-amber-100/80",
        icon: <CreditCard className="w-4 h-4 text-amber-600" />,
      };

    case "doctor_assigned":
      return {
        label: "Bác sĩ phụ trách",
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
        iconClass: "text-cyan-600",
        iconBg: "bg-cyan-100/80",
        icon: <UserCheck className="w-4 h-4 text-cyan-600" />,
      };

    case "health_log_reminder":
      return {
        label: "Nhật ký sức khỏe",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        iconClass: "text-indigo-600",
        iconBg: "bg-indigo-100/80",
        icon: <FileText className="w-4 h-4 text-indigo-600" />,
      };

    case "system":
    default:
      return {
        label: "Hệ thống",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        iconClass: "text-slate-600",
        iconBg: "bg-slate-200/70",
        icon: <Sparkles className="w-4 h-4 text-slate-600" />,
      };
  }
}

/**
 * Xác định route đích dựa trên thông báo và role của người dùng hiện tại
 */
export function getNotificationTargetRoute(
  notification: Partial<ReminderNotification>,
  userRole?: string
): string {
  const type = notification.type || "";
  const petId = notification.pet_id;

  // 1. Role Bác sĩ (Doctor)
  if (userRole === "doctor") {
    if (type.startsWith("appointment")) {
      return "/doctor/schedule";
    }
    if (type.includes("vaccine") || type.includes("checkup") || type.includes("health_log")) {
      return "/doctor/medical-records";
    }
    return "/notifications";
  }

  // 2. Role Admin
  if (userRole === "admin") {
    if (type.startsWith("appointment")) {
      return "/admin/appointments";
    }
    if (type.includes("payment") || type.includes("invoice")) {
      return "/admin/dashboard";
    }
    return "/notifications";
  }

  // 3. Role Chủ nuôi (Owner) hoặc mặc định
  if (type.startsWith("appointment")) {
    return "/appointments";
  }
  if (type.includes("vaccine")) {
    return petId ? `/pets/${petId}/vaccinations` : "/reminders";
  }
  if (type.includes("checkup")) {
    return petId ? `/pets/${petId}` : "/reminders";
  }
  if (type.includes("payment") || type.includes("invoice")) {
    return "/invoices";
  }
  if (type.includes("health_log")) {
    return petId ? `/pets/${petId}` : "/pets";
  }

  // Mặc định dẫn tới trang chi tiết lịch sử
  return "/notifications";
}

/**
 * Định dạng thời gian tương đối bằng tiếng Việt
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Vừa xong";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Tương lai gần hoặc vừa tạo
  if (diffMs < 60000 && diffMs >= 0) {
    return "Vừa xong";
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (diffDays >= 2) {
    return `${diffDays} ngày trước`;
  }

  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return `Hôm qua lúc ${timeStr}`;
  }

  if (diffHours >= 1) {
    return `${diffHours} giờ trước`;
  }

  if (diffMin >= 1) {
    return `${diffMin} phút trước`;
  }

  return "Vừa xong";
}
