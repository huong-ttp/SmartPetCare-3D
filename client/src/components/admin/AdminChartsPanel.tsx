"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { 
  AppointmentStatItem, 
  RevenueStatItem, 
  UserStatItem, 
  VaccinationStatItem 
} from "@/services/adminService";
import { Calendar, DollarSign, Users, Syringe, PieChart as PieIcon } from "lucide-react";

interface AdminChartsPanelProps {
  appointmentStatistics?: AppointmentStatItem[];
  revenueStatistics?: RevenueStatItem[];
  userStatistics?: UserStatItem[];
  vaccinationStatistics?: VaccinationStatItem[];
  isLoading?: boolean;
}

// Colors for status mapping
const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981", // emerald
  confirmed: "#06b6d4", // cyan
  pending: "#f59e0b",   // amber
  cancelled: "#ef4444", // rose
  in_progress: "#8b5cf6", // purple
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Hoàn thành",
  confirmed: "Đã xác nhận",
  pending: "Chờ xử lý",
  cancelled: "Đã hủy",
  in_progress: "Đang khám",
};

const VACCINE_COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

export const AdminChartsPanel: React.FC<AdminChartsPanelProps> = ({
  appointmentStatistics = [],
  revenueStatistics = [],
  userStatistics = [],
  vaccinationStatistics = [],
  isLoading,
}) => {
  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M đ`;
    }
    return `${(val / 1_000).toFixed(0)}k đ`;
  };

  const formatCurrencyFull = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Prepare normalized appointment data
  const normalizedAppointments = appointmentStatistics.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    rawStatus: item.status,
    value: Number(item.total) || 0,
    color: STATUS_COLORS[item.status] || "#94a3b8",
  }));

  // Prepare normalized revenue data
  const normalizedRevenue = revenueStatistics.map((item) => ({
    month: item.month,
    revenue: Number(item.revenue) || 0,
  }));

  // Prepare normalized user data
  const normalizedUsers = userStatistics.map((item) => ({
    month: item.month,
    total: Number(item.total) || 0,
  }));

  // Prepare normalized vaccination data
  const normalizedVaccines = vaccinationStatistics.map((item, idx) => ({
    name: item.name,
    total: Number(item.total) || 0,
    color: VACCINE_COLORS[idx % VACCINE_COLORS.length],
  }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-80 rounded-2xl bg-slate-800/40 border border-slate-800 animate-pulse p-6"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. REVENUE STATISTICS CHART */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Doanh Thu Theo Tháng</h3>
              <p className="text-xs text-slate-400">Xu hướng dòng tiền thực thu từ hóa đơn đã thanh toán</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {normalizedRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={normalizedRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs">
                          <p className="font-semibold text-slate-300">Tháng: {label}</p>
                          <p className="text-amber-400 font-bold mt-1 text-sm">
                            {formatCurrencyFull(Number(payload[0].value))}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </div>
      </div>

      {/* 2. APPOINTMENT STATUS DISTRIBUTION */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Thống Kê Lịch Hẹn</h3>
              <p className="text-xs text-slate-400">Tỷ lệ phân bố trạng thái các cuộc hẹn khám</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {normalizedAppointments.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalizedAppointments}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {normalizedAppointments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="text-cyan-400 font-bold mt-0.5">{data.value} lịch hẹn</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-300 ml-1">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Chưa có dữ liệu lịch hẹn
            </div>
          )}
        </div>
      </div>

      {/* 3. USER GROWTH STATISTICS */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tăng Trưởng Người Dùng Mới</h3>
              <p className="text-xs text-slate-400">Số lượng tài khoản đăng ký theo từng tháng</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {normalizedUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedUsers} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                          <p className="font-semibold text-slate-300">Tháng: {label}</p>
                          <p className="text-blue-400 font-bold mt-1 text-sm">
                            +{payload[0].value} người dùng mới
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Chưa có dữ liệu người dùng
            </div>
          )}
        </div>
      </div>

      {/* 4. TOP VACCINATION STATISTICS */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Syringe size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Thống Kê Tiêm Chủng Phổ Biến</h3>
              <p className="text-xs text-slate-400">Các loại vắc xin được tiêm nhiều nhất hệ thống</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {normalizedVaccines.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={normalizedVaccines}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="text-purple-400 font-bold mt-1 text-sm">
                            {data.total} lượt tiêm
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {normalizedVaccines.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Chưa có dữ liệu tiêm chủng
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChartsPanel;
