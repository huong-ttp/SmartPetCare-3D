"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth-context";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, requireRole } = useAuth();

  // BẮT BUỘC: chờ AuthProvider hydrate xong từ localStorage mới render.
  // Nếu render sớm, children sẽ gọi API/guard khi token chưa sẵn sàng.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Hydrate xong — kiểm tra role. requireRole tự gọi router.push("/login") nếu sai.
  if (!requireRole("owner")) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
