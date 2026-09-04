import React from "react";
import Link from "next/link";
import { LogIn, ArrowRight } from "lucide-react";

export const LeftPanel: React.FC = () => {
  return (
    <div className="w-full relative z-20">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0EA5B7]/10 border border-[#0EA5B7]/20 text-[#0EA5B7] text-xs font-semibold tracking-wide uppercase mb-6 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-[#0EA5B7] animate-pulse" />
        Hệ sinh thái chăm sóc thú cưng 3.0
      </div>

      <h1 className="text-4xl lg:text-6xl font-heading font-extrabold text-white leading-[1.1] mb-6">
        Chăm sóc <span className="text-transparent bg-clip-text gradient-primary">thú cưng</span><br/>
        thông minh hơn
      </h1>

      <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-md">
        Nền tảng quản lý hồ sơ sức khỏe, lịch tiêm phòng, đặt lịch khám và kết nối với bác sĩ thú y trực tuyến dễ dàng.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/register"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full gradient-primary text-white font-semibold shadow-glow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          Bắt đầu ngay
          <ArrowRight size={18} />
        </Link>
        <Link 
          href="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold backdrop-blur-md transition-all duration-200"
        >
          <LogIn size={18} />
          Đăng nhập
        </Link>
      </div>

      {/* Stats/Social Proof */}
      <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-8">
        <div>
          <div className="text-2xl font-bold text-white mb-1">2,000+</div>
          <div className="text-xs text-slate-400">Thú cưng</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white mb-1">50+</div>
          <div className="text-xs text-slate-400">Phòng khám</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white mb-1">4.9/5</div>
          <div className="text-xs text-slate-400">Đánh giá</div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
