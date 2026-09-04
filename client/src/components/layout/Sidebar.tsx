"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { 
  Home, 
  Calendar, 
  Dog, 
  FileText, 
  CreditCard, 
  Settings, 
  Users,
  Activity
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const OWNER_NAV: NavItem[] = [
  { name: "Tổng quan", href: "/dashboard", icon: <Home size={20} /> },
  { name: "Thú cưng", href: "/pets", icon: <Dog size={20} /> },
  { name: "Lịch hẹn", href: "/appointments", icon: <Calendar size={20} /> },
  { name: "Hóa đơn", href: "/invoices", icon: <CreditCard size={20} /> },
];

const DOCTOR_NAV: NavItem[] = [
  { name: "Lịch làm việc", href: "/doctor/schedule", icon: <Calendar size={20} /> },
  { name: "Bệnh án", href: "/doctor/medical-records", icon: <FileText size={20} /> },
  { name: "Nhật ký sức khỏe", href: "/doctor/health-logs", icon: <Activity size={20} /> },
];

const ADMIN_NAV: NavItem[] = [
  { name: "Thống kê", href: "/admin/dashboard", icon: <Home size={20} /> },
  { name: "Quản lý Bác sĩ", href: "/admin/doctors", icon: <Users size={20} /> },
  { name: "Quản lý Lịch hẹn", href: "/admin/appointments", icon: <Calendar size={20} /> },
  { name: "Quản lý Dịch vụ", href: "/admin/services", icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  let navItems: NavItem[] = [];
  if (user?.role === "owner") navItems = OWNER_NAV;
  else if (user?.role === "doctor") navItems = DOCTOR_NAV;
  else if (user?.role === "admin") navItems = ADMIN_NAV;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden md:flex h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-lg text-slate-800">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs">
            SPC
          </div>
          SmartPetCare
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-50 text-[#0EA5B7]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span className={cn(isActive ? "text-[#0EA5B7]" : "text-slate-400")}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center text-center">
          <p className="text-xs text-slate-500 mb-2">Cần trợ giúp?</p>
          <button className="text-sm font-medium text-[#0EA5B7] hover:underline">
            Liên hệ hỗ trợ
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
