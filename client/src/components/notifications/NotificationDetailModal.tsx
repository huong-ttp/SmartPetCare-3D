"use client";

import React, { useEffect } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarClock,
  ArrowRight,
  ExternalLink,
  PawPrint,
  FileText,
  AlertCircle,
  Bell,
  CheckCheck,
} from "lucide-react";
import type { ReminderNotification } from "@/types/notification.type";
import NotificationTypeBadge from "@/components/admin/notifications/NotificationTypeBadge";
import {
  getNotificationMeta,
  getNotificationTargetRoute,
  formatRelativeTime,
} from "@/utils/notificationRoutes";
import { cn } from "@/utils/cn";

export interface NotificationDetailModalProps {
  notification: ReminderNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (notification: ReminderNotification) => void;
  onNavigate?: (targetRoute: string, notification: ReminderNotification) => void;
  userRole?: string;
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    return "-";
  }
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onNavigate,
  userRole,
}: NotificationDetailModalProps) {
  // Đóng modal khi ấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Khóa scroll body khi modal mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !notification) return null;

  const meta = getNotificationMeta(notification.type);
  const targetRoute = getNotificationTargetRoute(notification, userRole);
  const isTargetRouteSpecific =
    targetRoute && targetRoute !== "/notifications" && targetRoute !== "";

  const dateStr = notification.created_at || notification.sent_at;
  const relativeTime = formatRelativeTime(dateStr);
  const fullDateTime = formatFullDate(dateStr);

  const handleActionClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification);
    }
    onClose();
    if (onNavigate) {
      onNavigate(targetRoute, notification);
    }
  };

  const handleMarkReadOnly = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-50/80 via-teal-50/40 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0",
                meta.iconBg
              )}
            >
              {meta.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading">
                Chi tiết thông báo
              </h3>
              <p className="text-[11px] text-slate-400">
                Mã: #{notification.notification_id || notification.id || "SPC"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng bảng chi tiết"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Badge & Read Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NotificationTypeBadge type={notification.type} />

            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                notification.is_read
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-sky-50 text-[#0EA5B7] border-sky-200"
              )}
            >
              {notification.is_read ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Đã đọc</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#0EA5B7] animate-pulse" />
                  <span>Mới nhận</span>
                </>
              )}
            </span>
          </div>

          {/* Title */}
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {notification.title}
            </h4>
          </div>

          {/* Related Pet Card (if available) */}
          {notification.pet_name && (
            <div className="p-3 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <PawPrint size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                  Thú cưng liên quan
                </span>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {notification.pet_name}
                </p>
                {notification.pet_species && (
                  <p className="text-xs text-slate-500 truncate">
                    Loài: {notification.pet_species}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Full Notification Content */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={13} />
              Nội dung thông báo
            </label>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
              {notification.content || notification.message || "Không có nội dung chi tiết."}
            </p>
          </div>

          {/* Timing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Created / Sent Time */}
            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Clock size={12} /> Thời gian nhận
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {fullDateTime}
              </p>
              {relativeTime && (
                <p className="text-[10px] text-slate-400 font-medium">
                  {relativeTime}
                </p>
              )}
            </div>

            {/* Scheduled Time (if available) */}
            {notification.scheduled_at ? (
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
                <span className="text-[11px] font-medium text-sky-600 flex items-center gap-1.5">
                  <CalendarClock size={12} /> Thời gian lên lịch
                </span>
                <p className="text-xs font-semibold text-sky-900">
                  {formatFullDate(notification.scheduled_at)}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} /> Hình thức
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  Thông báo ứng dụng
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {!notification.is_read && onMarkAsRead && (
              <button
                type="button"
                onClick={handleMarkReadOnly}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#0EA5B7] hover:bg-sky-50 rounded-xl transition-colors cursor-pointer"
              >
                <CheckCheck size={14} className="text-[#0EA5B7]" />
                <span>Đánh dấu đã đọc</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {isTargetRouteSpecific && (
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0EA5B7] hover:bg-[#0c93a3] rounded-xl transition-all shadow-sm shadow-[#0EA5B7]/25 cursor-pointer"
              >
                <span>Xem trang liên quan</span>
                <ExternalLink size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
