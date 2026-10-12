"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const LeftPanel: React.FC = () => {
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
    <div className="w-full relative z-20 rounded-3xl p-7 sm:p-9 bg-white/80 backdrop-blur-2xl border border-white/70 shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/15 transition-all duration-300">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
        <span className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#00A86B]" />
          Không gian 3D • Hệ sinh thái thú cưng 3.0
        </span>
      </div>

      {/* H1 Headline */}
      <h1 className="text-3xl sm:text-4xl lg:text-[3.2rem] font-heading font-extrabold text-slate-900 leading-[1.12] mb-5 tracking-tight">
        Chăm sóc{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A86B] via-[#0EA5B7] to-emerald-600">
          thú cưng
        </span>
        <br />
        <span className="text-slate-800">thông minh hơn</span>
      </h1>

      {/* Subtext */}
      <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed max-w-lg">
        Nền tảng quản lý hồ sơ sức khỏe, lịch tiêm phòng, đặt lịch khám
        và kết nối với bác sĩ thú y trực tuyến dễ dàng.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        {mounted && isAuthenticated ? (
          <Link
            href={dashboardUrl}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #00A86B 0%, #0EA5B7 100%)" }}
          >
            <LayoutDashboard size={17} />
            Vào Bảng điều khiển
            <ArrowRight size={16} />
          </Link>
        ) : (
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #00A86B 0%, #0EA5B7 100%)" }}
          >
            Bắt đầu ngay
            <ArrowRight size={16} />
          </Link>
        )}
        <Link
          href="#features"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/70 hover:bg-white border border-emerald-200/50 text-slate-700 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
        >
          Xem tính năng 3D
        </Link>
      </div>

      {/* 3D Interactive Helper Prompt */}
      <div className="mt-6 py-2.5 px-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-3">
        <Heart size={16} className="text-rose-500 animate-pulse flex-shrink-0" />
        <p className="text-xs text-emerald-900 leading-snug">
          <span className="font-bold">Mẹo tương tác 3D:</span> Di chuột để các bé chó mèo nhìn theo bạn! Nhấp vào các bé đang bay để vuốt ve.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8 pt-6 border-t border-emerald-100 flex items-center justify-between sm:justify-start sm:gap-10">
        <div>
          <div className="text-2xl font-extrabold text-slate-900 mb-0.5">2,000+</div>
          <div className="text-xs text-slate-500 font-medium">Bé thú cưng</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 mb-0.5">50+</div>
          <div className="text-xs text-slate-500 font-medium">Phòng khám</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[#00A86B] mb-0.5">4.9/5</div>
          <div className="text-xs text-slate-500 font-medium">Đánh giá</div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-5 flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-emerald-200/50 text-[11px] font-medium text-slate-600">
          🔒 Bảo mật cao
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-emerald-200/50 text-[11px] font-medium text-slate-600">
          🐾 Hỗ trợ 24/7
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
          ✨ Miễn phí dùng thử
        </span>
      </div>
    </div>
  );
};

export default LeftPanel;
