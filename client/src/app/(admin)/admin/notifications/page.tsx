"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  BellRing,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Calendar,
  User as UserIcon,
  Dog,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Mail,
  Send,
  Layers,
} from "lucide-react";
import { admin } from "@/services/adminService";
import { adminService } from "@/services/adminService";
import {
  AdminNotificationItem,
  AdminNotificationFilterParams,
  NotificationType,
} from "@/types/notification.type";
import { User as UserEntity } from "@/types/user.type";
import { useToast } from "@/components/ui/Toast";
import NotificationTypeBadge from "@/components/admin/notifications/NotificationTypeBadge";
import SendSystemNotificationModal from "@/components/admin/notifications/SendSystemNotificationModal";
import NotificationDetailModal from "@/components/admin/notifications/NotificationDetailModal";
import { cn } from "@/utils/cn";

function formatDate(dateStr?: string | null) {
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
    }).format(d);
  } catch {
    return "-";
  }
}

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return "";
  } catch {
    return "";
  }
}

export default function AdminNotificationsPage() {
  const toast = useToast();

  // Data & UX States
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Users list for recipient filter dropdown
  const [userOptions, setUserOptions] = useState<UserEntity[]>([]);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotificationItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Stats calculation
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    system: 0,
    today: 0,
  });

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load user options for filter
  useEffect(() => {
    async function loadUserOptions() {
      try {
        const res = await adminService.listUsers({ limit: 100 });
        setUserOptions(res.items || []);
      } catch (err) {
        console.warn("Could not load user options:", err);
      }
    }
    loadUserOptions();
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMsg(null);

      try {
        const filters: AdminNotificationFilterParams = {
          search: debouncedSearch || undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          userId: userFilter !== "all" ? userFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const res = await admin.service.listNotifications(filters);
        const items = res.items || [];
        setNotifications(items);

        if (res.pagination) {
          setPagination(res.pagination);
        }

        // Calculate quick stats from loaded / overview items
        const todayStr = new Date().toISOString().split("T")[0];
        const unreadCount = items.filter((n) => !n.is_read).length;
        const systemCount = items.filter((n) => n.type === "system").length;
        const todayCount = items.filter(
          (n) => n.created_at && n.created_at.startsWith(todayStr)
        ).length;

        setStats({
          total: res.pagination?.total ?? items.length,
          unread: unreadCount,
          system: systemCount,
          today: todayCount,
        });
      } catch (err: any) {
        console.error("Failed to load notifications:", err);
        setErrorMsg(
          err?.response?.data?.message ||
            "Không thể tải danh sách thông báo hệ thống. Vui lòng thử lại sau."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      debouncedSearch,
      typeFilter,
      userFilter,
      fromDate,
      toDate,
      pagination.page,
      pagination.limit,
    ]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setTypeFilter("all");
    setUserFilter("all");
    setFromDate("");
    setToDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const isFilterActive = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      typeFilter !== "all" ||
      userFilter !== "all" ||
      Boolean(fromDate) ||
      Boolean(toDate)
    );
  }, [searchQuery, typeFilter, userFilter, fromDate, toDate]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <BellRing size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight font-heading">
                Quản lý thông báo hệ thống
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem toàn bộ thông báo đã gửi trong hệ thống và gửi thông báo in-app tới người dùng
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-purple-600")} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Gửi thông báo hệ thống</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Tổng thông báo</span>
            <span className="text-2xl font-extrabold text-slate-800 font-heading mt-0.5 block">
              {pagination.total}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Layers size={18} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Chưa đọc (trang này)</span>
            <span className="text-2xl font-extrabold text-amber-600 font-heading mt-0.5 block">
              {stats.unread}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Hệ thống (trang này)</span>
            <span className="text-2xl font-extrabold text-purple-600 font-heading mt-0.5 block">
              {stats.system}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Hôm nay (trang này)</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-heading mt-0.5 block">
              {stats.today}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo người nhận, email, tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 transition-all"
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

          {/* Filter by Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">Tất cả loại thông báo</option>
              <option value="system">Hệ thống (system)</option>
              <option value="appointment_reminder">Nhắc hẹn khám</option>
              <option value="vaccine_reminder">Nhắc tiêm phòng</option>
              <option value="checkup_reminder">Nhắc tái khám</option>
              <option value="payment">Thanh toán</option>
              <option value="invoice_created">Hóa đơn mới</option>
              <option value="appointment_confirmed">Xác nhận lịch</option>
              <option value="appointment_cancelled">Hủy lịch hẹn</option>
              <option value="appointment_completed">Hoàn tất khám</option>
            </select>
          </div>

          {/* Filter by User */}
          <div>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">Tất cả người nhận</option>
              {userOptions.map((u) => {
                const uId = String(u.id || u.user_id);
                return (
                  <option key={uId} value={uId}>
                    {u.full_name} ({u.role})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              title="Từ ngày"
              className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white text-slate-700"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              title="Đến ngày"
              className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-white text-slate-700"
            />
          </div>
        </div>

        {/* Active filter tags & reset */}
        {isFilterActive && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">
              Đang áp dụng bộ lọc tùy chỉnh
            </span>
            <button
              onClick={handleResetFilters}
              className="text-purple-600 hover:text-purple-700 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              <X size={12} /> Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchNotifications(true)}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Người nhận</th>
                <th className="px-4 py-3.5">Thú cưng</th>
                <th className="px-4 py-3.5">Loại thông báo</th>
                <th className="px-5 py-3.5">Tiêu đề & Nội dung</th>
                <th className="px-4 py-3.5">Thời gian gửi</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton_${idx}`} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3 bg-slate-200 rounded-sm" />
                          <div className="w-32 h-2.5 bg-slate-100 rounded-sm" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-16 h-3 bg-slate-200 rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-20 h-5 bg-slate-200 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-48 h-3 bg-slate-200 rounded-sm mb-1" />
                      <div className="w-64 h-2.5 bg-slate-100 rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-20 h-3 bg-slate-200 rounded-sm" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="w-16 h-5 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : notifications.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-xs">
                        <Inbox size={28} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          Không tìm thấy thông báo nào
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {isFilterActive
                            ? "Không có bản ghi nào khớp với điều kiện lọc. Hãy thử làm mới hoặc xóa bộ lọc."
                            : "Hệ thống chưa có thông báo nào được lưu lại."}
                        </p>
                      </div>
                      {isFilterActive ? (
                        <button
                          onClick={handleResetFilters}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsSendModalOpen(true)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          + Gửi thông báo đầu tiên
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                notifications.map((item) => {
                  const relativeTime = formatRelativeTime(item.sent_at || item.created_at);
                  return (
                    <tr
                      key={String(item.notification_id || item.id)}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedNotification(item);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {/* Recipient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.full_name ? item.full_name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                              {item.full_name || `User #${item.user_id}`}
                            </span>
                            {item.user_email && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                                {item.user_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Pet */}
                      <td className="px-4 py-3.5">
                        {item.pet_name ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Dog size={14} className="text-purple-500 shrink-0" />
                            <span className="font-medium truncate max-w-[100px]">
                              {item.pet_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-light">-</span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <NotificationTypeBadge type={item.type} />
                      </td>

                      {/* Title & Preview Content */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 block truncate group-hover:text-purple-600 transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate line-clamp-1">
                            {item.content || item.message || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Sent at */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-slate-700 font-medium block">
                            {formatDate(item.sent_at || item.created_at)}
                          </span>
                          {relativeTime && (
                            <span className="text-[10px] text-slate-400 block">
                              {relativeTime}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Is Read status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            item.is_read
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {item.is_read ? (
                            <>
                              <CheckCircle2 size={11} /> Đã đọc
                            </>
                          ) : (
                            <>
                              <AlertCircle size={11} /> Chưa đọc
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action */}
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setSelectedNotification(item);
                            setIsDetailModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && notifications.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Trang <span className="font-bold text-slate-800">{pagination.page}</span> /{" "}
                <span className="font-bold text-slate-800">{pagination.totalPages || 1}</span> (Tổng{" "}
                <span className="font-bold text-purple-600">{pagination.total}</span> thông báo)
              </span>

              {/* Items per page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Hiển thị:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-purple-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                disabled={pagination.page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">
                {pagination.page}
              </span>

              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.totalPages }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Send System Notification Modal */}
      <SendSystemNotificationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={() => {
          fetchNotifications(false);
        }}
      />

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedNotification(null);
        }}
      />
    </div>
  );
}
