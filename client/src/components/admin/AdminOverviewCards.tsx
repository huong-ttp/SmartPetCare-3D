"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Dog, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Syringe, 
  TrendingUp, 
  ArrowUpRight 
} from "lucide-react";
import Link from "next/link";
import { AdminOverview } from "@/services/adminService";
import { cn } from "@/utils/cn";

interface AdminOverviewCardsProps {
  overview?: AdminOverview;
  isLoading: boolean;
}

export const AdminOverviewCards: React.FC<AdminOverviewCardsProps> = ({
  overview,
  isLoading,
}) => {
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      id: "users",
      title: "Tổng Users",
      value: overview?.totalUsers ?? 0,
      subtext: "Chủ nuôi & Bác sĩ hệ thống",
      icon: <Users className="text-blue-500" size={22} />,
      bgIcon: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      borderHover: "hover:border-blue-500/40",
      gradient: "from-blue-500/10 via-transparent to-transparent",
      href: "/admin/users",
    },
    {
      id: "pets",
      title: "Tổng Thú Cưng",
      value: overview?.totalPets ?? 0,
      subtext: "Hồ sơ thú cưng đã đăng ký",
      icon: <Dog className="text-emerald-500" size={22} />,
      bgIcon: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      borderHover: "hover:border-emerald-500/40",
      gradient: "from-emerald-500/10 via-transparent to-transparent",
      href: "/admin/pets",
    },
    {
      id: "today-appts",
      title: "Lịch Hẹn Hôm Nay",
      value: overview?.todayAppointments ?? 0,
      subtext: "Lịch hẹn trong ngày hôm nay",
      icon: <Calendar className="text-cyan-500" size={22} />,
      bgIcon: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      borderHover: "hover:border-cyan-500/40",
      gradient: "from-cyan-500/10 via-transparent to-transparent",
      href: "/admin/appointments",
    },
    {
      id: "completed-appts",
      title: "Lịch Đã Hoàn Thành",
      value: overview?.completedAppointments ?? 0,
      subtext: "Đã hoàn thành trong tháng này",
      icon: <CheckCircle2 className="text-teal-500" size={22} />,
      bgIcon: "bg-teal-500/10 text-teal-500 border-teal-500/20",
      borderHover: "hover:border-teal-500/40",
      gradient: "from-teal-500/10 via-transparent to-transparent",
      href: "/admin/appointments",
    },
    {
      id: "unpaid-invoices",
      title: "Hóa Đơn Chưa Thu",
      value: overview?.unpaidInvoices ?? 0,
      subtext: "Cần theo dõi & đôn đốc",
      icon: <AlertCircle className="text-rose-500" size={22} />,
      bgIcon: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      borderHover: "hover:border-rose-500/40",
      gradient: "from-rose-500/10 via-transparent to-transparent",
      href: "/admin/invoices",
    },
    {
      id: "revenue",
      title: "Doanh Thu Tháng Này",
      value: formatCurrency(overview?.revenue?.month ?? 0),
      subtext: `Tổng tích lũy: ${formatCurrency(overview?.revenue?.total ?? 0)}`,
      icon: <DollarSign className="text-amber-500" size={22} />,
      bgIcon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      borderHover: "hover:border-amber-500/40",
      gradient: "from-amber-500/10 via-transparent to-transparent",
      href: "/admin/invoices",
      isMoney: true,
      colSpan: "lg:col-span-2 md:col-span-2",
    },
    {
      id: "vaccines-due",
      title: "Vắc Xin Sắp Đến Hạn",
      value: overview?.vaccinesDue ?? 0,
      subtext: "Toàn hệ thống trong 7 ngày tới",
      icon: <Syringe className="text-purple-500" size={22} />,
      bgIcon: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      borderHover: "hover:border-purple-500/40",
      gradient: "from-purple-500/10 via-transparent to-transparent",
      href: "/admin/vaccinations",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "h-32 rounded-2xl bg-slate-800/40 border border-slate-800 animate-pulse",
              i === 6 ? "lg:col-span-2 md:col-span-2" : ""
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className={cn(card.colSpan ?? "")}
        >
          <Link
            href={card.href}
            className={cn(
              "group relative block h-full p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl transition-all duration-300",
              "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40",
              card.borderHover
            )}
          >
            {/* Subtle Gradient Glow Background */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-40 pointer-events-none transition-opacity group-hover:opacity-70",
                card.gradient
              )}
            />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-bold text-white tracking-tight leading-tight",
                      card.isMoney ? "text-2xl lg:text-3xl" : "text-3xl"
                    )}
                  >
                    {card.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110",
                    card.bgIcon
                  )}
                >
                  {card.icon}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">{card.subtext}</span>
                <span className="flex items-center gap-0.5 text-slate-500 group-hover:text-cyan-400 transition-colors font-medium">
                  Chi tiết <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminOverviewCards;
