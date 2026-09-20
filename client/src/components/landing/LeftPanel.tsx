import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const LeftPanel: React.FC = () => {
  return (
    <div className="w-full relative z-20">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-7">
        <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
        Hệ sinh thái chăm sóc thú cưng 3.0
      </div>

      {/* H1 Headline — dark text for white background */}
      <h1 className="text-4xl lg:text-[3.4rem] font-heading font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
        Chăm sóc{" "}
        <span className="text-[#00A86B]">thú cưng</span>
        <br />
        <span className="text-slate-800">thông minh hơn</span>
      </h1>

      {/* Subtext */}
      <p className="text-base lg:text-lg text-slate-500 mb-9 leading-relaxed max-w-[420px]">
        Nền tảng quản lý hồ sơ sức khỏe, lịch tiêm phòng, đặt lịch khám
        và kết nối với bác sĩ thú y trực tuyến dễ dàng.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #00A86B 0%, #0EA5B7 100%)" }}
        >
          Bắt đầu ngay
          <ArrowRight size={17} />
        </Link>
        <Link
          href="#features"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/70 hover:bg-white border border-emerald-200/50 text-slate-700 font-semibold transition-all duration-200 hover:-translate-y-0.5"
        >
          Xem tính năng
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-12 pt-8 border-t border-emerald-200/60 flex items-center gap-10">
        <div>
          <div className="text-2xl font-extrabold text-slate-900 mb-0.5">2,000+</div>
          <div className="text-xs text-slate-500 font-medium">Thú cưng</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 mb-0.5">50+</div>
          <div className="text-xs text-slate-500 font-medium">Phòng khám</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 mb-0.5">4.9/5</div>
          <div className="text-xs text-slate-500 font-medium">Đánh giá</div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-7 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-emerald-200/50 text-xs font-medium text-slate-600">
          🔒 Bảo mật cao
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-emerald-200/50 text-xs font-medium text-slate-600">
          🐾 Hỗ trợ 24/7
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
          ✨ Miễn phí dùng thử
        </span>
      </div>
    </div>
  );
};

export default LeftPanel;
