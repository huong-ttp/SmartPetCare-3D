"use client";

import React from "react";
import {
  Scale,
  Thermometer,
  Utensils,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Sparkles,
  AlertCircle,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import type { PetHealthLog } from "@/types/health-log.type";
import { formatDate } from "@/utils/formatDate";

interface HealthLogStatsCardsProps {
  logs: PetHealthLog[];
  petName: string;
}

export const HealthLogStatsCards: React.FC<HealthLogStatsCardsProps> = ({ logs, petName }) => {
  // Sort logs by date descending to find latest and previous entries
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );

  // 1. Weight stats
  const logsWithWeight = sortedLogs.filter((l) => l.weight_kg !== undefined && l.weight_kg !== null);
  const latestWeightLog = logsWithWeight[0];
  const prevWeightLog = logsWithWeight[1];
  const weightDiff =
    latestWeightLog && prevWeightLog && latestWeightLog.weight_kg !== undefined && prevWeightLog.weight_kg !== undefined
      ? Number((latestWeightLog.weight_kg - prevWeightLog.weight_kg).toFixed(2))
      : null;

  // 2. Temperature stats
  const logsWithTemp = sortedLogs.filter((l) => l.temperature !== undefined && l.temperature !== null);
  const latestTempLog = logsWithTemp[0];
  const prevTempLog = logsWithTemp[1];
  const tempDiff =
    latestTempLog && prevTempLog && latestTempLog.temperature !== undefined && prevTempLog.temperature !== undefined
      ? Number((latestTempLog.temperature - prevTempLog.temperature).toFixed(1))
      : null;

  // 3. Appetite stats
  const logsWithAppetite = sortedLogs.filter((l) => l.appetite);
  const latestAppetiteLog = logsWithAppetite[0];

  // 4. Activity stats
  const logsWithActivity = sortedLogs.filter((l) => l.activity_level);
  const latestActivityLog = logsWithActivity[0];

  // Appetite helper
  const getAppetiteInfo = (appetite?: string) => {
    switch (appetite) {
      case "normal":
        return { label: "Bình thường", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "increased":
        return { label: "Tăng khẩu vị", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "decreased":
        return { label: "Ăn giảm sút", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "none":
        return { label: "Bỏ ăn / Kém", color: "text-rose-700 bg-rose-50 border-rose-200" };
      default:
        return { label: "Chưa ghi nhận", color: "text-slate-500 bg-slate-50 border-slate-200" };
    }
  };

  // Activity level helper
  const getActivityInfo = (activity?: string) => {
    switch (activity) {
      case "normal":
        return { label: "Bình thường", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "high":
        return { label: "Rất hiếu động", color: "text-cyan-700 bg-cyan-50 border-cyan-200" };
      case "low":
        return { label: "Kém vận động", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "lethargic":
        return { label: "Uể oải / Lờ đờ", color: "text-rose-700 bg-rose-50 border-rose-200" };
      default:
        return { label: "Chưa ghi nhận", color: "text-slate-500 bg-slate-50 border-slate-200" };
    }
  };

  // Temperature status helper
  const getTempStatus = (temp?: number) => {
    if (temp === undefined || temp === null) return null;
    if (temp < 37.5) {
      return { label: "Hạ thân nhiệt", color: "text-blue-600 bg-blue-50 border-blue-200" };
    }
    if (temp <= 39.2) {
      return { label: "Thân nhiệt chuẩn", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    }
    if (temp <= 39.8) {
      return { label: "Sốt nhẹ", color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    return { label: "Sốt cao", color: "text-rose-600 bg-rose-50 border-rose-200" };
  };

  const tempStatus = getTempStatus(latestTempLog?.temperature);
  const appetiteInfo = getAppetiteInfo(latestAppetiteLog?.appetite);
  const activityInfo = getActivityInfo(latestActivityLog?.activity_level);

  return (
    <div className="space-y-4">
      {/* ── Stat Cards Grid (4 Columns) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Weight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="absolute right-2 top-2 w-16 h-16 rounded-full bg-violet-50/70 -mr-4 -mt-4 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Scale size={13} />
                </span>
                Cân nặng
              </span>
              {latestWeightLog && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={10} />
                  {formatDate(latestWeightLog.log_date)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 mt-2">
              {latestWeightLog?.weight_kg !== undefined ? (
                <>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {latestWeightLog.weight_kg}
                  </span>
                  <span className="text-xs font-bold text-slate-500">kg</span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-400 italic">Chưa có số đo</span>
              )}
            </div>
          </div>

          {/* Trend pill */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">So lần trước:</span>
            {weightDiff !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  weightDiff > 0
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : weightDiff < 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {weightDiff > 0 ? (
                  <>
                    <TrendingUp size={11} />
                    +{weightDiff} kg
                  </>
                ) : weightDiff < 0 ? (
                  <>
                    <TrendingDown size={11} />
                    {weightDiff} kg
                  </>
                ) : (
                  <>
                    <Minus size={11} />
                    0.0 kg
                  </>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic text-[10px]">Chưa có đối chiếu</span>
            )}
          </div>
        </motion.div>

        {/* Card 2: Temperature */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="absolute right-2 top-2 w-16 h-16 rounded-full bg-rose-50/70 -mr-4 -mt-4 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Thermometer size={13} />
                </span>
                Thân nhiệt
              </span>
              {latestTempLog && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={10} />
                  {formatDate(latestTempLog.log_date)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 mt-2">
              {latestTempLog?.temperature !== undefined ? (
                <>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {latestTempLog.temperature}
                  </span>
                  <span className="text-xs font-bold text-slate-500">°C</span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-400 italic">Chưa đo nhiệt</span>
              )}
            </div>
          </div>

          {/* Temp status pill */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Tình trạng:</span>
            {tempStatus ? (
              <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] border ${tempStatus.color}`}>
                <Activity size={10} />
                {tempStatus.label}
              </span>
            ) : (
              <span className="text-slate-400 italic text-[10px]">Chuẩn: 38 - 39.2°C</span>
            )}
          </div>
        </motion.div>

        {/* Card 3: Appetite */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="absolute right-2 top-2 w-16 h-16 rounded-full bg-emerald-50/70 -mr-4 -mt-4 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Utensils size={13} />
                </span>
                Tình trạng ăn uống
              </span>
              {latestAppetiteLog && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={10} />
                  {formatDate(latestAppetiteLog.log_date)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${appetiteInfo.color}`}>
                <Utensils size={12} />
                {appetiteInfo.label}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Khẩu phần gần nhất:</span>
            <span className="text-[11px] font-medium text-slate-600">
              {latestAppetiteLog?.appetite === "normal"
                ? "Ăn đủ bữa"
                : latestAppetiteLog?.appetite === "decreased"
                ? "Ăn kém / chậm"
                : latestAppetiteLog?.appetite === "increased"
                ? "Ăn nhiều hơn"
                : latestAppetiteLog?.appetite === "none"
                ? "Bỏ ăn hoàn toàn"
                : "Chưa ghi nhận"}
            </span>
          </div>
        </motion.div>

        {/* Card 4: Activity Level */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="absolute right-2 top-2 w-16 h-16 rounded-full bg-cyan-50/70 -mr-4 -mt-4 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                  <Zap size={13} />
                </span>
                Mức độ vận động
              </span>
              {latestActivityLog && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={10} />
                  {formatDate(latestActivityLog.log_date)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${activityInfo.color}`}>
                <Zap size={12} />
                {activityInfo.label}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Hành vi thể chất:</span>
            <span className="text-[11px] font-medium text-slate-600">
              {latestActivityLog?.activity_level === "normal"
                ? "Linh hoạt tự nhiên"
                : latestActivityLog?.activity_level === "high"
                ? "Rất năng động"
                : latestActivityLog?.activity_level === "low"
                ? "Ít chạy nhảy"
                : latestActivityLog?.activity_level === "lethargic"
                ? "Nằm li bì"
                : "Chưa ghi nhận"}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthLogStatsCards;
