"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle, Hospital, Monitor } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { petService } from "@/services/petService";
import { appointmentService } from "@/services/appointmentService";
import { notificationService } from "@/services/notificationService";
import { invoiceService } from "@/services/invoiceService";
import type { Appointment } from "@/types/appointment.type";
import { useAuth } from "@/lib/auth-context";
import FloatingPanel from "@/components/dashboard/FloatingPanel";
import OwnerMobileStationHub from "@/components/dashboard/OwnerMobileStationHub";

// Dynamic import for 3D component to disable SSR
const Lobby3D = dynamic(() => import("@/components/dashboard/Lobby3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl space-y-3">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0EA5B7] rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500">Đang khởi tạo không gian bệnh viện 3D...</p>
    </div>
  ),
});

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  
  const [totalPets, setTotalPets] = useState(0);
  const [upcomingAppts, setUpcomingAppts] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Responsive device check: Desktop (>= 1024px) vs Mobile/Tablet (< 1024px)
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      setErrorMsg("");

      try {
        // Fetch all in parallel for performance
        const [pets, appts, invs, notifs] = await Promise.all([
          petService.getMyPets(),
          appointmentService.getMyAppointments(),
          invoiceService.getMyInvoices().catch(() => []),
          notificationService.list({ unread: true }).catch(() => []),
        ]);

        const invoices = Array.isArray(invs) ? invs : [];

        setTotalPets(Array.isArray(pets) ? pets.length : 0);

        // Normalize appts
        const rawAppts = appts as Appointment[] | { data?: Appointment[]; items?: Appointment[] } | null | undefined;
        const appointmentsList: Appointment[] = Array.isArray(rawAppts)
          ? rawAppts
          : Array.isArray(rawAppts?.data)
          ? rawAppts.data
          : Array.isArray(rawAppts?.items)
          ? rawAppts.items
          : [];

        // Filter upcoming appts: confirmed + scheduled_at in future
        const now = new Date();
        const upcoming = appointmentsList.filter((a) =>
          a?.status === "confirmed" && a?.scheduled_at && new Date(a.scheduled_at) >= now
        );
        setUpcomingAppts(upcoming.length);

        // Unread notifs
        const unread = notifs.filter(n => !n.is_read);
        setUnreadNotifs(unread.length);

        // Unpaid invoices
        const unpaid = invoices.filter(i => i.status === "unpaid");
        setUnpaidInvoices(unpaid.length);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setErrorMsg("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Hospital className="text-[#2563eb]" size={26} />
            {isMounted && isDesktop ? "Không gian Bệnh viện Thú y 3D" : "Tổng Quan Dịch Vụ Bệnh Viện"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Chào mừng {user?.full_name ? <span className="font-medium text-slate-700">{user.full_name}</span> : "bạn"} • Khám phá và điều hướng nhanh các khu vực dịch vụ
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Desktop 3D Availability Hint on Mobile */}
          {isMounted && !isDesktop && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
              <Monitor size={14} className="text-[#2563eb]" />
              <span>3D trên máy tính</span>
            </span>
          )}

          {totalPets === 0 && !isLoading && (
            <Link
              href="/pets/create"
              className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
            >
              <PlusCircle size={16} />
              <span>Thêm thú cưng ngay</span>
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Overview HUD (4 Stats Cards) */}
      <FloatingPanel 
        isLoading={isLoading}
        totalPets={totalPets}
        upcomingApptsCount={upcomingAppts}
        unreadNotifsCount={unreadNotifs}
        unpaidInvoicesCount={unpaidInvoices}
      />

      {/* CONDITIONAL RENDERING: 3D ON DESKTOP (>= 1024px), MOBILE STATION HUB ON MOBILE/TABLET (< 1024px) */}
      {isMounted && isDesktop ? (
        /* ================= DESKTOP 3D VIEWPORT (>= 1024px) ================= */
        <div className="relative w-full h-[calc(100vh-16rem)] min-h-[500px] rounded-2xl overflow-hidden shadow-sm border border-blue-200/80 bg-blue-50/50">
          <Lobby3D totalPets={totalPets} />

          {/* Error Toast */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 right-4 z-20 bg-rose-500 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-medium"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ================= MOBILE / TABLET 2D STATION HUB (< 1024px) ================= */
        <div className="space-y-4">
          <OwnerMobileStationHub 
            totalPets={totalPets}
            upcomingAppts={upcomingAppts}
            unpaidInvoices={unpaidInvoices}
            isLoading={isLoading}
          />

          {/* Error Toast */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
