"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Sparkles,
  Users,
  Shield,
  User,
  AlertCircle,
  CheckCircle2,
  Bell,
  Search,
  Check,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { SendSystemNotificationDTO } from "@/types/notification.type";
import { User as UserEntity, UserRole } from "@/types/user.type";
import { useToast } from "@/components/ui/Toast";
import NotificationTypeBadge from "./NotificationTypeBadge";
import { cn } from "@/utils/cn";

interface SendSystemNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendSystemNotificationModal({
  isOpen,
  onClose,
  onSuccess,
}: SendSystemNotificationModalProps) {
  const toast = useToast();

  // Form State
  const [target, setTarget] = useState<"all" | "role" | "user">("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  // Users for "user" target
  const [userList, setUserList] = useState<UserEntity[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset or load users when modal opens
  useEffect(() => {
    if (isOpen) {
      setTarget("all");
      setSelectedRole("owner");
      setSelectedUserId("");
      setTitle("");
      setContent("");
      setErrors({});
      setUserSearchQuery("");
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await adminService.listUsers({ limit: 100 });
      setUserList(res.items || []);
    } catch (err) {
      console.warn("Could not load users list for modal:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filtered users for user picker
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return userList;
    const q = userSearchQuery.toLowerCase();
    return userList.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
    );
  }, [userList, userSearchQuery]);

  const selectedUser = useMemo(() => {
    return userList.find((u) => String(u.id) === selectedUserId || String(u.user_id) === selectedUserId);
  }, [userList, selectedUserId]);

  // Estimated recipient count calculation
  const estimatedRecipients = useMemo(() => {
    if (target === "all") {
      return userList.filter((u) => u.is_active !== false).length || "Toàn bộ";
    }
    if (target === "role") {
      const count = userList.filter((u) => u.role === selectedRole && u.is_active !== false).length;
      return count || `Theo nhóm ${selectedRole}`;
    }
    if (target === "user") {
      return selectedUserId ? 1 : 0;
    }
    return 0;
  }, [target, selectedRole, selectedUserId, userList]);

  // Validation
  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) {
      errs.title = "Vui lòng nhập tiêu đề thông báo";
    } else if (title.trim().length < 4) {
      errs.title = "Tiêu đề phải có ít nhất 4 ký tự";
    }

    if (!content.trim()) {
      errs.content = "Vui lòng nhập nội dung thông báo";
    } else if (content.trim().length < 6) {
      errs.content = "Nội dung phải có ít nhất 6 ký tự";
    }

    if (target === "user" && !selectedUserId) {
      errs.user = "Vui lòng chọn một người dùng nhận thông báo";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: SendSystemNotificationDTO = {
        target,
        title: title.trim(),
        content: content.trim(),
        type: "system",
      };

      if (target === "role") {
        payload.role = selectedRole;
      } else if (target === "user") {
        payload.user_id = selectedUserId;
      }

      const res = await adminService.sendSystemNotification(payload);
      toast.success(
        res?.message ||
          `Đã gửi thông báo hệ thống thành công đến ${
            res?.data?.recipients ?? estimatedRecipients
          } người nhận!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to send system notification:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể gửi thông báo hệ thống. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-heading">
                Gửi thông báo hệ thống
              </h3>
              <p className="text-xs text-slate-500">
                Tạo bản ghi thông báo in-app gửi tức thì tới người dùng SmartPetCare
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Đối tượng nhận thông báo <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTarget("all");
                  setErrors((prev) => ({ ...prev, user: "" }));
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                  target === "all"
                    ? "border-purple-500 bg-purple-50/60 text-purple-700 shadow-xs ring-2 ring-purple-500/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                )}
              >
                <Users size={18} className={target === "all" ? "text-purple-600" : "text-slate-400"} />
                <span className="text-xs font-semibold mt-1">Tất cả người dùng</span>
                <span className="text-[10px] text-slate-400">All active users</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTarget("role");
                  setErrors((prev) => ({ ...prev, user: "" }));
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                  target === "role"
                    ? "border-purple-500 bg-purple-50/60 text-purple-700 shadow-xs ring-2 ring-purple-500/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                )}
              >
                <Shield size={18} className={target === "role" ? "text-purple-600" : "text-slate-400"} />
                <span className="text-xs font-semibold mt-1">Theo vai trò</span>
                <span className="text-[10px] text-slate-400">By role group</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget("user")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                  target === "user"
                    ? "border-purple-500 bg-purple-50/60 text-purple-700 shadow-xs ring-2 ring-purple-500/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                )}
              >
                <User size={18} className={target === "user" ? "text-purple-600" : "text-slate-400"} />
                <span className="text-xs font-semibold mt-1">Người dùng cụ thể</span>
                <span className="text-[10px] text-slate-400">Single user</span>
              </button>
            </div>
          </div>

          {/* Conditional Target Options */}
          {target === "role" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <label className="block text-xs font-medium text-slate-700">
                Chọn vai trò người nhận:
              </label>
              <div className="flex gap-3">
                {[
                  { value: "owner", label: "Chủ nuôi (Owners)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                  { value: "doctor", label: "Bác sĩ (Doctors)", color: "text-sky-700 bg-sky-50 border-sky-200" },
                  { value: "admin", label: "Quản trị viên (Admins)", color: "text-purple-700 bg-purple-50 border-purple-200" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value as UserRole)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all text-center",
                      selectedRole === r.value
                        ? `${r.color} font-semibold ring-2 ring-purple-400/30 shadow-xs`
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {target === "user" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">
                  Chọn người dùng nhận thông báo <span className="text-rose-500">*</span>
                </label>
                {selectedUser && (
                  <span className="text-[11px] font-medium text-purple-600 flex items-center gap-1">
                    <Check size={12} /> Đã chọn: {selectedUser.full_name}
                  </span>
                )}
              </div>

              {/* User search bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, sđt..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* User list */}
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                {isLoadingUsers ? (
                  <div className="p-3 text-center text-xs text-slate-400">Đang tải người dùng...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">Không tìm thấy người dùng phù hợp</div>
                ) : (
                  filteredUsers.map((u) => {
                    const uId = String(u.id || u.user_id);
                    const isSelected = selectedUserId === uId;
                    return (
                      <div
                        key={uId}
                        onClick={() => {
                          setSelectedUserId(uId);
                          setErrors((prev) => ({ ...prev, user: "" }));
                        }}
                        className={cn(
                          "px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors",
                          isSelected && "bg-purple-50/80 hover:bg-purple-50"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-medium text-slate-800 block truncate">
                              {u.full_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {u.email} • {u.role}
                            </span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={15} className="text-purple-600 shrink-0 ml-2" />}
                      </div>
                    );
                  })
                )}
              </div>
              {errors.user && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.user}
                </p>
              )}
            </div>
          )}

          {/* Recipient summary banner */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={14} className="text-purple-600" /> Loại thông báo:{" "}
              <NotificationTypeBadge type="system" />
            </span>
            <span className="text-purple-700 font-semibold">
              Ước tính: {estimatedRecipients} người nhận
            </span>
          </div>

          {/* Title input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tiêu đề thông báo <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{title.length}/100</span>
            </div>
            <input
              type="text"
              maxLength={100}
              placeholder="VD: Cập nhật tính năng SmartPetCare 3D mới..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={cn(
                "w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 transition-all",
                errors.title
                  ? "border-rose-400 focus:ring-rose-400/20"
                  : "border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
              )}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.title}
              </p>
            )}
          </div>

          {/* Content textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nội dung thông báo <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{content.length}/500</span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Nhập nội dung thông báo gửi đến người dùng..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
              }}
              className={cn(
                "w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 transition-all resize-none",
                errors.content
                  ? "border-rose-400 focus:ring-rose-400/20"
                  : "border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
              )}
            />
            {errors.content && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.content}
              </p>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Xem trước thông báo (In-App Preview)
            </span>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-800 truncate">
                    {title || "Tiêu đề thông báo..."}
                  </h5>
                  <span className="text-[10px] text-slate-400 shrink-0">Vừa xong</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap break-words">
                  {content || "Nội dung chi tiết thông báo sẽ hiển thị tại đây khi gửi..."}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <NotificationTypeBadge type="system" />
                  <span className="text-[10px] text-purple-600 font-medium">
                    Chưa đọc • In-app
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-98 rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Gửi thông báo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
