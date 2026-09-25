"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Scale, Ruler, Sparkles, Thermometer, AlertCircle } from "lucide-react";
import type { PetHealthLog } from "@/types/health-log.type";
import type { MedicalRecord } from "@/types/medical-record.type";
import { formatDate } from "@/utils/formatDate";

interface HealthLogChartsProps {
  logs: PetHealthLog[];
  medicalRecords?: MedicalRecord[];
  petName: string;
}

interface ChartDataPoint {
  dateKey: string;
  timestamp: number;
  formattedDate: string;
  ownerWeight?: number | null;
  clinicalWeight?: number | null;
  temperature?: number | null;
  height?: number | null;
  ownerNotes?: string;
  diagnosis?: string;
}

export const HealthLogCharts: React.FC<HealthLogChartsProps> = ({
  logs,
  medicalRecords = [],
  petName,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"weight" | "temperature" | "height">("weight");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Process data points for weight, temperature, and height
  const chartData = useMemo(() => {
    const map = new Map<string, ChartDataPoint>();

    // 1. Process health logs (owner/routine logs + doctor logs)
    logs.forEach((l) => {
      const dateStr = l.log_date ? l.log_date.split("T")[0] : "";
      if (!dateStr) return;

      const current: ChartDataPoint = map.get(dateStr) || {
        dateKey: dateStr,
        timestamp: new Date(dateStr).getTime(),
        formattedDate: formatDate(dateStr),
      };

      if (l.weight_kg !== undefined && l.weight_kg !== null) {
        current.ownerWeight = Number(l.weight_kg);
      }
      if (l.temperature !== undefined && l.temperature !== null) {
        current.temperature = Number(l.temperature);
      }
      if (l.height_cm !== undefined && l.height_cm !== null) {
        current.height = Number(l.height_cm);
      }
      if (l.notes) {
        current.ownerNotes = l.notes;
      }
      map.set(dateStr, current);
    });

    // 2. Process medical records (clinical visits weight_at_visit)
    medicalRecords.forEach((mr) => {
      const rawDate = (mr as any).visit_date || (mr as any).record_date || (mr as any).created_at || "";
      const dateStr = rawDate ? rawDate.split("T")[0] : "";
      if (!dateStr) return;

      const current: ChartDataPoint = map.get(dateStr) || {
        dateKey: dateStr,
        timestamp: new Date(dateStr).getTime(),
        formattedDate: formatDate(dateStr),
      };

      if (mr.weight_at_visit !== undefined && mr.weight_at_visit !== null) {
        current.clinicalWeight = Number(mr.weight_at_visit);
      }
      if (mr.diagnosis) {
        current.diagnosis = mr.diagnosis;
      }
      map.set(dateStr, current);
    });

    // Convert map to sorted array (chronological order)
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, medicalRecords]);

  // Check data availability
  const hasWeightData = useMemo(() => {
    return chartData.some(
      (d) =>
        (d.ownerWeight !== undefined && d.ownerWeight !== null) ||
        (d.clinicalWeight !== undefined && d.clinicalWeight !== null)
    );
  }, [chartData]);

  const hasTempData = useMemo(() => {
    return chartData.some((d) => d.temperature !== undefined && d.temperature !== null);
  }, [chartData]);

  const hasHeightData = useMemo(() => {
    return chartData.some((d) => d.height !== undefined && d.height !== null);
  }, [chartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint: ChartDataPoint | undefined = payload[0]?.payload;

    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-2 min-w-[210px] z-50">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">{dataPoint?.dateKey}</span>
        </div>

        {activeTab === "weight" && (
          <div className="space-y-1.5">
            {dataPoint?.ownerWeight !== undefined && dataPoint.ownerWeight !== null && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-violet-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" />
                  Ghi nhận định kỳ:
                </span>
                <span className="font-bold text-slate-900">{dataPoint.ownerWeight} kg</span>
              </div>
            )}

            {dataPoint?.clinicalWeight !== undefined && dataPoint.clinicalWeight !== null && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block rotate-45" />
                  Lúc khám bệnh:
                </span>
                <span className="font-bold text-slate-900">{dataPoint.clinicalWeight} kg</span>
              </div>
            )}

            {dataPoint?.diagnosis && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-50 italic">
                Chẩn đoán: {dataPoint.diagnosis}
              </p>
            )}

            {dataPoint?.ownerNotes && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-50 italic">
                Ghi chú: {dataPoint.ownerNotes}
              </p>
            )}
          </div>
        )}

        {activeTab === "temperature" && (
          <div className="space-y-1.5">
            {dataPoint?.temperature !== undefined && dataPoint.temperature !== null && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Thân nhiệt:
                  </span>
                  <span className="font-bold text-slate-900">{dataPoint.temperature} °C</span>
                </div>
                <div className="text-[10px] pt-1 border-t border-slate-50">
                  {dataPoint.temperature < 37.5 ? (
                    <span className="text-blue-600 font-semibold">⚠️ Thấp hơn bình thường (Hạ thân nhiệt)</span>
                  ) : dataPoint.temperature <= 39.2 ? (
                    <span className="text-emerald-600 font-semibold">✓ Trong khoảng an toàn (38.0 - 39.2°C)</span>
                  ) : (
                    <span className="text-rose-600 font-semibold">🔥 Thân nhiệt cao (Nguy cơ sốt)</span>
                  )}
                </div>
              </>
            )}

            {dataPoint?.ownerNotes && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-50 italic">
                Ghi chú: {dataPoint.ownerNotes}
              </p>
            )}
          </div>
        )}

        {activeTab === "height" && (
          <div>
            {dataPoint?.height !== undefined && dataPoint.height !== null && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  Chiều cao:
                </span>
                <span className="font-bold text-slate-900">{dataPoint.height} cm</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-[380px] flex items-center justify-center text-slate-400 text-sm">
        Đang khởi tạo biểu đồ...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Biểu đồ xu hướng thể chất & Sinh hiệu</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200">
              {petName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi sự thay đổi theo thời gian và đối chiếu giữa các lần thăm khám
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl shrink-0 self-start sm:self-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("weight")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "weight"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Scale size={13} className={activeTab === "weight" ? "text-violet-600" : ""} />
            Cân nặng (kg)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("temperature")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "temperature"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Thermometer size={13} className={activeTab === "temperature" ? "text-rose-500" : ""} />
            Thân nhiệt (°C)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("height")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "height"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Ruler size={13} className={activeTab === "height" ? "text-indigo-600" : ""} />
            Chiều cao (cm)
          </button>
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {activeTab === "weight" && (
        !hasWeightData ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <TrendingUp size={36} className="text-slate-300 mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Chưa có dữ liệu cân nặng</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Dữ liệu sẽ hiển thị khi có ghi nhận cân nặng đầu tiên của bé {petName}.
            </p>
          </div>
        ) : (
          <div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    unit="kg"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => {
                      if (value === "ownerWeight") {
                        return (
                          <span className="text-xs font-medium text-slate-700">
                            🟣 Cân nặng nhật ký theo dõi (Health Log)
                          </span>
                        );
                      }
                      if (value === "clinicalWeight") {
                        return (
                          <span className="text-xs font-medium text-slate-700">
                            🟢 Cân nặng khám bệnh (Medical Record)
                          </span>
                        );
                      }
                      return <span className="text-xs text-slate-600">{value}</span>;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ownerWeight"
                    name="ownerWeight"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#7c3aed" }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="clinicalWeight"
                    name="clinicalWeight"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    strokeDasharray="4 4"
                    dot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#059669" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
              <Sparkles size={12} className="text-violet-500 shrink-0" />
              <span>
                Biểu đồ tự động tổng hợp đường biến thiên cân nặng giữa nhật ký theo dõi và hồ sơ khám lâm sàng.
              </span>
            </div>
          </div>
        )
      )}

      {/* Temperature Tab */}
      {activeTab === "temperature" && (
        !hasTempData ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Thermometer size={36} className="text-slate-300 mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Chưa có dữ liệu thân nhiệt</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Hãy thêm nhật ký ghi nhận thân nhiệt (°C) để kích hoạt biểu đồ sinh hiệu này.
            </p>
          </div>
        ) : (
          <div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    unit="°C"
                    domain={[36.5, 41]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={39.2} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Ngưỡng sốt: 39.2°C", fill: "#f43f5e", fontSize: 10, position: "top" }} />
                  <ReferenceLine y={38.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Ngưỡng chuẩn: 38.0°C", fill: "#10b981", fontSize: 10, position: "bottom" }} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={() => (
                      <span className="text-xs font-medium text-slate-700">
                        🔴 Thân nhiệt thú cưng (°C) — Khoảng tối ưu: 38.0°C - 39.2°C
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="temperature"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#f43f5e", stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#be123c" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 bg-rose-50/60 border border-rose-100 px-3 py-2 rounded-lg">
              <AlertCircle size={12} className="text-rose-500 shrink-0" />
              <span>
                Thân nhiệt bình thường của chó mèo dao động từ <strong>38.0°C đến 39.2°C</strong>. Nhiệt độ trên 39.5°C cần được theo dõi sát sao hoặc can thiệp y tế.
              </span>
            </div>
          </div>
        )
      )}

      {/* Height Tab */}
      {activeTab === "height" && (
        !hasHeightData ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Ruler size={36} className="text-slate-300 mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Chưa có dữ liệu chiều cao</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Nhập số đo chiều cao (cm) ở nhật ký để kích hoạt theo dõi biểu đồ tăng trưởng.
            </p>
          </div>
        ) : (
          <div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    unit="cm"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={() => (
                      <span className="text-xs font-medium text-slate-700">
                        🔵 Chiều cao (cm) theo thời gian
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="height"
                    name="height"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#4f46e5" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default HealthLogCharts;
