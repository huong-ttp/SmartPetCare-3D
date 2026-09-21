"use client";

import React from "react";
import {
  X,
  User,
  Dog,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { AdminNotificationItem } from "@/types/notification.type";
import NotificationTypeBadge from "./NotificationTypeBadge";

interface NotificationDetailModalProps {
  notification: AdminNotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

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
}: NotificationDetailModalProps) {
  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-purple-50/20 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading">
                Chi tiết thông báo
              </h3>
              <p className="text-xs text-slate-400">
                ID: #{notification.notification_id || notification.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {/* Title & Badge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <NotificationTypeBadge type={notification.type} />
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  notification.is_read
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {notification.is_read ? (
                  <>
                    <CheckCircle2 size={12} /> Đã đọc
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> Chưa đọc
                  </>
                )}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-800">
              {notification.title}
            </h4>
          </div>

          {/* Body Content */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nội dung thông báo
            </label>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {notification.content || notification.message || "Không có nội dung"}
            </p>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Recipient */}
            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <User size={12} /> Người nhận
              </span>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {notification.full_name || `User #${notification.user_id}`}
              </p>
              {notification.user_email && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <Mail size={10} /> {notification.user_email}
                </p>
              )}
            </div>

            {/* Pet */}
            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Dog size={12} /> Thú cưng liên quan
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {notification.pet_name ? notification.pet_name : "-"}
              </p>
              <p className="text-[10px] text-slate-400">
                {notification.pet_id ? `Mã thú cưng: #${notification.pet_id}` : "Không có"}
              </p>
            </div>

            {/* Sent at */}
            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Send size={12} /> Thời gian gửi (Sent at)
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {formatDate(notification.sent_at || notification.created_at)}
              </p>
            </div>

            {/* Created at */}
            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Clock size={12} /> Thời gian tạo (Created at)
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {formatDate(notification.created_at)}
              </p>
            </div>
          </div>

          {notification.scheduled_at && (
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center justify-between text-xs">
              <span className="text-sky-700 font-medium flex items-center gap-1.5">
                <Calendar size={13} /> Thời gian lên lịch (Scheduled at):
              </span>
              <span className="font-semibold text-sky-800">
                {formatDate(notification.scheduled_at)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
