"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellRing,
  Calendar,
  Syringe,
  Stethoscope,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  CheckCheck,
  Dog,
  Cat,
  Sparkles,
  ArrowRight,
  CalendarClock,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { notificationService } from "@/services/notificationService";
import type { ReminderNotification } from "@/types/notification.type";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabKey = "all" | "appointment" | "vaccine" | "checkup";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  emoji: string;
  types?: string[];
}

const TABS: TabItem[] = [
  {
    key: "all",
    label: "Tất cả",
    icon: <BellRing size={16} />,
    emoji: "🔔",
  },
  {
    key: "appointment",
    label: "Lịch hẹn",
    icon: <Calendar size={16} />,
    emoji: "📅",
    types: ["appointment_reminder"],
  },
  {
    key: "vaccine",
    label: "Tiêm chủng",
    icon: <Syringe size={16} />,
    emoji: "💉",
    types: ["vaccine_reminder", "vaccination_reminder"],
  },
  {
    key: "checkup",
    label: "Tái khám",
    icon: <Stethoscope size={16} />,
    emoji: "🩺",
    types: ["checkup_reminder"],
  },
];

// ─── Helpers: Time formatting ────────────────────────────────────────────────

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${mins}, ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function getRelativeTimeLabel(dateStr?: string | null): { text: string; isUrgent?: boolean; isPast?: boolean } {
  if (!dateStr) return { text: "" };
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return { text: "" };
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: "Hôm nay", isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: "Ngày mai", isUrgent: true };
    }
    if (diffDays === -1) {
      return { text: "Hôm qua", isPast: true };
    }
    if (diffDays > 1 && diffDays <= 30) {
      return { text: `Còn ${diffDays} ngày`, isUrgent: diffDays <= 3 };
    }
    if (diffDays > 30) {
      return { text: "Sắp tới" };
    }
    if (diffDays < -1) {
      return { text: `${Math.abs(diffDays)} ngày trước`, isPast: true };
    }
    return { text: "" };
  } catch {
    return { text: "" };
  }
}

// ─── Helper: Type icon & theme ───────────────────────────────────────────────

function getReminderTypeMeta(type: string) {
  switch (type) {
    case "vaccine_reminder":
    case "vaccination_reminder":
      return {
        label: "Tiêm chủng",
        emoji: "💉",
        icon: <Syringe className="w-5 h-5" />,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-100 text-emerald-600",
        accentBorder: "border-l-emerald-500",
        actionLabel: "Xem sổ tiêm chủng",
      };
    case "checkup_reminder":
      return {
        label: "Tái khám",
        emoji: "🩺",
        icon: <Stethoscope className="w-5 h-5" />,
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
        iconBg: "bg-purple-100 text-purple-600",
        accentBorder: "border-l-purple-500",
        actionLabel: "Xem hồ sơ bệnh án",
      };
    case "appointment_reminder":
    default:
      return {
        label: "Lịch hẹn khám",
        emoji: "📅",
        icon: <Calendar className="w-5 h-5" />,
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
        iconBg: "bg-sky-100 text-sky-600",
        accentBorder: "border-l-[#0EA5B7]",
        actionLabel: "Xem lịch hẹn",
      };
  }
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function ReminderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-slate-100 rounded-md" />
            <div className="w-36 h-3 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="w-20 h-6 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="w-3/4 h-5 bg-slate-100 rounded-md" />
        <div className="w-full h-4 bg-slate-100 rounded-md" />
        <div className="w-2/3 h-4 bg-slate-100 rounded-md" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="w-32 h-4 bg-slate-100 rounded-md" />
        <div className="w-24 h-8 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReminderCenterPage() {
  const router = useRouter();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [reminders, setReminders] = useState<ReminderNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterReadStatus, setFilterReadStatus] = useState<"all" | "unread" | "read">("all");
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  // ─── Fetch Reminders ───────────────────────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // API call: notification.service.list({ type: ['appointment_reminder','vaccine_reminder','checkup_reminder'] })
      const data = await notificationService.list({
        type: [
          "appointment_reminder",
          "vaccine_reminder",
          "vaccination_reminder",
          "checkup_reminder",
        ],
      });
      setReminders(data);
    } catch (err: any) {
      console.error("[ReminderCenter] Error loading reminders:", err);
      setError("Không thể tải danh sách nhắc lịch. Vui lòng thử lại sau.");
      showToastError("Lỗi tải danh sách nhắc lịch.");
    } finally {
      setIsLoading(false);
    }
  }, [showToastError]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ─── Counts per Tab ────────────────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, { total: number; unread: number }> = {
      all: { total: reminders.length, unread: reminders.filter((r) => !r.is_read).length },
      appointment: { total: 0, unread: 0 },
      vaccine: { total: 0, unread: 0 },
      checkup: { total: 0, unread: 0 },
    };

    reminders.forEach((r) => {
      if (r.type === "appointment_reminder") {
        counts.appointment.total++;
        if (!r.is_read) counts.appointment.unread++;
      } else if (r.type === "vaccine_reminder" || r.type === "vaccination_reminder") {
        counts.vaccine.total++;
        if (!r.is_read) counts.vaccine.unread++;
      } else if (r.type === "checkup_reminder") {
        counts.checkup.total++;
        if (!r.is_read) counts.checkup.unread++;
      }
    });

    return counts;
  }, [reminders]);

  // ─── Filtered Reminders ────────────────────────────────────────────────────
  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      // Tab filter
      if (activeTab === "appointment" && item.type !== "appointment_reminder") {
        return false;
      }
      if (
        activeTab === "vaccine" &&
        item.type !== "vaccine_reminder" &&
        item.type !== "vaccination_reminder"
      ) {
        return false;
      }
      if (activeTab === "checkup" && item.type !== "checkup_reminder") {
        return false;
      }

      // Read status filter
      if (filterReadStatus === "unread" && item.is_read) return false;
      if (filterReadStatus === "read" && !item.is_read) return false;

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchContent = (item.content || item.message || "")
          .toLowerCase()
          .includes(q);
        const matchPet = item.pet_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchPet) return false;
      }

      return true;
    });
  }, [reminders, activeTab, filterReadStatus, searchQuery]);

  // ─── Mark One as Read & Navigate ───────────────────────────────────────────
  const handleReminderClick = async (item: ReminderNotification) => {
    const id = item.notification_id || item.id;

    // Optimistic read status update
    if (!item.is_read && id) {
      setReminders((prev) =>
        prev.map((r) =>
          (r.notification_id || r.id) === id ? { ...r, is_read: true } : r
        )
      );
      try {
        await notificationService.markAsRead(id);
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }

    // Determine target route based on reminder type
    let targetUrl = "/dashboard";
    if (item.type === "vaccine_reminder" || item.type === "vaccination_reminder") {
      targetUrl = item.pet_id ? `/pets/${item.pet_id}/vaccinations` : `/pets`;
    } else if (item.type === "checkup_reminder") {
      targetUrl = item.pet_id ? `/pets/${item.pet_id}/medical-records` : `/pets`;
    } else if (item.type === "appointment_reminder") {
      targetUrl = item.reference_id
        ? `/appointments/${item.reference_id}`
        : `/appointments`;
    }

    router.push(targetUrl);
  };

  // ─── Mark All as Read ──────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (tabCounts.all.unread === 0) return;
    setIsMarkingAll(true);
    // Optimistic UI
    setReminders((prev) => prev.map((r) => ({ ...r, is_read: true })));
    try {
      await notificationService.markAllRead();
      showToastSuccess("Đã đánh dấu tất cả nhắc lịch là đã đọc.");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      showToastError("Không thể cập nhật trạng thái đã đọc.");
      fetchReminders(); // Re-sync on failure
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-teal-50/40 to-emerald-50/60 p-6 md:p-8 rounded-3xl border border-sky-100/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-[#0EA5B7] text-white shadow-xs">
              <CalendarClock size={22} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0EA5B7]">
              SmartPetCare 3D
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-slate-800 tracking-tight">
            Trung tâm Nhắc lịch
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Theo dõi tất cả lịch hẹn khám bệnh, tiêm phòng định kỳ và tái khám của thú cưng ở cùng một nơi.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={fetchReminders}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin text-[#0EA5B7]")} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || tabCounts.all.unread === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5B7] text-white text-sm font-medium hover:bg-[#0b8fa0] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck size={16} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </div>
      </div>

      {/* ─── Quick Stats Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Reminders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center font-bold">
            <BellRing size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng nhắc lịch</p>
            <p className="text-2xl font-bold text-slate-800">{tabCounts.all.total}</p>
          </div>
        </div>

        {/* Unread Reminders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Chưa đọc</p>
            <p className="text-2xl font-bold text-amber-600">{tabCounts.all.unread}</p>
          </div>
        </div>

        {/* Vaccine Reminders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Syringe size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Lịch tiêm phòng</p>
            <p className="text-2xl font-bold text-slate-800">{tabCounts.vaccine.total}</p>
          </div>
        </div>

        {/* Appointments & Checkup */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Stethoscope size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Khám & Tái khám</p>
            <p className="text-2xl font-bold text-slate-800">
              {tabCounts.appointment.total + tabCounts.checkup.total}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Tabs & Filters Bar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
        {/* Main Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key].total;
              const unreadCount = tabCounts[tab.key].unread;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all relative whitespace-nowrap",
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      isActive
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {count}
                  </span>

                  {/* Unread indicator dot */}
                  {unreadCount > 0 && (
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isActive ? "bg-amber-400" : "bg-red-500"
                      )}
                      title={`${unreadCount} nhắc lịch chưa đọc`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setFilterReadStatus("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-colors",
                filterReadStatus === "all"
                  ? "bg-white text-slate-800 shadow-2xs font-semibold"
                  : "hover:text-slate-900"
              )}
            >
              Tất cả ({tabCounts[activeTab].total})
            </button>
            <button
              onClick={() => setFilterReadStatus("unread")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1",
                filterReadStatus === "unread"
                  ? "bg-white text-slate-800 shadow-2xs font-semibold"
                  : "hover:text-slate-900"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Chưa đọc ({tabCounts[activeTab].unread})
            </button>
            <button
              onClick={() => setFilterReadStatus("read")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-colors",
                filterReadStatus === "read"
                  ? "bg-white text-slate-800 shadow-2xs font-semibold"
                  : "hover:text-slate-900"
              )}
            >
              Đã đọc
            </button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thú cưng, nội dung hoặc tiêu đề nhắc lịch..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0EA5B7] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded bg-slate-200"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap self-end sm:self-center font-medium">
            Hiển thị <span className="font-bold text-slate-800">{filteredReminders.length}</span> nhắc lịch
          </div>
        </div>
      </div>

      {/* ─── Main Content / Reminder List ─────────────────────────────────── */}
      {/* 1. Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-semibold text-red-800">{error}</h3>
          <button
            onClick={fetchReminders}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 2. Loading Skeleton State */}
      {isLoading && !error && (
        <div className="space-y-4">
          <ReminderCardSkeleton />
          <ReminderCardSkeleton />
          <ReminderCardSkeleton />
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !error && filteredReminders.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-20 h-20 rounded-3xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-2xs">
            <Inbox size={36} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Không có nhắc lịch nào
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {activeTab === "appointment"
              ? "Bạn hiện không có lịch hẹn khám nào cần nhắc nhở."
              : activeTab === "vaccine"
              ? "Không có mũi tiêm phòng nào sắp tới hạn cho thú cưng của bạn."
              : activeTab === "checkup"
              ? "Không có lịch tái khám nào đang chờ theo dõi."
              : searchQuery
              ? `Không tìm thấy nhắc lịch nào phù hợp với từ khóa "${searchQuery}".`
              : "Tất cả thú cưng của bạn đều đã được chăm sóc đầy đủ. Không có lịch nhắc nào đang chờ."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Xóa tìm kiếm
              </button>
            ) : (
              <>
                <Link
                  href="/appointments"
                  className="px-5 py-2.5 rounded-xl bg-[#0EA5B7] text-white text-sm font-medium hover:bg-[#0b8fa0] transition-colors shadow-xs inline-flex items-center gap-2"
                >
                  <Calendar size={16} />
                  <span>Xem lịch hẹn</span>
                </Link>
                <Link
                  href="/pets"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
                >
                  <Dog size={16} />
                  <span>Danh sách thú cưng</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Reminder Cards List */}
      {!isLoading && !error && filteredReminders.length > 0 && (
        <div className="space-y-3.5">
          <AnimatePresence mode="popLayout">
            {filteredReminders.map((item, index) => {
              const meta = getReminderTypeMeta(item.type);
              const timeDisplay = item.scheduled_at || item.sent_at || item.created_at;
              const relativeTime = getRelativeTimeLabel(timeDisplay);
              const isUnread = !item.is_read;

              return (
                <motion.div
                  key={item.notification_id || item.id || `rem_${index}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleReminderClick(item)}
                  className={cn(
                    "group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 shadow-2xs hover:shadow-md hover:border-slate-300",
                    isUnread
                      ? "border-l-4 border-l-[#0EA5B7] border-sky-100 bg-gradient-to-r from-sky-50/30 to-white"
                      : "border-slate-200/80 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Icon & Core Details */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Icon */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                          meta.iconBg
                        )}
                      >
                        <span className="text-xl" role="img" aria-label={meta.label}>
                          {meta.emoji}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Meta Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type Badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                              meta.badgeBg
                            )}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>

                          {/* Related Pet Badge */}
                          {item.pet_name && (
                            <Link
                              href={item.pet_id ? `/pets/${item.pet_id}` : "/pets"}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                              title="Xem trang chi tiết thú cưng"
                            >
                              {item.pet_species?.toLowerCase() === "cat" ? (
                                <Cat size={13} className="text-amber-500" />
                              ) : (
                                <Dog size={13} className="text-[#0EA5B7]" />
                              )}
                              <span className="font-semibold text-slate-800">
                                {item.pet_name}
                              </span>
                            </Link>
                          )}

                          {/* Read / Unread Status Badge */}
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chưa đọc
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <CheckCircle2 size={12} className="text-slate-400" />
                              Đã đọc
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2
                          className={cn(
                            "text-base tracking-tight transition-colors group-hover:text-[#0EA5B7]",
                            isUnread
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          )}
                        >
                          {item.title}
                        </h2>

                        {/* Content text */}
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {item.content || item.message}
                        </p>

                        {/* Datetime & Schedule badge */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={13} className="text-slate-400" />
                            {item.scheduled_at
                              ? `Lịch hẹn: ${formatDateTime(item.scheduled_at)}`
                              : item.sent_at
                              ? `Đã gửi: ${formatDateTime(item.sent_at)}`
                              : `Tạo lúc: ${formatDateTime(item.created_at)}`}
                          </span>

                          {relativeTime.text && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md font-semibold text-[11px]",
                                relativeTime.isUrgent
                                  ? "bg-amber-100 text-amber-800"
                                  : relativeTime.isPast
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-sky-50 text-sky-700"
                              )}
                            >
                              {relativeTime.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 group-hover:bg-[#0EA5B7] group-hover:text-white transition-all shadow-2xs">
                        <span>{meta.actionLabel}</span>
                        <ChevronRight
                          size={14}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
