import Link from "next/link";
import React from "react";
import { LogIn, UserPlus } from "lucide-react";

const NavItem: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link
    href={href}
    className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#00A86B] transition-colors duration-200 rounded-lg hover:bg-emerald-50"
  >
    {children}
  </Link>
);

export const Header: React.FC = () => {
  return (
    <header className="fixed top-4 left-4 right-4 max-w-6xl mx-auto z-50 flex items-center justify-between px-5 sm:px-6 py-3 bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-emerald-950/5 rounded-2xl transition-all duration-300">
      {/* Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
          >
            SPC
          </div>
          <span className="text-lg font-heading font-extrabold text-slate-800 hidden sm:block tracking-tight group-hover:text-[#00A86B] transition-colors">
            SmartPetCare
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-white/60 px-2 py-1 rounded-full border border-emerald-100/60 shadow-inner">
          <NavItem href="#">Trang chủ</NavItem>
          <NavItem href="#features">Tính năng 3D</NavItem>
          <NavItem href="#portal">Cổng dịch vụ</NavItem>
        </nav>
      </div>

      {/* CTA buttons */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#00A86B] bg-white/80 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition-colors duration-200 rounded-full shadow-sm"
        >
          <LogIn size={14} />
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white rounded-full shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-px transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
        >
          <UserPlus size={14} />
          Đăng ký
        </Link>
      </div>
    </header>
  );
};

export default Header;
