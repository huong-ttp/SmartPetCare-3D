"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, Mail, Lock, Phone, MapPin, 
  Camera, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Ref cho file input avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Bắt redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Handle avatar select
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xóa lỗi field khi user type
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (globalError) setGlobalError("");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Họ tên không được để trống";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    if (formData.phone && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      // Gọi service register
      await authService.register({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        password: formData.password,
        // TODO: Xử lý upload avatar_url nếu cần thiết
        // avatar_url: avatarUrl 
      });
      
      setSuccessMsg("Đăng ký thành công! Đang chuyển hướng đến trang xác thực...");
      
      // Chuyển hướng sang trang verify-otp kèm email
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }, 1500);
      
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setGlobalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper render error
  const renderError = (field: string) => (
    <AnimatePresence>
      {errors[field] && (
        <motion.p 
          initial={{ opacity: 0, height: 0, marginTop: 0 }} 
          animate={{ opacity: 1, height: "auto", marginTop: 4 }} 
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="text-red-400 text-xs ml-1 font-medium"
        >
          {errors[field]}
        </motion.p>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900 selection:bg-emerald-500/30 py-12 px-4">
      {/* Nền tĩnh gradient tương tự trang Login */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]"></div>
        <div className="absolute top-[30%] left-[70%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-2xl p-8 md:p-10 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              SmartPetCare
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-slate-400 text-sm">Điền thông tin bên dưới để trở thành thành viên</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          
          {/* Avatar Upload Placeholder */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div 
              className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group transition-colors hover:border-blue-500/50"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-slate-400 group-hover:text-blue-400 transition-colors" size={32} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-white font-medium">Tải ảnh lên</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-slate-500 mt-2">Ảnh đại diện (Tùy chọn)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="fullName">Họ và tên *</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${errors.fullName ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                  <UserIcon size={18} />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={isLoading || !!successMsg}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                  }`}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {renderError("fullName")}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">Email *</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${errors.email ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading || !!successMsg}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.email ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                  }`}
                  placeholder="name@example.com"
                />
              </div>
              {renderError("email")}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="password">Mật khẩu *</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${errors.password ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading || !!successMsg}
                  className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.password ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {renderError("password")}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading || !!successMsg}
                  className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {renderError("confirmPassword")}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="phone">Số điện thoại</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${errors.phone ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                  <Phone size={18} />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isLoading || !!successMsg}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.phone ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                  }`}
                  placeholder="0912345678"
                />
              </div>
              {renderError("phone")}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="address">Địa chỉ</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors text-slate-500 group-focus-within:text-blue-400`}>
                  <MapPin size={18} />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isLoading || !!successMsg}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20`}
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
            </div>
          </div>

          {/* Global Error & Success */}
          <AnimatePresence mode="popLayout">
            {globalError && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 col-span-2"
              >
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-red-200">{globalError}</p>
                </div>
              </motion.div>
            )}
            
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-center col-span-2"
              >
                <CheckCircle2 className="text-emerald-400" size={18} />
                <p className="text-sm text-emerald-300 font-medium">{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative flex items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký tài khoản"
              )}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors ml-1">
            Đăng nhập ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
