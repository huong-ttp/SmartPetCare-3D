"use client";

import React from "react";
import { Calendar, Activity, Syringe, FileText } from "lucide-react";
import { cn } from "@/utils/cn";

const features = [
  {
    id: 1,
    title: "Đặt lịch dễ dàng",
    description: "Chủ động chọn dịch vụ và thời gian khám cho thú cưng.",
    icon: <Calendar size={24} />,
    color: "text-[#0EA5B7]",
    bg: "bg-[#0EA5B7]/10",
  },
  {
    id: 2,
    title: "Theo dõi sức khỏe",
    description: "Nhật ký cân nặng, nhiệt độ và các triệu chứng chi tiết.",
    icon: <Activity size={24} />,
    color: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
  },
  {
    id: 3,
    title: "Nhắc nhở tiêm phòng",
    description: "Tự động tính ngày tiêm nhắc và gửi thông báo.",
    icon: <Syringe size={24} />,
    color: "text-[#FB923C]",
    bg: "bg-[#FB923C]/10",
  },
  {
    id: 4,
    title: "Bệnh án điện tử",
    description: "Lưu trữ toàn bộ hồ sơ khám bệnh an toàn và tiện lợi.",
    icon: <FileText size={24} />,
    color: "text-[#8b5cf6]",
    bg: "bg-[#8b5cf6]/10",
  },
];

export const Features: React.FC = () => {
  return (
    <div id="features" className="w-full my-12">
      <div className="rounded-3xl p-7 sm:p-11 bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl shadow-emerald-950/10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            ✨ Tính năng nổi bật
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 tracking-tight mb-2">
            Giải pháp thông minh toàn diện cho bé cưng
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Mọi công cụ bạn cần để theo dõi sức khỏe và chăm sóc thú cưng toàn diện nhất trong kỷ nguyên số.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.id}
              className="bg-white/75 hover:bg-white border border-slate-200/80 hover:border-emerald-300 p-6 rounded-2xl hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-600/10 transition-all duration-300 shadow-sm"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", f.bg, f.color)}>
                {f.icon}
              </div>
              <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
