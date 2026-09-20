"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import UserRoleBadge from "./UserRoleBadge";
import { User } from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/ui/Toast";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (updatedUser: User) => void;
}

export const ConfirmDeactivateModal: React.FC<ConfirmDeactivateModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!user) return null;

  const handleDeactivate = async () => {
    try {
      setIsSubmitting(true);
      const userId = user.user_id || user.id;
      const updated = await adminService.toggleUserActive(userId, false);
      toast.success(
        `Đã vô hiệu hóa tài khoản "${user.full_name}".`,
        "Khóa tài khoản thành công"
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to deactivate user:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể vô hiệu hóa tài khoản. Vui lòng thử lại sau.",
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
      title="Xác nhận vô hiệu hóa tài khoản"
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
            onClick={handleDeactivate}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-500/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Khóa tài khoản</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        <div className="flex items-center gap-3.5 p-3.5 bg-red-50 rounded-xl border border-red-200">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-red-900 text-sm">
              Cảnh báo khóa tài khoản
            </h4>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Người dùng này sẽ bị đăng xuất ngay lập tức và không thể đăng nhập
              vào hệ thống SmartPetCare cho đến khi được kích hoạt lại.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Họ và tên:</span>
            <span className="font-semibold text-slate-800">{user.full_name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Email:</span>
            <span className="font-medium text-slate-700">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Vai trò hiện tại:</span>
            <UserRoleBadge role={user.role} size="sm" />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeactivateModal;
