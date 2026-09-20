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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
               style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}>
            SPC
          </div>
          <span className="text-lg font-heading font-bold text-slate-800 hidden sm:block tracking-tight">
            SmartPetCare
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-full border border-slate-200">
          <NavItem href="#">Trang chủ</NavItem>
          <NavItem href="#features">Tính năng</NavItem>
          <NavItem href="#about">Về chúng tôi</NavItem>
        </nav>
      </div>

      {/* CTA buttons */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 hover:text-[#00A86B] transition-colors duration-200 rounded-full hover:bg-emerald-50"
        >
          <LogIn size={15} />
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
        >
          <UserPlus size={15} />
          Đăng ký
        </Link>
      </div>
    </header>
  );
};

export default Header;
