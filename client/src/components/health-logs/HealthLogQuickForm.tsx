"use client";

import React, { useState } from "react";
import { PlusCircle, Loader2, Calendar, Scale, Ruler, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { healthLogService } from "@/services/healthLogService";
import type { PetHealthLog } from "@/types/health-log.type";
import { useToast } from "@/components/ui/Toast";

interface HealthLogQuickFormProps {
  petId: string;
  petName: string;
  onSuccess: (newLog: PetHealthLog) => void;
}

export const HealthLogQuickForm: React.FC<HealthLogQuickFormProps> = ({
  petId,
  petName,
  onSuccess,
}) => {
  const { success: showToastSuccess, error: showToastError } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];

  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const numWeight = weight.trim() ? parseFloat(weight) : undefined;
    const numHeight = height.trim() ? parseFloat(height) : undefined;

    // Validation
    if (numWeight === undefined && numHeight === undefined) {
      setErrorMessage("Vui lòng nhập ít nhất Cân nặng (kg) hoặc Chiều cao (cm).");
      return;
    }

    if (numWeight !== undefined && (isNaN(numWeight) || numWeight <= 0 || numWeight > 300)) {
      setErrorMessage("Cân nặng không hợp lệ (phải từ 0.05 đến 300 kg).");
      return;
    }

    if (numHeight !== undefined && (isNaN(numHeight) || numHeight <= 0 || numHeight > 300)) {
      setErrorMessage("Chiều cao không hợp lệ (phải lớn hơn 0 cm).");
      return;
    }

    if (!date) {
      setErrorMessage("Vui lòng chọn ngày ghi nhận.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await healthLogService.create({
        pet_id: petId,
        log_date: date,
        weight_kg: numWeight,
        height_cm: numHeight,
        notes: notes.trim() || undefined,
      });

      // Clear input values
      setWeight("");
      setHeight("");
      setNotes("");

      const msg = `Đã lưu chỉ số sức khỏe cho ${petName}. Bộ nhớ đệm Pet.weight_kg đã tự động được đồng bộ!`;
      setSuccessMessage(msg);
      showToastSuccess(msg);

      onSuccess(created);
    } catch (err: any) {
      console.error("Lỗi khi thêm nhật ký sức khỏe:", err);
      const errDetail =
        err?.response?.data?.message || err?.message || "Không thể lưu chỉ số sức khỏe. Vui lòng thử lại.";
      setErrorMessage(errDetail);
      showToastError(errDetail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
          <PlusCircle size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Ghi nhận chỉ số thể chất</h2>
          <p className="text-xs text-slate-400">
            Nhập số đo cân nặng hoặc chiều cao mới nhất cho bé {petName}
          </p>
        </div>
      </div>

      {/* Success alert message */}
      {successMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Thành công: </span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Error alert message */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Lỗi: </span>
            {errorMessage}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Scale size={13} className="text-violet-500" />
              Cân nặng (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-weight-kg"
                type="number"
                step="0.05"
                min="0.05"
                placeholder="VD: 4.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Ruler size={13} className="text-indigo-500" />
              Chiều cao (cm)
            </label>
            <div className="relative">
              <input
                id="input-height-cm"
                type="number"
                step="0.5"
                min="1"
                placeholder="VD: 32"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                cm
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-slate-500" />
              Ngày ghi nhận <span className="text-red-500">*</span>
            </label>
            <input
              id="input-log-date"
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <FileText size={13} className="text-slate-400" />
            Ghi chú / Tình trạng (tùy chọn)
          </label>
          <input
            id="input-log-notes"
            type="text"
            placeholder="VD: Bé ăn khỏe, hoạt bát, cân vào buổi sáng..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Footer info + submit button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Dữ liệu cân nặng sẽ tự động cập nhật vào thẻ thông tin cơ bản của Pet
          </p>

          <button
            id="submit-health-log-btn"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang lưu chỉ số...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Lưu chỉ số mới
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthLogQuickForm;
