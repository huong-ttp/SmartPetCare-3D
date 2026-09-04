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
    <div id="features" className="w-full mt-16 mb-8">
      <h2 className="text-2xl font-heading font-bold text-white mb-6 text-center">
        Tính năng nổi bật
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div
            key={f.id}
            className="glass-dark p-5 rounded-2xl hover:-translate-y-1 hover:shadow-glow transition-all duration-300"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", f.bg, f.color)}>
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
