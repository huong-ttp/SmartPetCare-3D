"use client";

import React, { useState } from "react";
import { Trash2, Calendar, Scale, Ruler, FileText, AlertCircle, Loader2 } from "lucide-react";
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

  if (sortedLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center mx-auto mb-3">
          <Calendar size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có lịch sử đo lường</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Các chỉ số bạn nhập cho bé {petName} sẽ được lưu trữ và hiển thị đầy đủ tại bảng lịch sử này.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Lịch sử đo lường & Nhật ký</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng cộng {sortedLogs.length} lần ghi nhận chỉ số thể chất
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          Mới nhất trước
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs text-slate-500 font-semibold border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">Ngày ghi nhận</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Cân nặng (kg)</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Chiều cao (cm)</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Ghi chú / Tình trạng</th>
              <th className="px-5 py-3.5 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLogs.map((log) => {
              const isDeleting = deletingId === log.id;
              const isConfirming = confirmId === log.id;

              return (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Calendar size={13} />
                      </span>
                      <span className="font-semibold text-slate-900">{formatDate(log.log_date)}</span>
                    </div>
                  </td>

                  {/* Weight */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {log.weight_kg !== undefined && log.weight_kg !== null ? (
                      <span className="inline-flex items-center gap-1 font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg">
                        <Scale size={13} className="text-violet-500" />
                        {log.weight_kg} kg
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">—</span>
                    )}
                  </td>

                  {/* Height */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {log.height_cm !== undefined && log.height_cm !== null ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                        <Ruler size={13} className="text-indigo-500" />
                        {log.height_cm} cm
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">—</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="px-5 py-4">
                    {log.notes?.trim() ? (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-xs">
                        <FileText size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{log.notes}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Không có ghi chú</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {isConfirming ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-[11px] text-red-600 font-medium">Xác nhận xóa?</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(log.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
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
