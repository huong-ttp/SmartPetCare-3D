"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { VaccineType, CreateVaccineTypeDTO, UpdateVaccineTypeDTO } from "@/types/vaccination.type";
import { vaccineType as vaccineTypeApi } from "@/services/vaccineTypeService";
import { useToast } from "@/components/ui/Toast";
import {
  Syringe,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Dog,
  Cat,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface VaccineTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vaccineTypeToEdit?: VaccineType | null;
}

const PRESET_INTERVALS = [
  { days: 21, label: "21 ngày (3 tuần)" },
  { days: 30, label: "30 ngày (1 tháng)" },
  { days: 90, label: "90 ngày (3 tháng)" },
  { days: 180, label: "180 ngày (6 tháng)" },
  { days: 365, label: "365 ngày (1 năm - Rabies)" },
];

export function formatIntervalPreview(days: number): string {
  if (!days || days <= 0) return "";
  if (days >= 360 && days <= 370) return "~ 1 năm (12 tháng)";
  if (days >= 720 && days <= 740) return "~ 2 năm (24 tháng)";
  if (days % 30 === 0) return `~ ${days / 30} tháng`;
  if (days >= 30) {
    const months = Math.round((days / 30.4375) * 10) / 10;
    const wholeMonths = Math.round(days / 30.4375);
    return Math.abs(months - wholeMonths) < 0.15 ? `~ ${wholeMonths} tháng` : `~ ${months} tháng`;
  }
  if (days % 7 === 0) return `${days / 7} tuần`;
  if (days >= 7) return `~ ${Math.round(days / 7)} tuần`;
  return `${days} ngày`;
}

export const VaccineTypeModal: React.FC<VaccineTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vaccineTypeToEdit,
}) => {
  const toast = useToast();
  const isEdit = Boolean(vaccineTypeToEdit);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [intervalDays, setIntervalDays] = useState<number | "">(365);
  const [species, setSpecies] = useState<string[]>(["dog", "cat"]);

  // Validation & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Populate form on open
  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setErrors({});
      if (vaccineTypeToEdit) {
        setName(vaccineTypeToEdit.name || "");
        setDescription(vaccineTypeToEdit.description || "");
        setIntervalDays(
          typeof vaccineTypeToEdit.recommended_interval_days === "number"
            ? vaccineTypeToEdit.recommended_interval_days
            : 365
        );
        setSpecies(
          Array.isArray(vaccineTypeToEdit.applicable_species) && vaccineTypeToEdit.applicable_species.length > 0
            ? vaccineTypeToEdit.applicable_species
            : ["dog", "cat"]
        );
      } else {
        setName("");
        setDescription("");
        setIntervalDays(365);
        setSpecies(["dog", "cat"]);
      }
    }
  }, [isOpen, vaccineTypeToEdit]);

  const toggleSpecies = (val: string) => {
    setSpecies((prev) => {
      if (prev.includes(val)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((s) => s !== val);
      }
      return [...prev, val];
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Tên loại vắc xin không được để trống";
    }
    if (intervalDays === "" || isNaN(Number(intervalDays)) || Number(intervalDays) <= 0) {
      errs.intervalDays = "Chu kỳ khuyến cáo phải là số nguyên lớn hơn 0";
    } else if (!Number.isInteger(Number(intervalDays))) {
      errs.intervalDays = "Chu kỳ khuyến cáo phải là số nguyên ngày";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    const payload: CreateVaccineTypeDTO = {
      name: name.trim(),
      description: description.trim() || undefined,
      recommended_interval_days: Number(intervalDays),
      applicable_species: species,
    };

    try {
      if (isEdit && vaccineTypeToEdit) {
        const id = vaccineTypeToEdit.id ?? vaccineTypeToEdit.vaccine_type_id;
        if (!id) throw new Error("ID loại vắc xin không hợp lệ");
        await vaccineTypeApi.service.update(id, payload);
        toast.success(`Cập nhật loại vắc xin "${payload.name}" thành công!`);
      } else {
        await vaccineTypeApi.service.create(payload);
        toast.success(`Thêm mới loại vắc xin "${payload.name}" thành công!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save vaccine type error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Đã có lỗi xảy ra khi lưu thông tin loại vắc xin.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Cập nhật loại vắc xin" : "Thêm loại vắc xin mới"}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white gradient-primary rounded-xl hover:opacity-95 shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isEdit ? "Lưu thay đổi" : "Tạo loại vắc xin"}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-800">Không thể hoàn tất thao tác</p>
              <p className="text-xs text-rose-600 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Tên loại vaccine */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Tên loại vắc xin <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Syringe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Ví dụ: Vắc xin phòng Dại (Rabies), Vắc xin 7 bệnh..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:ring-2",
                errors.name
                  ? "border-rose-300 focus:ring-rose-200"
                  : "border-slate-200 focus:border-[#0EA5B7] focus:ring-[#0EA5B7]/20"
              )}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        {/* Chu kỳ khuyến cáo (ngày) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Chu kỳ khuyến cáo (Recommended Interval) <span className="text-rose-500">*</span>
            </label>
            {intervalDays !== "" && Number(intervalDays) > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-[#0EA5B7] border border-sky-200">
                <Clock size={12} />
                Quy đổi: {formatIntervalPreview(Number(intervalDays))}
              </span>
            )}
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="number"
              min="1"
              step="1"
              value={intervalDays}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setIntervalDays(val);
                if (errors.intervalDays) setErrors((prev) => ({ ...prev, intervalDays: "" }));
              }}
              placeholder="365"
              className={cn(
                "w-full pl-10 pr-16 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:ring-2",
                errors.intervalDays
                  ? "border-rose-300 focus:ring-rose-200"
                  : "border-slate-200 focus:border-[#0EA5B7] focus:ring-[#0EA5B7]/20"
              )}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase">
              ngày
            </span>
          </div>
          {errors.intervalDays && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.intervalDays}
            </p>
          )}

          {/* Quick presets */}
          <div className="mt-2.5">
            <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1 font-medium">
              <Sparkles size={12} className="text-amber-500" />
              Chu kỳ tiêm phổ biến:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_INTERVALS.map((preset) => {
                const isSelected = Number(intervalDays) === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setIntervalDays(preset.days);
                      if (errors.intervalDays) setErrors((prev) => ({ ...prev, intervalDays: "" }));
                    }}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-lg font-medium transition-all border",
                      isSelected
                        ? "bg-[#0EA5B7] text-white border-[#0EA5B7] shadow-sm shadow-[#0EA5B7]/20"
                        : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/80"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Áp dụng cho loài (Applicable species) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Loài thú cưng áp dụng
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => toggleSpecies("dog")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all",
                species.includes("dog")
                  ? "bg-amber-50 border-amber-300 text-amber-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Dog size={16} className={species.includes("dog") ? "text-amber-600" : "text-slate-400"} />
              <span>Chó (Canine)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSpecies("cat")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all",
                species.includes("cat")
                  ? "bg-purple-50 border-purple-300 text-purple-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Cat size={16} className={species.includes("cat") ? "text-purple-600" : "text-slate-400"} />
              <span>Mèo (Feline)</span>
            </button>
          </div>
        </div>

        {/* Mô tả loại vaccine */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Mô tả chi tiết & Hướng dẫn y khoa
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Vắc xin phòng dại virus Rhabdoviridae, phòng ngừa hiệu quả cho chó mèo trên 3 tháng tuổi, định kỳ tiêm nhắc lại hàng năm..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:border-[#0EA5B7] focus:ring-2 focus:ring-[#0EA5B7]/20 placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mô tả rút gọn sẽ được hiển thị trên bảng quản trị; bác sĩ và admin có thể tra cứu khi kê đơn tiêm chủng.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default VaccineTypeModal;
