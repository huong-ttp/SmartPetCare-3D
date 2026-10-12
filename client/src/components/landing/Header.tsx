"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, LayoutDashboard, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/Avatar";
import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";

const NavItem: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link
    href={href}
    className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#00A86B] transition-colors duration-200 rounded-lg hover:bg-emerald-50"
  >
    {children}
  </Link>
);

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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

  const getRoleBadge = (role?: string) => {
    if (role === "admin") return "Quản trị viên";
    if (role === "doctor") return "Bác sĩ";
    return "Chủ nuôi";
  };

  const userMenuItems: DropdownItem[] = [
    {
      key: "dashboard",
      label: "Bảng điều khiển",
      icon: <LayoutDashboard size={15} />,
      onClick: () => router.push(dashboardUrl),
    },
    {
      key: "profile",
      label: "Tài khoản của tôi",
      icon: <UserIcon size={15} />,
      onClick: () => router.push("/profile"),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogOut size={15} />,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <header className="fixed top-4 left-4 right-4 max-w-6xl mx-auto z-50 flex items-center justify-between px-5 sm:px-6 py-3 bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-emerald-950/5 rounded-2xl transition-all duration-300">
      {/* Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
          >
            <Image
              src="/images/whitelogo.png"
              alt="SmartPetCare Logo"
              width={24}
              height={24}
              className="w-full h-full object-contain"
              priority
            />
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

      {/* CTA or User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!mounted || isLoading ? (
          <div className="flex items-center gap-2 py-1">
            <div className="w-20 h-8 rounded-full bg-slate-100 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
          </div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Link back to Dashboard */}
            <Link
              href={dashboardUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-px transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Vào Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>

            {/* User Dropdown Menu */}
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition-all cursor-pointer group">
                  <Avatar
                    name={user?.full_name}
                    size="sm"
                    src={user?.avatar_url || (user as any)?.avatar}
                    className="ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all"
                  />
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px] group-hover:text-[#00A86B] transition-colors">
                      {user?.full_name || "Tài khoản"}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize leading-tight">
                      {getRoleBadge(user?.role)}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-y-0.5 hidden sm:block"
                  />
                </div>
              }
              items={userMenuItems}
              placement="bottom-right"
            />
          </div>
        ) : (
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
        )}
      </div>
    </header>
  );
};

export default Header;
