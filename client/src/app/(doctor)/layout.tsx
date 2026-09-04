"use client";

import React, { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth-context";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { requireRole } = useAuth();

  useEffect(() => {
    requireRole("doctor");
  }, [requireRole]);

  return <DashboardLayout>{children}</DashboardLayout>;
}
