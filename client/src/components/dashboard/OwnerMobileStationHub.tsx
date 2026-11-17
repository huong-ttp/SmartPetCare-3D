"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Dog, 
  Sparkles, 
  ReceiptText, 
  ArrowRight, 
  PlusCircle,
  ExternalLink,
  Hospital,
  ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";

interface OwnerMobileStationHubProps {
  totalPets: number;
  upcomingAppts: number;
  unpaidInvoices: number;
  isLoading?: boolean;
}

export const OwnerMobileStationHub: React.FC<OwnerMobileStationHubProps> = ({
  totalPets,
  upcomingAppts,
  unpaidInvoices,
  isLoading = false,
}) => {
  const router = useRouter();

  const stations = [
    {
      id: "reception",
      title: "Quầy Lễ Tân & Đặt Lịch",
      subtitle: "Tiếp đón & Đặt hẹn khám",
      icon: "📅",
      badgeText: upcomingAppts > 0 ? `${upcomingAppts} Lịch sắp tới` : "Đặt hẹn ngay",
      badgeColor: upcomingAppts > 0 
        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
        : "bg-blue-50 text-blue-700 border-blue-200",
      accentBg: "bg-emerald-500",
      borderColor: "border-emerald-200/80 hover:border-emerald-400",
      desc: "Đặt lịch khám mới với bác sĩ, xem danh sách ca khám và thời gian tiếp đón tại phòng khám.",
      mainHref: "/appointments",
      quickActions: [
        { label: "Đặt lịch hẹn mới", href: "/appointments/create?from=lobby" },
        { label: "Xem lịch của tôi", href: "/appointments" },
      ],
    },
    {
      id: "doctor",
      title: "Phòng Khám Thú Y",
      subtitle: "Bác sĩ & Hồ sơ sức khỏe",
      icon: "🩺",
      badgeText: totalPets > 0 ? `${totalPets} Bé cưng đang quản lý` : "Chưa có thú cưng",
      badgeColor: totalPets > 0 
        ? "bg-teal-50 text-teal-700 border-teal-200" 
        : "bg-amber-50 text-amber-700 border-amber-200",
      accentBg: "bg-teal-500",
      borderColor: "border-teal-200/80 hover:border-teal-400",
      desc: "Theo dõi tình trạng sức khỏe, cân nặng, tiền sử bệnh án và hồ sơ bệnh án của các bé.",
      mainHref: "/pets",
      quickActions: [
        { label: "Danh sách thú cưng", href: "/pets" },
        { label: "Thêm bé mới", href: "/pets/create" },
      ],
    },
    {
      id: "pharmacy",
      title: "Nhà Thuốc & Vắc Xin",
      subtitle: "Dịch vụ & Tiêm phòng",
      icon: "💊",
      badgeText: "Bảng giá dịch vụ",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      accentBg: "bg-purple-500",
      borderColor: "border-purple-200/80 hover:border-purple-400",
      desc: "Tra cứu danh mục vắc xin phòng bệnh, liệu trình tiêm chủng và các gói chăm sóc y tế toàn diện.",
      mainHref: "/services",
      quickActions: [
        { label: "Dịch vụ phòng khám", href: "/services" },
        { label: "Đặt lịch tiêm", href: "/appointments/create?from=lobby" },
      ],
    },
    {
      id: "cashier",
      title: "Quầy Thu Ngân & Viện Phí",
      subtitle: "Hóa đơn & Thanh toán",
      icon: "💳",
      badgeText: unpaidInvoices > 0 ? `${unpaidInvoices} Cần thanh toán` : "Đã thanh toán",
      badgeColor: unpaidInvoices > 0 
        ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" 
        : "bg-slate-100 text-slate-700 border-slate-200",
      accentBg: unpaidInvoices > 0 ? "bg-rose-500" : "bg-amber-500",
      borderColor: unpaidInvoices > 0 ? "border-rose-300" : "border-amber-200/80 hover:border-amber-400",
      desc: "Tra cứu hóa đơn điều trị, viện phí nội trú và xem lịch sử các khoản thanh toán trực tuyến.",
      mainHref: "/invoices",
      quickActions: [
        { label: "Xem hóa đơn", href: "/invoices" },
        { label: "Lịch sử viện phí", href: "/invoices" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-44 rounded-2xl bg-white border border-stone-200/80 p-5 shadow-sm animate-pulse space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-9 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Hospital size={18} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Các Khu Vực Dịch Vụ Bệnh Viện
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Chạm để điều hướng
        </span>
      </div>

      {/* 4 Station Cards in Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stations.map((st) => (
          <motion.div
            key={st.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "p-4 sm:p-5 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group",
              st.borderColor
            )}
          >
            {/* Card Header */}
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 shrink-0">
                    {st.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                      {st.subtitle}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug truncate">
                      {st.title}
                    </h3>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0",
                    st.badgeColor
                  )}
                >
                  {st.badgeText}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                {st.desc}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Truy cập nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {st.quickActions.map((qa, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => router.push(qa.href)}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>{qa.label}</span>
                    <ChevronRight size={10} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => router.push(st.mainHref)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Vào xem chi tiết</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OwnerMobileStationHub;
