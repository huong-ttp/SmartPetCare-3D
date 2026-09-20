"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import UserRoleBadge from "./UserRoleBadge";
import UserStatusBadge from "./UserStatusBadge";
import { User, UpdateAdminUserDTO } from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/ui/Toast";
import { User as UserIcon, Phone, MapPin, Mail, Hash } from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (updatedUser: User) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<UpdateAdminUserDTO>({
    full_name: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setErrors({});
    }
  }, [user]);

  if (!user) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name?.trim()) {
      newErrors.full_name = "Họ và tên không được để trống";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Họ và tên tối thiểu 2 ký tự";
    }

    if (formData.phone && !/^0\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const userId = user.user_id || user.id;
      const updated = await adminService.updateUser(userId, {
        full_name: formData.full_name?.trim(),
        phone: formData.phone?.trim() || null as any,
        address: formData.address?.trim() || null as any,
      });

      toast.success(
        `Đã cập nhật thông tin người dùng "${updated.full_name}".`,
        "Cập nhật thành công"
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update user:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.",
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
      title="Chỉnh sửa thông tin người dùng"
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl shadow-md shadow-cyan-500/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* User Quick Info Overview */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Hash size={13} /> Mã người dùng:
            </span>
            <span className="font-semibold text-slate-700">
              #{user.user_id || user.id}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Mail size={13} /> Email:
            </span>
            <span className="font-medium text-slate-800">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Vai trò & Trạng thái:</span>
            <div className="flex items-center gap-1.5">
              <UserRoleBadge role={user.role} size="sm" />
              <UserStatusBadge isActive={user.is_active} size="sm" />
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <Input
          label="Họ và tên"
          required
          placeholder="Nhập họ và tên đầy đủ"
          leftIcon={<UserIcon size={16} />}
          value={formData.full_name || ""}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
          error={errors.full_name}
        />

        <Input
          label="Số điện thoại"
          placeholder="VD: 0912345678"
          leftIcon={<Phone size={16} />}
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
        />

        <Input
          label="Địa chỉ cư trú"
          placeholder="Nhập địa chỉ nhà / khu vực"
          leftIcon={<MapPin size={16} />}
          value={formData.address || ""}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </form>
    </Modal>
  );
};

export default EditUserModal;
