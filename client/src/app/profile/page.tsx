"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Shield,
  KeyRound,
  Camera,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Stethoscope,
  Crown,
  HeartHandshake,
  Calendar,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { userService } from "@/services/userService";
import { useToast } from "@/components/ui/Toast";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";

export default function ProfilePage() {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    avatar_url: "",
    role: "owner",
    is_active: true,
    created_at: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setIsFetching(true);
      try {
        const data = await userService.getProfile();
        setProfileData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          avatar_url: data.avatar_url || "",
          role: data.role || "owner",
          is_active: Boolean(data.is_active),
          created_at: data.created_at || "",
        });
        setAvatarPreview(data.avatar_url || "");
      } catch (err: any) {
        console.error("[ProfilePage] Failed to fetch profile:", err);
        // Fallback to user from auth context
        if (user) {
          setProfileData({
            full_name: user.full_name || "",
            email: user.email || "",
            phone: user.phone || "",
            address: user.address || "",
            avatar_url: user.avatar_url || "",
            role: user.role || "owner",
            is_active: Boolean(user.is_active),
            created_at: user.created_at || "",
          });
          setAvatarPreview(user.avatar_url || "");
        }
      } finally {
        setIsFetching(false);
      }
    }

    loadProfile();
  }, [user]);

  // Handle Avatar Selection & Compress via Canvas
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa là 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 320x320 to keep lightweight
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarPreview(compressedDataUrl);
          setProfileData((prev) => ({ ...prev, avatar_url: compressedDataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setProfileData((prev) => ({ ...prev, avatar_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validate Profile Form
  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileData.full_name.trim()) {
      errors.full_name = "Họ và tên không được để trống.";
    } else if (profileData.full_name.trim().length < 2) {
      errors.full_name = "Họ và tên phải có tối thiểu 2 ký tự.";
    }

    if (profileData.phone.trim()) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(profileData.phone.trim())) {
        errors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng số 0).";
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Profile Form
  const handleSubmitProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm() || isUpdatingProfile) return;

    setIsUpdatingProfile(true);
    setProfileErrors({});

    try {
      const updated = await userService.updateProfile({
        full_name: profileData.full_name.trim(),
        phone: profileData.phone.trim() || undefined,
        address: profileData.address.trim() || undefined,
        avatar_url: profileData.avatar_url || undefined,
      });

      // Synchronize with global AuthContext
      updateUser({
        full_name: updated.full_name,
        phone: updated.phone,
        address: updated.address,
        avatar_url: updated.avatar_url,
      });

      toast.success("Thông tin tài khoản đã được cập nhật thành công!", "Cập nhật thành công");
    } catch (err: any) {
      console.error("[ProfilePage] Update profile error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại!";
      toast.error(msg, "Lỗi cập nhật");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Validate Password Form
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.current_password) {
      errors.current_password = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!passwordData.new_password) {
      errors.new_password = "Vui lòng nhập mật khẩu mới.";
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = "Mật khẩu mới phải có tối thiểu 8 ký tự.";
    } else if (passwordData.new_password === passwordData.current_password) {
      errors.new_password = "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
    }

    if (!passwordData.confirm_password) {
      errors.confirm_password = "Vui lòng xác nhận mật khẩu mới.";
    } else if (passwordData.confirm_password !== passwordData.new_password) {
      errors.confirm_password = "Mật khẩu xác nhận không khớp với mật khẩu mới.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Password Form
  const handleSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm() || isChangingPassword) return;

    setIsChangingPassword(true);
    setPasswordErrors({});

    try {
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      toast.success("Mật khẩu tài khoản đã được thay đổi thành công!", "Đổi mật khẩu thành công");

      // Reset password fields
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      console.error("[ProfilePage] Change password error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại!";
      toast.error(msg, "Đổi mật khẩu thất bại");
      setPasswordErrors({
        current_password: msg.includes("hiện tại") ? msg : "",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Role Badge Helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: "Quản trị viên (Admin)",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Crown size={14} className="text-blue-600" />,
        };
      case "doctor":
        return {
          label: "Bác sĩ thú y (Doctor)",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <Stethoscope size={14} className="text-purple-600" />,
        };
      case "owner":
      default:
        return {
          label: "Chủ nuôi thú cưng (Owner)",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <HeartHandshake size={14} className="text-emerald-600" />,
        };
    }
  };

  if (authLoading || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[450px]">
          <div className="w-9 h-9 border-4 border-slate-200 border-t-[#0EA5B7] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const roleMeta = getRoleBadge(profileData.role);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <span>Trang chủ</span>
            <span>/</span>
            <span className="text-[#0EA5B7]">Hồ sơ tài khoản</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Thông tin tài khoản
            <Sparkles size={20} className="text-[#0EA5B7]" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin hồ sơ cá nhân và bảo mật tài khoản người dùng
          </p>
        </div>

        {/* Top Hero Card */}
        <div className="bg-gradient-to-br from-white via-white to-sky-50/50 rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with hover upload trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-white shadow-md bg-slate-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={profileData.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center gradient-primary text-white text-3xl font-bold">
                    {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
                className="absolute bottom-0 right-0 p-2 bg-[#0EA5B7] hover:bg-[#0c93a3] text-white rounded-2xl shadow-lg transition-transform active:scale-95 group-hover:scale-105"
              >
                <Camera size={16} />
              </button>
            </div>

            {/* User overview info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
                  {profileData.full_name || "Chưa đặt tên"}
                </h2>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {/* Role Badge - READ ONLY */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                      roleMeta.badgeClass
                    )}
                  >
                    {roleMeta.icon}
                    <span>{roleMeta.label}</span>
                  </span>

                  {/* Account Status Badge - READ ONLY */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                      profileData.is_active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        profileData.is_active ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      )}
                    />
                    <span>{profileData.is_active ? "Đang hoạt động" : "Chưa kích hoạt"}</span>
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail size={15} className="text-slate-400" />
                <span>{profileData.email}</span>
              </p>

              {profileData.created_at && (
                <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar size={13} />
                  <span>
                    Thành viên từ:{" "}
                    {new Date(profileData.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form 1: Thông tin cá nhân (7 columns) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
                  <UserIcon size={18} className="text-[#0EA5B7]" />
                  Thông tin cá nhân
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cập nhật họ tên, số điện thoại và địa chỉ liên hệ của bạn
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Avatar Upload Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Ảnh đại diện (Avatar)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="profile-avatar-input"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Tải ảnh đại diện"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Camera size={14} />
                    <span>{avatarPreview ? "Thay đổi ảnh" : "Tải ảnh từ máy tính"}</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-xl transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400">JPG, PNG, WebP (Tối đa 5MB)</span>
                </div>
              </div>

              {/* Full Name Input */}
              <div>
                <label
                  htmlFor="profile-full-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="profile-full-name"
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Ví dụ: Trần Thị Phương Hướng"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:bg-white",
                      profileErrors.full_name
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#0EA5B7]"
                    )}
                  />
                </div>
                {profileErrors.full_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{profileErrors.full_name}</p>
                )}
              </div>

              {/* Email (Readonly for safety) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="profile-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Địa chỉ Email (Định danh tài khoản)
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">
                    <Lock size={11} />
                    Chỉ đọc
                  </span>
                </div>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="profile-email"
                    type="email"
                    value={profileData.email}
                    disabled
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Email được dùng để đăng nhập và bảo mật thông báo, không thể tự thay đổi.
                </p>
              </div>

              {/* Phone Input */}
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="profile-phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Ví dụ: 0987654321"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:bg-white",
                      profileErrors.phone
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#0EA5B7]"
                    )}
                  />
                </div>
                {profileErrors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1">{profileErrors.phone}</p>
                )}
              </div>

              {/* Address Input */}
              <div>
                <label
                  htmlFor="profile-address"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Địa chỉ liên hệ
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-3 text-slate-400"
                  />
                  <textarea
                    id="profile-address"
                    rows={2}
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Ví dụ: 123 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:border-[#0EA5B7] focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Read-only System Security Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Shield size={18} className="text-[#0EA5B7] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-700">Quyền hạn & Trạng thái tài khoản</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Vai trò hiện tại của bạn là{" "}
                    <span className="font-semibold text-slate-800 capitalize">
                      {profileData.role}
                    </span>
                    . Người dùng không được tự thay đổi vai trò tài khoản. Quyền này chỉ có thể được
                    thay đổi bởi Quản trị viên trong hệ thống quản lý nhân sự.
                  </p>
                </div>
              </div>

              {/* Submit Profile Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0EA5B7] hover:bg-[#0c93a3] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#0EA5B7]/20 disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang lưu thông tin...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Lưu thay đổi thông tin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Đổi mật khẩu (5 columns) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound size={18} className="text-amber-500" />
                  Đổi mật khẩu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đảm bảo an toàn tài khoản bằng mật khẩu có độ bảo mật cao
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="profile-current-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, current_password: e.target.value }))
                    }
                    placeholder="••••••••"
                    className={cn(
                      "w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:bg-white",
                      passwordErrors.current_password
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#0EA5B7]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {passwordErrors.current_password}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="profile-new-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))
                    }
                    placeholder="Tối thiểu 8 ký tự"
                    className={cn(
                      "w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:bg-white",
                      passwordErrors.new_password
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#0EA5B7]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <p className="text-[11px] text-rose-500 mt-1">{passwordErrors.new_password}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirm_password: e.target.value }))
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    className={cn(
                      "w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:bg-white",
                      passwordErrors.confirm_password
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#0EA5B7]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {passwordErrors.confirm_password}
                  </p>
                )}
              </div>

              {/* Requirement Helper */}
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-[11px] text-amber-800 space-y-1">
                <p className="font-semibold">Yêu cầu mật khẩu:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  <li>Tối thiểu 8 ký tự.</li>
                  <li>Không trùng khớp với mật khẩu đang sử dụng.</li>
                </ul>
              </div>

              {/* Submit Password Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang đổi mật khẩu...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Cập nhật mật khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
