"use client";

import React from "react";
import { Bell, Search, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/Avatar";
import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";


export const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuth();

  const userMenuItems: DropdownItem[] = [
    {
      key: "profile",
      label: "Tài khoản của tôi",
      icon: <UserIcon size={16} />,
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
        {/* Notification Bell */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        <div className="w-px h-6 bg-slate-200" />

        {/* User Dropdown */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full transition-colors">
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
  );
};

export default DashboardHeader;
