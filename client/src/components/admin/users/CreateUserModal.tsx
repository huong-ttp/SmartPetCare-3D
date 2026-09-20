"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { CreateAdminUserDTO, User } from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/ui/Toast";
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  Stethoscope,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: User) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateAdminUserDTO>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "doctor",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      role: "doctor",
    });
    setErrors({});
    setShowPassword(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    if (errors.password) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Vui lòng nhập họ và tên";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Họ và tên tối thiểu 2 ký tự";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Định dạng email không hợp lệ";
      }
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu tạm thời";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
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
      const payload: CreateAdminUserDTO = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        role: formData.role,
      };

      const newUser = await adminService.createUser(payload);
      toast.success(
        `Đã tạo thành công tài khoản ${
          formData.role === "doctor" ? "Bác sĩ" : "Quản trị viên"
        } "${payload.full_name}".`,
        "Tạo tài khoản thành công"
      );
      resetForm();
      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      console.error("Failed to create user:", err);
      const msg =
        err?.response?.data?.message ||
        "Không thể tạo tài khoản mới. Vui lòng kiểm tra lại thông tin.";
      toast.error(msg, "Lỗi tạo tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo tài khoản Bác sĩ / Quản trị viên"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
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
            <span>Tạo tài khoản mới</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* Policy notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs leading-relaxed">
          <Info size={16} className="shrink-0 text-sky-600 mt-0.5" />
          <div>
            <span className="font-semibold">Quy định hệ thống: </span>
            Tài khoản Bác sĩ thú y và Quản trị viên chỉ có thể được tạo trực
            tiếp bởi Admin để đảm bảo an toàn nghiệp vụ y tế và phân quyền vận
            hành.
          </div>
        </div>

        {/* Role Selection Cards */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Vai trò tài khoản <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "doctor" })}
              className={cn(
                "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                formData.role === "doctor"
                  ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  formData.role === "doctor"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                <Stethoscope size={18} />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">
                  Bác sĩ thú y
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Khám chữa bệnh, kê đơn & nhật ký
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "admin" })}
              className={cn(
                "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                formData.role === "admin"
                  ? "border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  formData.role === "admin"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">
                  Quản trị viên
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Toàn quyền hệ thống & phân quyền
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Họ và tên"
            required
            placeholder="VD: BS. Nguyễn Văn An"
            leftIcon={<UserIcon size={16} />}
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            error={errors.full_name}
          />

          <Input
            label="Địa chỉ Email"
            required
            type="email"
            placeholder="bacsi@smartpetcare.vn"
            leftIcon={<Mail size={16} />}
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />
        </div>

        {/* Temporary Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">
              Mật khẩu tạm thời <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={13} />
              Tạo mật khẩu ngẫu nhiên
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              leftIcon={<Lock size={16} />}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Người dùng có thể đổi lại mật khẩu này sau khi đăng nhập lần đầu.
          </p>
        </div>

        {/* Phone & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Số điện thoại"
            placeholder="0912345678"
            leftIcon={<Phone size={16} />}
            value={formData.phone || ""}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            error={errors.phone}
          />

          <Input
            label="Địa chỉ"
            placeholder="Quận / Huyện, TP"
            leftIcon={<MapPin size={16} />}
            value={formData.address || ""}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
