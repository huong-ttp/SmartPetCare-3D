"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Search, LogOut, User as UserIcon, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/Avatar";
import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import { notificationService } from "@/services/notificationService";
import { OWNER_NAV, DOCTOR_NAV, ADMIN_NAV, NavItem } from "@/components/layout/Sidebar";
import { cn } from "@/utils/cn";

export const DashboardHeader: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("spc_access_token")) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Polling every 60s for new notifications
      const timer = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(timer);
    }
  }, [user, fetchUnreadCount]);

  // Đóng mobile drawer khi chuyển trang
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Khóa scroll khi mobile drawer mở
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileNavOpen]);

  let navItems: NavItem[] = [];
  if (user?.role === "owner") navItems = OWNER_NAV;
  else if (user?.role === "doctor") navItems = DOCTOR_NAV;
  else if (user?.role === "admin") navItems = ADMIN_NAV;

  const userMenuItems: DropdownItem[] = [
    {
      key: "profile",
      label: "Tài khoản của tôi",
      icon: <UserIcon size={16} />,
      onClick: () => router.push("/profile"),
    },
    {
      key: "notifications",
      label: "Thông báo & Nhắc lịch",
      icon: <Bell size={16} />,
      onClick: () => setIsDrawerOpen(true),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogOut size={16} />,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            title="Mở menu"
            aria-label="Mở menu điều hướng"
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20"
          >
            <Menu size={22} />
          </button>

          {/* Mobile Logo */}
          <Link href="/" className="md:hidden flex items-center gap-2 font-heading font-bold text-base text-slate-800">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
              SPC
            </div>
            <span className="font-semibold text-slate-800 truncate">SmartPetCare</span>
          </Link>

          {/* Search (Desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-500 text-sm max-w-xs w-full">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="bg-transparent outline-none w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            title="Trung tâm thông báo"
            aria-label="Xem thông báo"
            className="relative p-2 text-slate-500 hover:text-[#0EA5B7] hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20"
          >
            <Bell size={20} className={unreadCount > 0 ? "transition-transform active:scale-95" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {/* User Dropdown */}
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 sm:gap-3 hover:bg-slate-50 p-1 pr-2 sm:pr-3 rounded-full transition-colors cursor-pointer">
                <Avatar name={user?.full_name} size="sm" src={user?.avatar_url} />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700 line-clamp-1">{user?.full_name || "User"}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>
            }
            items={userMenuItems}
          />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <Link
                href="/"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-2 font-heading font-bold text-base text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  SPC
                </div>
                <span>SmartPetCare</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Đóng menu"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* User profile quick view */}
            {user && (
              <div className="p-3.5 mx-3 mt-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                <Avatar name={user?.full_name} size="md" src={user?.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || "User"}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>
            )}

            {/* Navigation List */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sky-50 text-[#0EA5B7] font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span className={cn(isActive ? "text-[#0EA5B7]" : "text-slate-400")}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors w-full"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Drawer Component */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          fetchUnreadCount();
        }}
        onItemRead={fetchUnreadCount}
      />
    </>
  );
};

export default DashboardHeader;
