"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Bắt redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const validateEmail = (val: string) => {
    if (!val) return "Email không được để trống";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Email không đúng định dạng";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Mật khẩu không được để trống";
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) setEmailError(validateEmail(val));
    if (errorMsg) {
      setErrorMsg("");
      setNeedsVerification(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) setPasswordError(validatePassword(val));
    if (errorMsg) {
      setErrorMsg("");
      setNeedsVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setNeedsVerification(false);
    
    const eError = validateEmail(email);
    const pError = validatePassword(password);
    
    setEmailError(eError);
    setPasswordError(pError);
    
    if (eError || pError) return;
    
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      // Thành công
      setSuccessMsg("Đăng nhập thành công!");
      login(res.access_token, res.user);
      
      // Redirect theo role
      setTimeout(() => {
        if (res.user.role === "admin") router.push("/admin/dashboard");
        else if (res.user.role === "doctor") router.push("/doctor/dashboard");
        else router.push("/dashboard");
      }, 500);
      
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      // Kiểm tra xem lỗi có phải do chưa xác thực OTP không
      if (msg.includes("chưa được kích hoạt") || msg.toLowerCase().includes("chưa xác thực")) {
        setNeedsVerification(true);
        setErrorMsg("Tài khoản chưa xác thực OTP.");
      } else {
        setErrorMsg("Email hoặc mật khẩu không đúng.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900 selection:bg-emerald-500/30">
      {/* Nền tĩnh gradient tối giản và hiện đại cho hiệu năng cao.
          Lý do: Trang login cần ưu tiên tốc độ tải trang, tập trung vào form đăng nhập, 
          tránh render 3D làm tăng tải không cần thiết. Gradient đủ mang lại cảm giác premium. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-md p-8 md:p-10 mx-4 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              SmartPetCare
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Chào mừng trở lại</h2>
          <p className="text-slate-400 text-sm">Vui lòng đăng nhập vào tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
              Email
            </label>
            <div className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${emailError ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading || !!successMsg}
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  emailError 
                    ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" 
                    : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                }`}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
            <AnimatePresence>
              {emailError && (
                <motion.p 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                  animate={{ opacity: 1, height: "auto", marginTop: 6 }} 
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="text-red-400 text-xs ml-1 font-medium"
                >
                  {emailError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                Mật khẩu
              </label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${passwordError ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading || !!successMsg}
                className={`w-full pl-10 pr-10 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  passwordError 
                    ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500 bg-red-500/5" 
                    : "border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20"
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
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
            <AnimatePresence>
              {passwordError && (
                <motion.p 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                  animate={{ opacity: 1, height: "auto", marginTop: 6 }} 
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="text-red-400 text-xs ml-1 font-medium"
                >
                  {passwordError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 cursor-pointer transition-colors"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-slate-300 cursor-pointer select-none">
              Ghi nhớ đăng nhập
            </label>
          </div>

          {/* Error & Verification Message */}
          <AnimatePresence mode="popLayout">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-red-200">{errorMsg}</p>
                  {needsVerification && (
                    <Link 
                      href={`/verify-otp?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center justify-center mt-2.5 text-xs px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors font-medium border border-red-500/20"
                    >
                      Xác thực OTP ngay
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Success Message */}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-center"
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
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group relative overflow-hidden"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            
            <span className="relative flex items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors ml-1">
            Đăng ký ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
