"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserCheck, Stethoscope, ArrowRight, ShieldCheck, Zap, Heart, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export const FloatingPortalBoard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDashboardUrl = (role?: string) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "doctor") return "/doctor/dashboard";
    return "/dashboard";
  };

  const dashboardUrl = getDashboardUrl(user?.role);
  return (
    <div id="portal" className="relative z-20 w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="rounded-3xl p-7 sm:p-10 bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl shadow-emerald-950/10"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap size={13} className="text-[#00A86B]" />
            Cổng Đăng Nhập & Đăng Ký
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight mb-2">
            Tham gia cộng đồng SmartPetCare 3D
          </h2>
          <p className="text-sm text-slate-600">
            Lựa chọn vai trò của bạn để bắt đầu trải nghiệm dịch vụ chăm sóc thú cưng hiện đại nhất.
          </p>
        </div>

        {/* 2 Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 1. Chủ nuôi thú cưng */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-white border border-emerald-200/80 shadow-md flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00A86B]/15 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B] mb-4">
                <Heart size={24} className="text-[#00A86B]" />
              </div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Dành cho cá nhân & gia đình
              </span>
              <h3 className="text-xl font-heading font-bold text-slate-900 mt-1 mb-2">
                Chủ Nuôi Thú Cưng
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                Quản lý không giới hạn số lượng bé cưng, lưu trữ sổ tiêm chủng, nhận thông báo nhắc lịch tự động và đặt lịch khám tức thì.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                  Tạo hồ sơ và theo dõi cân nặng miễn phí
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                  Nhắc hẹn tiêm vắc-xin & tẩy giun định kỳ
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                  Lưu trữ kết quả khám & toa thuốc trọn đời
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-emerald-100">
              {mounted && isAuthenticated ? (
                <Link
                  href={dashboardUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
                >
                  <LayoutDashboard size={14} />
                  Vào Không Gian Quản Lý
                  <ArrowRight size={13} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                    style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
                  >
                    Đăng ký chủ nuôi
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 2. Bác sĩ & Phòng khám */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-white border border-cyan-200/80 shadow-md flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0EA5B7]/15 border border-[#0EA5B7]/30 flex items-center justify-center text-[#0EA5B7] mb-4">
                <Stethoscope size={24} className="text-[#0EA5B7]" />
              </div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                Dành cho chuyên môn y tế
              </span>
              <h3 className="text-xl font-heading font-bold text-slate-900 mt-1 mb-2">
                Bác Sĩ & Phòng Khám
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                Nền tảng số hóa quản lý bệnh án, xếp lịch thăm khám thông minh, tương tác tư vấn trực tuyến và nâng cao chất lượng dịch vụ.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5B7]" />
                  Quản lý danh sách bệnh nhân & lịch hẹn
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5B7]" />
                  Kê đơn thuốc điện tử & chỉ định phác đồ
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5B7]" />
                  Đồng bộ hồ sơ y tế bảo mật cao
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-cyan-100">
              {mounted && isAuthenticated ? (
                <Link
                  href={user?.role === "doctor" ? "/doctor/dashboard" : dashboardUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #0EA5B7, #0284C7)" }}
                >
                  <LayoutDashboard size={14} />
                  {user?.role === "doctor" ? "Bàn Làm Việc Bác Sĩ" : "Vào Bảng Điều Khiển"}
                  <ArrowRight size={13} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #0EA5B7, #0284C7)" }}
                >
                  Cổng Bác Sĩ Đăng Nhập
                  <UserCheck size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Security & Guarantee Note */}
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-slate-500 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#00A86B]" />
            Bảo mật thông tin chuẩn quốc tế
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-[#0EA5B7]" />
            Kích hoạt tài khoản ngay tức thì
          </span>
          <span className="flex items-center gap-1.5">
            <Heart size={14} className="text-rose-500" />
            Đồng hành trọn đời cùng thú cưng
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingPortalBoard;
