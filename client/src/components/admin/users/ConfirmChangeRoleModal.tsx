"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import UserRoleBadge from "./UserRoleBadge";
import { User, UserRole } from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/ui/Toast";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface ConfirmChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  targetRole: UserRole | null;
  onSuccess: (updatedUser: User) => void;
}

export const ConfirmChangeRoleModal: React.FC<ConfirmChangeRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  targetRole,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!user || !targetRole) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const userId = user.user_id || user.id;
      const updated = await adminService.updateUserRole(userId, targetRole);
      toast.success(
        `Đã cập nhật vai trò của "${user.full_name}" sang ${
          targetRole === "admin"
            ? "Quản trị viên"
            : targetRole === "doctor"
            ? "Bác sĩ thú y"
            : "Chủ nuôi"
        }.`,
        "Cập nhật thành công"
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update role:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể thay đổi vai trò người dùng. Vui lòng thử lại sau.",
        "Lỗi thao tác"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Xác nhận thay đổi vai trò"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Xác nhận thay đổi</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-800 text-sm truncate">
              {user.full_name}
            </h4>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Vai trò người dùng
          </p>
          <div className="flex items-center justify-center gap-4 py-2">
            <UserRoleBadge role={user.role} size="md" />
            <ArrowRight size={18} className="text-slate-400 shrink-0" />
            <UserRoleBadge role={targetRole} size="md" />
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-800 text-xs leading-relaxed">
          <ShieldCheck size={16} className="shrink-0 text-purple-600 mt-0.5" />
          <div>
            <span className="font-semibold">Lưu ý quản trị: </span>
            Khi bạn xác nhận, hệ thống sẽ tự động ghi nhận mã định danh Admin và
            thời điểm cập nhật vai trò này vào lịch sử kiểm toán của hệ thống.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmChangeRoleModal;
