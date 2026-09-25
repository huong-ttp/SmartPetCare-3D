"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Search, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/Avatar";
import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import { notificationService } from "@/services/notificationService";

import { useRouter } from "next/navigation";

export const DashboardHeader: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-500 text-sm max-w-xs w-full">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="bg-transparent outline-none w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full transition-colors cursor-pointer">
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
