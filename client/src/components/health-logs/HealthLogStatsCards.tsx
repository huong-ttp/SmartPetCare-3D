"use client";

import React from "react";
import { Scale, Ruler, TrendingUp, TrendingDown, Minus, Calendar, Sparkles } from "lucide-react";
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

  // Find latest log with weight and previous log with weight
  const logsWithWeight = sortedLogs.filter((l) => l.weight_kg !== undefined && l.weight_kg !== null);
  const latestWeightLog = logsWithWeight[0];
  const prevWeightLog = logsWithWeight[1];

  // Find latest log with height
  const logsWithHeight = sortedLogs.filter((l) => l.height_cm !== undefined && l.height_cm !== null);
  const latestHeightLog = logsWithHeight[0];
  const prevHeightLog = logsWithHeight[1];

  // Calculate weight diff
  const weightDiff =
    latestWeightLog && prevWeightLog && latestWeightLog.weight_kg !== undefined && prevWeightLog.weight_kg !== undefined
      ? Number((latestWeightLog.weight_kg - prevWeightLog.weight_kg).toFixed(2))
      : null;

  // Calculate height diff
  const heightDiff =
    latestHeightLog && prevHeightLog && latestHeightLog.height_cm !== undefined && prevHeightLog.height_cm !== undefined
      ? Number((latestHeightLog.height_cm - prevHeightLog.height_cm).toFixed(1))
      : null;

  return (
    <div className="space-y-4">
      {/* ── System Notice Banner ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border border-violet-200/80 text-violet-950 shadow-sm"
      >
        <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold text-violet-900 flex items-center gap-1.5 mb-0.5">
            Quyền cập nhật chỉ số thể chất của bé {petName}
          </div>
          <p className="text-violet-700/90 text-xs leading-relaxed">
            Đây là nơi <strong>duy nhất</strong> bạn có thể ghi nhận chỉ số cân nặng và chiều cao cho bé. 
            Mỗi khi bạn lưu nhật ký mới, hệ số <code className="px-1.5 py-0.5 rounded bg-violet-100/80 font-mono text-[11px] text-violet-800">Pet.weight_kg</code> sẽ được tự động đồng bộ trên toàn bộ hồ sơ mà không cần chỉnh sửa thủ công.
          </p>
        </div>
      </motion.div>

      {/* ── Stat Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Current Weight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col justify-between"
        >
          <div className="absolute right-3 top-3 w-20 h-20 rounded-full bg-violet-50/60 -mr-6 -mt-6 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Scale size={14} />
                </span>
                Cân nặng hiện tại
              </span>
              {latestWeightLog && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Calendar size={12} />
                  {formatDate(latestWeightLog.log_date)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              {latestWeightLog?.weight_kg !== undefined ? (
                <>
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {latestWeightLog.weight_kg}
                  </span>
                  <span className="text-base font-semibold text-slate-500">kg</span>
                </>
              ) : (
                <span className="text-xl font-bold text-slate-400 italic">Chưa có dữ liệu</span>
              )}
            </div>
          </div>

          {/* Trend pill */}
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">So với lần đo trước:</span>
            {weightDiff !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs ${
                  weightDiff > 0
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : weightDiff < 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {weightDiff > 0 ? (
                  <>
                    <TrendingUp size={12} />
                    +{weightDiff} kg
                  </>
                ) : weightDiff < 0 ? (
                  <>
                    <TrendingDown size={12} />
                    {weightDiff} kg
                  </>
                ) : (
                  <>
                    <Minus size={12} />
                    0.0 kg
                  </>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">Chưa có lần đo đối chiếu</span>
            )}
          </div>
        </motion.div>

        {/* Card 2: Current Height */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col justify-between"
        >
          <div className="absolute right-3 top-3 w-20 h-20 rounded-full bg-indigo-50/60 -mr-6 -mt-6 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Ruler size={14} />
                </span>
                Chiều cao hiện tại
              </span>
              {latestHeightLog && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Calendar size={12} />
                  {formatDate(latestHeightLog.log_date)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              {latestHeightLog?.height_cm !== undefined ? (
                <>
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {latestHeightLog.height_cm}
                  </span>
                  <span className="text-base font-semibold text-slate-500">cm</span>
                </>
              ) : (
                <span className="text-xl font-bold text-slate-400 italic">Chưa có dữ liệu</span>
              )}
            </div>
          </div>

          {/* Trend pill */}
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">So với lần đo trước:</span>
            {heightDiff !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs ${
                  heightDiff > 0
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : heightDiff < 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {heightDiff > 0 ? (
                  <>
                    <TrendingUp size={12} />
                    +{heightDiff} cm
                  </>
                ) : heightDiff < 0 ? (
                  <>
                    <TrendingDown size={12} />
                    {heightDiff} cm
                  </>
                ) : (
                  <>
                    <Minus size={12} />
                    0.0 cm
                  </>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">Chưa có lần đo đối chiếu</span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthLogStatsCards;
