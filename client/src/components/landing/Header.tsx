import Link from "next/link";
import React from "react";
import { LogIn, UserPlus } from "lucide-react";

const NavItem: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link href={href} className="px-3 py-2 text-sm font-medium text-white/90 underline-anim">
    {children}
  </Link>
);

export const Header: React.FC = () => {
  return (
    <header className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-primary rounded-xl shadow-glow flex items-center justify-center text-white font-bold text-sm">
            SPC
          </div>
          <span className="text-xl font-heading font-bold text-white hidden sm:block">
            SmartPetCare
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <NavItem href="#">Trang chủ</NavItem>
          <NavItem href="#features">Tính năng</NavItem>
          <NavItem href="#about">Về chúng tôi</NavItem>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">
          <LogIn size={16} />
          Đăng nhập
        </Link>
        <Link href="/register" className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-white text-[#0EA5B7] rounded-full hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl">
          <UserPlus size={16} />
          Đăng ký
        </Link>
      </div>
    </header>
  );
};

export default Header;
