"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { petService } from "@/services/petService";
import { appointmentService } from "@/services/appointmentService";
import { notificationService } from "@/services/notificationService";
import { invoiceService } from "@/services/invoiceService";
import { useAuth } from "@/lib/auth-context";

// Dynamic import for 3D component to disable SSR
const Lobby3D = dynamic(() => import("@/components/dashboard/Lobby3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  ),
});

// Dynamic import FloatingPanel if needed, or static is fine since it's 2D
import FloatingPanel from "@/components/dashboard/FloatingPanel";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  
  const [totalPets, setTotalPets] = useState(0);
  const [upcomingAppts, setUpcomingAppts] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      setErrorMsg("");

      try {
        // Fetch all in parallel for performance
        const [pets, appts, notifs, invoices] = await Promise.all([
          petService.getMyPets(),
          appointmentService.getMyAppointments(),
          notificationService.getMyNotifications(),
          invoiceService.getMyInvoices()
        ]);

        setTotalPets(pets.length);
        
        // Filter upcoming appts: simple logic for demo (status confirmed and date in future)
        const now = new Date();
        const upcoming = appts.filter(a => 
          a.status === "confirmed" && new Date(a.scheduled_at) >= now
        );
        setUpcomingAppts(upcoming.length);

        // Unread notifs
        const unread = notifs.filter(n => !n.is_read);
        setUnreadNotifs(unread.length);

        // Unpaid invoices
        const unpaid = invoices.filter(i => i.status === "unpaid");
        setUnpaidInvoices(unpaid.length);

      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setErrorMsg("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800">
      
      {/* 3D Scene */}
      <Lobby3D />

      {/* Floating Panel overlay */}
      <FloatingPanel 
        isLoading={isLoading}
        totalPets={totalPets}
        upcomingApptsCount={upcomingAppts}
        unreadNotifsCount={unreadNotifs}
        unpaidInvoicesCount={unpaidInvoices}
      />

      {/* Error Toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 right-6 z-20 bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-md"
          >
            <p className="text-sm font-medium">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State Overlay */}
      <AnimatePresence>
        {!isLoading && totalPets === 0 && !errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-10 right-10 z-20"
          >
            <Link 
              href="/pets/create"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform"
            >
              <div className="bg-white/20 p-2 rounded-xl">
                <PlusCircle size={24} />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">Thêm thú cưng</p>
                <p className="text-xs text-white/80">Bắt đầu quản lý ngay</p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
