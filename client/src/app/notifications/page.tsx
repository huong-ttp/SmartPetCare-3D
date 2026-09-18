"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  RotateCw,
  Search,
  Filter,
  Calendar,
  Syringe,
  Stethoscope,
  CreditCard,
  Sparkles,
  Inbox,
  CheckCircle2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { notificationService } from "@/services/notificationService";
import type { ReminderNotification, NotificationType } from "@/types/notification.type";
import {
  getNotificationMeta,
  getNotificationTargetRoute,
  formatRelativeTime,
} from "@/utils/notificationRoutes";
import { cn } from "@/utils/cn";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<ReminderNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Fetch all notifications for user
  const fetchAllNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await notificationService.list();
      setNotifications(data);
    } catch (err: any) {
      console.error("[NotificationsPage] Error fetching notifications:", err);
      setError("Không thể tải danh sách thông báo. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllNotifications();
    }
  }, [user, fetchAllNotifications]);

  // Mark single item as read
  const handleMarkAsRead = async (item: ReminderNotification) => {
    const id = item.notification_id ?? item.id;
    if (!id || item.is_read) return;

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
    } catch (err) {
      console.error("[NotificationsPage] Failed to mark as read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    if (unreadCount === 0 || isMarkingAll) return;

    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error("[NotificationsPage] Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Navigate to target route
  const handleNavigate = (item: ReminderNotification) => {
    handleMarkAsRead(item);
    const target = getNotificationTargetRoute(item, user?.role);
    router.push(target);
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      // 1. Status filter
      if (statusFilter === "unread" && item.is_read) return false;
      if (statusFilter === "read" && !item.is_read) return false;

      // 2. Type filter
      if (typeFilter !== "all") {
        if (typeFilter === "appointment") {
          if (!item.type.startsWith("appointment")) return false;
        } else if (typeFilter === "vaccine") {
          if (!item.type.includes("vaccine")) return false;
        } else if (typeFilter === "checkup") {
          if (!item.type.includes("checkup")) return false;
        } else if (typeFilter === "payment") {
          if (!item.type.includes("payment") && !item.type.includes("invoice")) return false;
        } else if (typeFilter === "system") {
          if (item.type !== "system") return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const contentMatch = (item.content || item.message || "").toLowerCase().includes(q);
        const petMatch = item.pet_name?.toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !petMatch) return false;
      }

      return true;
    });
  }, [notifications, statusFilter, typeFilter, searchQuery]);

  // Statistics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = totalCount - unreadCount;
  const reminderCount = notifications.filter(
    (n) =>
      n.type.includes("reminder") ||
      n.type.includes("appointment") ||
      n.type.includes("vaccine") ||
      n.type.includes("checkup")
  ).length;

  // Pagination calculation
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, pageSize]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0EA5B7] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              <span>Trang chủ</span>
              <span>/</span>
              <span className="text-[#0EA5B7]">Trung tâm thông báo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Trung tâm thông báo
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500 text-white shadow-sm">
                  {unreadCount} mới
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi toàn bộ lịch hẹn, lịch tiêm chủng, thanh toán và thông báo hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/reminders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-[#0EA5B7] hover:text-[#0EA5B7] transition-all shadow-sm"
            >
              <CalendarClock size={15} />
              <span>Trung tâm nhắc lịch</span>
            </Link>

            <button
              onClick={() => fetchAllNotifications(true)}
              disabled={isRefreshing}
              title="Làm mới danh sách"
              className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <RotateCw size={16} className={isRefreshing ? "animate-spin text-[#0EA5B7]" : ""} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0EA5B7] hover:bg-[#0c93a3] transition-all shadow-sm shadow-[#0EA5B7]/20 disabled:opacity-50"
              >
                <CheckCheck size={16} />
                <span>{isMarkingAll ? "Đang xử lý..." : "Đánh dấu đã đọc tất cả"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Tổng thông báo</p>
              <p className="text-xl font-bold text-slate-800">{totalCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center shrink-0">
              <Inbox size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Chưa đọc</p>
              <p className="text-xl font-bold text-[#0EA5B7]">{unreadCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Đã đọc</p>
              <p className="text-xl font-bold text-slate-800">{readCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CalendarClock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Nhắc lịch khám & tiêm</p>
              <p className="text-xl font-bold text-purple-700">{reminderCount}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung, tên thú cưng..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0EA5B7] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Read/Unread Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Tất cả ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter("unread")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  statusFilter === "unread"
                    ? "bg-white text-[#0EA5B7] shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Chưa đọc ({unreadCount})
              </button>
              <button
                onClick={() => setStatusFilter("read")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  statusFilter === "read"
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Đã đọc ({readCount})
              </button>
            </div>
          </div>

          {/* Type / Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
              <Filter size={12} />
              Loại:
            </span>

            {[
              { key: "all", label: "Tất cả loại" },
              { key: "appointment", label: "Lịch hẹn khám", icon: Calendar },
              { key: "vaccine", label: "Tiêm phòng", icon: Syringe },
              { key: "checkup", label: "Tái khám", icon: Stethoscope },
              { key: "payment", label: "Thanh toán & Hóa đơn", icon: CreditCard },
              { key: "system", label: "Hệ thống", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = typeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border",
                    isActive
                      ? "bg-sky-50 text-[#0EA5B7] border-sky-200 font-semibold"
                      : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {Icon && <Icon size={13} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-[11px] text-rose-500 hover:underline shrink-0 ml-auto"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Notifications Content List */}
        <div className="space-y-3">
          {isLoading ? (
            // Skeleton shimmer
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4 animate-pulse"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error Card
            <div className="bg-white rounded-2xl p-8 border border-rose-100 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Bell size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{error}</h3>
              <p className="text-xs text-slate-400 mb-4">
                Đã xảy ra sự cố trong quá trình kết nối với máy chủ.
              </p>
              <button
                onClick={() => fetchAllNotifications()}
                className="px-4 py-2 bg-[#0EA5B7] text-white text-xs font-semibold rounded-xl hover:bg-[#0c93a3] transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-4">
                <Inbox size={32} />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                Không tìm thấy thông báo nào
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Không có kết quả nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại của bạn."
                  : "Hộp thư thông báo của bạn đang trống. Các cập nhật mới sẽ được gửi về đây."}
              </p>
              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            // Notification Cards
            paginatedList.map((item) => {
              const meta = getNotificationMeta(item.type);
              const isUnread = !item.is_read;
              const dateStr = item.created_at || item.scheduled_at;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "";

              return (
                <div
                  key={item.notification_id ?? item.id}
                  className={cn(
                    "group bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    isUnread
                      ? "border-sky-200 bg-sky-50/30 hover:border-sky-300 hover:shadow-md"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  )}
                >
                  {/* Unread Accent Border */}
                  {isUnread && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#0EA5B7] rounded-r-full" />
                  )}

                  <div className="flex items-start gap-3.5 flex-1 min-w-0 pl-1">
                    {/* Type Icon */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        meta.iconBg
                      )}
                    >
                      {meta.icon}
                    </div>

                    {/* Main Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                            meta.badgeClass
                          )}
                        >
                          {meta.label}
                        </span>

                        {item.pet_name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {item.pet_name}
                          </span>
                        )}

                        <span className="text-xs text-slate-400 ml-auto sm:ml-0">
                          {formatRelativeTime(dateStr)} ({formattedDate})
                        </span>
                      </div>

                      <h3
                        className={cn(
                          "text-sm font-semibold mb-1 transition-colors",
                          isUnread
                            ? "text-slate-900 group-hover:text-[#0EA5B7]"
                            : "text-slate-700 group-hover:text-slate-900"
                        )}
                      >
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        {item.content || item.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(item)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0EA5B7] hover:bg-sky-50 rounded-xl transition-colors"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}

                    <button
                      onClick={() => handleNavigate(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 group-hover:bg-[#0EA5B7] text-slate-700 group-hover:text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {filteredList.length > 0 && (
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Hiển thị{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min((currentPage - 1) * pageSize + 1, filteredList.length)}
                </span>{" "}
                đến{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * pageSize, filteredList.length)}
                </span>{" "}
                trong số{" "}
                <span className="font-semibold text-slate-800">{filteredList.length}</span> thông
                báo
              </span>

              <span className="text-slate-300">|</span>

              <div className="flex items-center gap-1">
                <span>Mỗi trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#0EA5B7]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                          currentPage === p
                            ? "bg-[#0EA5B7] text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
