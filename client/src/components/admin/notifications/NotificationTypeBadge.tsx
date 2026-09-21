import React from "react";
import {
  Bell,
  Calendar,
  Syringe,
  Stethoscope,
  CreditCard,
  Receipt,
  CheckCircle2,
  XCircle,
  Activity,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { NotificationType } from "@/types/notification.type";
import { cn } from "@/utils/cn";

interface NotificationTypeBadgeProps {
  type: NotificationType | string;
  className?: string;
  showIcon?: boolean;
}

interface TypeConfig {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeClass: string;
}

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  system: {
    label: "Hệ thống",
    icon: Sparkles,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80 ring-purple-500/20",
  },
  appointment_reminder: {
    label: "Nhắc hẹn khám",
    icon: Calendar,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 ring-sky-500/20",
  },
  appointment_confirmed: {
    label: "Xác nhận lịch",
    icon: CheckCircle2,
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200/80 ring-teal-500/20",
  },
  appointment_cancelled: {
    label: "Hủy lịch hẹn",
    icon: XCircle,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/20",
  },
  appointment_completed: {
    label: "Hoàn tất khám",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/20",
  },
  doctor_assigned: {
    label: "Phân công BS",
    icon: UserCheck,
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80 ring-indigo-500/20",
  },
  vaccine_reminder: {
    label: "Nhắc tiêm phòng",
    icon: Syringe,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/20",
  },
  vaccination_reminder: {
    label: "Nhắc tiêm chủng",
    icon: Syringe,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/20",
  },
  checkup_reminder: {
    label: "Nhắc tái khám",
    icon: Stethoscope,
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200/80 ring-cyan-500/20",
  },
  payment: {
    label: "Thanh toán",
    icon: CreditCard,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/20",
  },
  invoice_created: {
    label: "Hóa đơn mới",
    icon: Receipt,
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200/80 ring-violet-500/20",
  },
  payment_success: {
    label: "Thanh toán OK",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/20",
  },
  payment_failed: {
    label: "Thanh toán lỗi",
    icon: XCircle,
    badgeClass: "bg-red-50 text-red-700 border-red-200/80 ring-red-500/20",
  },
  health_log_reminder: {
    label: "Nhật ký SK",
    icon: Activity,
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200/80 ring-orange-500/20",
  },
};

export default function NotificationTypeBadge({
  type,
  className,
  showIcon = true,
}: NotificationTypeBadgeProps) {
  const config = TYPE_CONFIGS[type] || {
    label: type || "Thông báo",
    icon: Bell,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-400/20",
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors",
        config.badgeClass,
        className
      )}
    >
      {showIcon && <Icon size={13} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
