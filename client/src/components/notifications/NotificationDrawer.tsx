"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  CheckCheck,
  Bell,
  BellOff,
  ExternalLink,
  CalendarClock,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { notificationService } from "@/services/notificationService";
import type { ReminderNotification } from "@/types/notification.type";
import {
  getNotificationMeta,
  getNotificationTargetRoute,
  formatRelativeTime,
} from "@/utils/notificationRoutes";
import { cn } from "@/utils/cn";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onItemRead?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onItemRead,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<ReminderNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications when drawer opens
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch recent 15 notifications
      const data = await notificationService.list({
        limit: 15,
      });
      setNotifications(data);
    } catch (err: any) {
      console.error("[NotificationDrawer] Error fetching notifications:", err);
      setError("Không thể tải thông báo. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
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

  // Counts
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  // Handle single notification click
  const handleItemClick = async (item: ReminderNotification) => {
    const id = item.notification_id ?? item.id;
    if (!item.is_read && id) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          String(n.notification_id ?? n.id) === String(id)
            ? { ...n, is_read: true }
            : n
        )
      );
      try {
        await notificationService.markAsRead(id);
        onItemRead?.();
      } catch (err) {
        console.error("[NotificationDrawer] Failed to mark as read:", err);
      }
    }

    onClose();
    const targetRoute = getNotificationTargetRoute(item, user?.role);
    router.push(targetRoute);
  };

  // Handle Mark All as Read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
      onItemRead?.();
    } catch (err) {
      console.error("[NotificationDrawer] Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300 ease-out"
        >
          {/* Header */}
          <div className="p-4 sm:px-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0EA5B7] flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-slate-800 flex items-center gap-2">
                    Thông báo
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500 text-white">
                        {unreadCount} mới
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isMarkingAll}
                    title="Đánh dấu tất cả đã đọc"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-[#0EA5B7] hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isMarkingAll ? (
                      <Loader2 size={13} className="animate-spin text-[#0EA5B7]" />
                    ) : (
                      <CheckCheck size={14} className="text-[#0EA5B7]" />
                    )}
                    <span>Đã đọc tất cả</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Tabs: All | Unread */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                  activeTab === "all"
                    ? "bg-white text-slate-800 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Tất cả</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    activeTab === "all" ? "bg-slate-100 text-slate-600" : "text-slate-400"
                  )}
                >
                  {notifications.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                  activeTab === "unread"
                    ? "bg-white text-slate-800 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Chưa đọc</span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-semibold">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">0</span>
                )}
              </button>
            </div>
          </div>

          {/* Body: Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 divide-opacity-60 overscroll-contain">
            {isLoading ? (
              // Skeleton loading states
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-100 flex gap-3 animate-pulse bg-slate-50/50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-5/6" />
                      <div className="h-2.5 bg-slate-200 rounded w-1/3 pt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                  <AlertCircle size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-3 px-3.5 py-1.5 bg-[#0EA5B7] text-white text-xs font-medium rounded-lg hover:bg-[#0c93a3] transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              // Empty state
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mb-3">
                  <BellOff size={28} />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {activeTab === "unread"
                    ? "Không có thông báo chưa đọc!"
                    : "Chưa có thông báo nào"}
                </p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {activeTab === "unread"
                    ? "Bạn đã cập nhật hết các nhắc lịch và thông báo mới nhất."
                    : "Các nhắc lịch khám, tiêm chủng và thanh toán sẽ xuất hiện ở đây."}
                </p>
              </div>
            ) : (
              // Actual notifications list
              filteredNotifications.map((item) => {
                const meta = getNotificationMeta(item.type);
                const isUnread = !item.is_read;

                return (
                  <div
                    key={item.notification_id ?? item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "group p-4 flex items-start gap-3.5 hover:bg-slate-50/90 cursor-pointer transition-all relative",
                      isUnread ? "bg-sky-50/40 hover:bg-sky-50/70" : "bg-white"
                    )}
                  >
                    {/* Unread dot indicator */}
                    {isUnread && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#0EA5B7] shadow-sm shadow-[#0EA5B7]/50 ring-2 ring-white" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        meta.iconBg
                      )}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                            meta.badgeClass
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {formatRelativeTime(item.created_at || item.scheduled_at)}
                        </span>
                      </div>

                      <h4
                        className={cn(
                          "text-xs leading-snug line-clamp-1 mb-1 transition-colors",
                          isUnread
                            ? "font-semibold text-slate-900 group-hover:text-[#0EA5B7]"
                            : "font-medium text-slate-700 group-hover:text-slate-900"
                        )}
                      >
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.content || item.message}
                      </p>

                      {/* Pet Tag if available */}
                      {item.pet_name && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="font-medium text-slate-600">
                            {item.pet_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-3 px-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
            <Link
              href="/reminders"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0EA5B7] font-medium py-1 px-2 rounded-lg hover:bg-white transition-colors"
            >
              <CalendarClock size={14} />
              <span>Nhắc lịch</span>
            </Link>

            <Link
              href="/notifications"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[#0EA5B7] hover:text-[#0c93a3] font-semibold py-1 px-2.5 rounded-lg hover:bg-sky-50 transition-colors"
            >
              <span>Xem tất cả</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
