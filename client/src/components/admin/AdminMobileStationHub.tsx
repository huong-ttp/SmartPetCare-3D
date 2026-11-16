"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, 
  Calendar, 
  Syringe, 
  CreditCard, 
  ArrowRight, 
  ExternalLink,
  Sparkles,
  Layers
} from "lucide-react";
import { AdminOverview } from "@/services/adminService";
import { cn } from "@/utils/cn";

interface AdminMobileStationHubProps {
  overview?: AdminOverview;
  isLoading?: boolean;
}

export const AdminMobileStationHub: React.FC<AdminMobileStationHubProps> = ({
  overview,
  isLoading = false,
}) => {
  const router = useRouter();

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stations = [
    {
      id: "users",
      title: "Quầy Tiếp Đón & Người Dùng",
      subtitle: "Phân hệ Nhân sự & Tài khoản",
      icon: "👥",
      badgeText: `${overview?.totalUsers ?? 0} Tài khoản`,
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      accentGradient: "from-blue-600 to-indigo-600",
      accentBorder: "border-blue-500/30",
      glowColor: "shadow-blue-500/10",
      desc: "Giám sát tài khoản khách hàng, bác sĩ thú y và phân bổ ca trực lâm sàng.",
      mainHref: "/admin/users",
      quickActions: [
        { label: "Người dùng", href: "/admin/users" },
        { label: "Ca trực bác sĩ", href: "/admin/shifts" },
        { label: "Thú cưng", href: "/admin/pets" },
      ],
    },
    {
      id: "appointments",
      title: "Phòng Khám & Điều Phối",
      subtitle: "Phân hệ Vận hành Khám bệnh",
      icon: "📅",
      badgeText: `${overview?.todayAppointments ?? 0} Lịch hôm nay`,
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      accentGradient: "from-emerald-600 to-teal-600",
      accentBorder: "border-emerald-500/30",
      glowColor: "shadow-emerald-500/10",
      desc: "Điều phối ca khám trong ngày, trạng thái tiếp nhận và ca trực bác sĩ đang phục vụ.",
      mainHref: "/admin/appointments",
      quickActions: [
        { label: "Lịch hôm nay", href: "/admin/appointments" },
        { label: "Phân ca trực", href: "/admin/shifts" },
      ],
    },
    {
      id: "services",
      title: "Nhà Thuốc & Kho Vắc Xin",
      subtitle: "Phân hệ Dược & Y tế",
      icon: "💉",
      badgeText: `${overview?.vaccinesDue ?? 0} Vắc xin đến hạn`,
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      accentGradient: "from-purple-600 to-fuchsia-600",
      accentBorder: "border-purple-500/30",
      glowColor: "shadow-purple-500/10",
      desc: "Theo dõi tồn kho vắc xin, theo dõi hạn dùng thuốc và danh mục dịch vụ điều trị.",
      mainHref: "/admin/vaccine-types",
      quickActions: [
        { label: "Danh mục vắc xin", href: "/admin/vaccine-types" },
        { label: "Sổ tiêm chủng", href: "/admin/vaccinations" },
        { label: "Dịch vụ phòng khám", href: "/admin/services" },
      ],
    },
    {
      id: "finance",
      title: "Quầy Thu Ngân & Viện Phí",
      subtitle: "Phân hệ Kế toán & Dòng tiền",
      icon: "💳",
      badgeText: `${formatCurrency(overview?.revenue?.month ?? 0)} Doanh thu`,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      accentGradient: "from-amber-600 to-orange-600",
      accentBorder: "border-amber-500/30",
      glowColor: "shadow-amber-500/10",
      desc: "Theo dõi doanh thu phòng khám, hóa đơn chưa thu và các giao dịch thanh toán POS.",
      mainHref: "/admin/invoices",
      quickActions: [
        { label: "Hóa đơn viện phí", href: "/admin/invoices" },
        { label: "Lịch sử thanh toán", href: "/admin/payments" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 animate-pulse space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-3 w-20 bg-slate-800 rounded" />
              </div>
            </div>
            <div className="h-10 bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Hub Header Title */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Trung Tâm 4 Trạm Nghiệp Vụ
          </h2>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-white/5">
          Mobile Station Hub
        </span>
      </div>

      {/* 4 Station Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stations.map((st) => (
          <motion.div
            key={st.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "p-4 sm:p-5 rounded-2xl bg-slate-900/90 border backdrop-blur-md shadow-xl transition-all flex flex-col justify-between space-y-3.5 group",
              st.accentBorder,
              st.glowColor
            )}
          >
            {/* Card Header */}
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl p-2 rounded-xl bg-slate-800/90 border border-white/10 shrink-0">
                    {st.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                      {st.subtitle}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug truncate">
                      {st.title}
                    </h3>
                  </div>
                </div>

                {/* Live Stat Badge */}
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0",
                    st.badgeColor
                  )}
                >
                  {st.badgeText}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                {st.desc}
              </p>
            </div>

            {/* Quick Link Pills */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Truy cập nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {st.quickActions.map((qa, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => router.push(qa.href)}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/90 active:bg-slate-700 hover:text-white rounded-lg border border-white/5 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>{qa.label}</span>
                    <ExternalLink size={9} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => router.push(st.mainHref)}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer active:scale-[0.98] bg-gradient-to-r",
                st.accentGradient
              )}
            >
              <span>Vào trang quản lý</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminMobileStationHub;
