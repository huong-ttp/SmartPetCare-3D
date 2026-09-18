"use client";

import React from "react";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth-context";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, requireRole } = useAuth();
  const pathname = usePathname();

  // BẮT BUỘC: chờ AuthProvider hydrate xong từ localStorage mới render.
  // Nếu render sớm, children sẽ gọi API/guard khi token chưa sẵn sàng.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Cho phép doctor và admin truy cập chi tiết lịch hẹn tại /appointments và hồ sơ bệnh nhân tại /pets/[id]
  const isSharedRoute =
    pathname?.startsWith("/appointments") ||
    (pathname?.startsWith("/pets/") && !pathname?.startsWith("/pets/create"));
  const allowedRoles = isSharedRoute ? (["owner", "doctor", "admin"] as const) : "owner";

  // Hydrate xong — kiểm tra role. requireRole tự gọi router.push("/login") nếu sai.
  if (!requireRole(allowedRoles as any)) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
