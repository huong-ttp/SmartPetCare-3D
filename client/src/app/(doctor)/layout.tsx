"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth-context";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, requireRole } = useAuth();

  // Chờ hydrate xong mới render — tránh race condition
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!requireRole("doctor")) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
