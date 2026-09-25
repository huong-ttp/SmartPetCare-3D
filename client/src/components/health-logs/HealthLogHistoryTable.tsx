"use client";

import React, { useState } from "react";
import {
  Trash2,
  Calendar,
  Scale,
  Thermometer,
  FileText,
  AlertCircle,
  Loader2,
  Utensils,
  Zap,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import type { PetHealthLog } from "@/types/health-log.type";
import { formatDate } from "@/utils/formatDate";
import { healthLogService } from "@/services/healthLogService";
import { useToast } from "@/components/ui/Toast";

interface HealthLogHistoryTableProps {
  logs: PetHealthLog[];
  petName: string;
  onLogDeleted: (deletedId: string) => void;
}

export const HealthLogHistoryTable: React.FC<HealthLogHistoryTableProps> = ({
  logs,
  petName,
  onLogDeleted,
}) => {
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Sort logs by date descending
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await healthLogService.delete(id);
      showToastSuccess("Đã xóa bản ghi nhật ký sức khỏe thành công.");
      onLogDeleted(id);
      setConfirmId(null);
    } catch (err: any) {
      console.error("Lỗi khi xóa nhật ký:", err);
      showToastError("Không thể xóa bản ghi. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStoolLabel = (stool?: string) => {
    switch (stool) {
      case "normal":
        return { text: "Phân tốt", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "soft":
        return { text: "Phân mềm", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "liquid":
        return { text: "Tiêu chảy", color: "text-rose-700 bg-rose-50 border-rose-200" };
      case "hard":
        return { text: "Táo bón", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "blood":
        return { text: "Có lẫn máu!", color: "text-white bg-rose-600 border-rose-700" };
      default:
        return null;
    }
  };

  if (sortedLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
          <Calendar size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có lịch sử theo dõi</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Các chỉ số sinh hiệu và lâm sàng đo lường cho bé {petName} sẽ được lưu trữ và hiển thị đầy đủ tại bảng lịch sử này.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Lịch sử đo lường & Nhật ký theo dõi</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng cộng {sortedLogs.length} lần ghi nhận chỉ số thể chất & sinh hiệu
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          Mới nhất trước
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-4 py-3.5 whitespace-nowrap">Ngày ghi nhận</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Cân nặng & Thân nhiệt</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Ăn uống & Vận động</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Tiêu hóa / Nôn</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Triệu chứng & Lời dặn</th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLogs.map((log) => {
              const isDeleting = deletingId === log.id;
              const isConfirming = confirmId === log.id;
              const stoolInfo = getStoolLabel(log.stool_condition);

              return (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Date */}
                  <td className="px-4 py-4 whitespace-nowrap align-top">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Calendar size={13} />
                      </span>
                      <span className="font-semibold text-slate-900 text-xs">{formatDate(log.log_date)}</span>
                    </div>
                  </td>

                  {/* Weight & Temperature */}
                  <td className="px-4 py-4 whitespace-nowrap align-top">
                    <div className="flex flex-col gap-1.5">
                      {log.weight_kg !== undefined && log.weight_kg !== null ? (
                        <span className="inline-flex items-center gap-1 font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg text-xs w-fit">
                          <Scale size={12} className="text-violet-500" />
                          {log.weight_kg} kg
                        </span>
                      ) : null}

                      {log.temperature !== undefined && log.temperature !== null ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg text-xs w-fit">
                          <Thermometer size={12} className="text-rose-500" />
                          {log.temperature} °C
                        </span>
                      ) : null}

                      {!log.weight_kg && !log.temperature && (
                        <span className="text-slate-400 italic text-xs">—</span>
                      )}
                    </div>
                  </td>

                  {/* Appetite & Activity */}
                  <td className="px-4 py-4 whitespace-nowrap align-top">
                    <div className="flex flex-col gap-1.5 text-xs">
                      {log.appetite && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Utensils size={12} className="text-emerald-500" />
                          {log.appetite === "normal"
                            ? "Ăn bình thường"
                            : log.appetite === "decreased"
                            ? "Ăn giảm sút"
                            : log.appetite === "increased"
                            ? "Tăng khẩu vị"
                            : "Bỏ ăn hoàn toàn"}
                        </span>
                      )}

                      {log.activity_level && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Zap size={12} className="text-cyan-500" />
                          {log.activity_level === "normal"
                            ? "Vận động tự nhiên"
                            : log.activity_level === "high"
                            ? "Rất năng động"
                            : log.activity_level === "low"
                            ? "Kém vận động"
                            : "Uể oải, lờ đờ"}
                        </span>
                      )}

                      {!log.appetite && !log.activity_level && (
                        <span className="text-slate-400 italic text-xs">Bình thường</span>
                      )}
                    </div>
                  </td>

                  {/* Stool & Vomiting */}
                  <td className="px-4 py-4 whitespace-nowrap align-top">
                    <div className="flex flex-col gap-1.5 text-xs">
                      {stoolInfo && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border w-fit ${stoolInfo.color}`}>
                          {stoolInfo.text}
                        </span>
                      )}

                      {log.vomiting ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 w-fit">
                          <AlertTriangle size={11} /> Có nôn mửa
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không nôn</span>
                      )}
                    </div>
                  </td>

                  {/* Symptoms & Notes */}
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1 max-w-xs">
                      {log.symptoms && (
                        <div className="text-xs text-amber-900 bg-amber-50/70 border border-amber-200/80 px-2 py-1 rounded-lg">
                          <span className="font-semibold text-amber-800">Triệu chứng: </span>
                          {log.symptoms}
                        </div>
                      )}

                      {log.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{log.notes}</span>
                        </div>
                      )}

                      {!log.symptoms && !log.notes && (
                        <span className="text-slate-400 italic text-xs">Không có ghi chú thêm</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right whitespace-nowrap align-top">
                    {isConfirming ? (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-red-600 font-medium">Xác nhận?</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(log.id)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : "Xóa"}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirmId(null)}
                          className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa bản ghi này"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HealthLogHistoryTable;
