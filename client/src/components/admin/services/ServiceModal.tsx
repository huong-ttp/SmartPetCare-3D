"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Service, ServiceCategory, CreateServiceDTO, UpdateServiceDTO } from "@/types/service.type";
import { service as serviceApi } from "@/services/serviceService";
import { useToast } from "@/components/ui/Toast";
import {
  Sparkles,
  DollarSign,
  Clock,
  Layers,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: Service | null;
  onSuccess: (service: Service, isEdit: boolean) => void;
}

const CATEGORY_OPTIONS: { value: ServiceCategory; label: string; description: string }[] = [
  { value: "examination", label: "Khám bệnh", description: "Khám lâm sàng, chẩn đoán, xét nghiệm, siêu âm" },
  { value: "vaccination", label: "Tiêm chủng", description: "Tiêm phòng dại, vắc xin 5 trong 1, 7 trong 1" },
  { value: "surgery", label: "Phẫu thuật", description: "Triệt sản, phẫu thuật chỉnh hình, cạo vôi răng" },
  { value: "grooming", label: "Spa & Grooming", description: "Tắm spa, cắt tỉa lông, vệ sinh tai móng" },
  { value: "other", label: "Khác", description: "Khách sạn thú cưng, lưu trú, đưa đón..." },
];

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  serviceToEdit,
  onSuccess,
}) => {
  const isEdit = Boolean(serviceToEdit);
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [category, setCategory] = useState<ServiceCategory>("examination");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form data
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError("");
      if (serviceToEdit) {
        setName(serviceToEdit.name || "");
        setDescription(serviceToEdit.description || "");
        setPrice(String(serviceToEdit.price ?? 0));
        setDuration(String(serviceToEdit.duration_minutes ?? 30));
        const rawCat = (serviceToEdit.category || "examination").toLowerCase() as ServiceCategory;
        setCategory(CATEGORY_OPTIONS.some((c) => c.value === rawCat) ? rawCat : "other");
        setIsActive(serviceToEdit.is_active ?? true);
      } else {
        setName("");
        setDescription("");
        setPrice("");
        setDuration("30");
        setCategory("examination");
        setIsActive(true);
      }
    }
  }, [isOpen, serviceToEdit]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Tên dịch vụ không được để trống";
    } else if (name.trim().length < 2) {
      nextErrors.name = "Tên dịch vụ tối thiểu 2 ký tự";
    }

    const numPrice = Number(price);
    if (!price || isNaN(numPrice)) {
      nextErrors.price = "Vui lòng nhập giá dịch vụ hợp lệ";
    } else if (numPrice <= 0) {
      nextErrors.price = "Giá dịch vụ phải lớn hơn 0 VNĐ";
    }

    const numDuration = Number(duration);
    if (!duration || isNaN(numDuration)) {
      nextErrors.duration = "Vui lòng nhập thời lượng";
    } else if (numDuration <= 0) {
      nextErrors.duration = "Thời lượng phải lớn hơn 0 phút";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      if (isEdit && serviceToEdit) {
        const updatePayload: UpdateServiceDTO = {
          name: name.trim(),
          description: description.trim() || undefined,
          price: Number(price),
          duration_minutes: Number(duration),
          category: category.toLowerCase() as ServiceCategory,
        };

        const updated = await serviceApi.service.update(serviceToEdit.id, updatePayload);
        toast.success(`Đã cập nhật dịch vụ "${updated.name}" thành công!`);
        onSuccess(updated, true);
        onClose();
      } else {
        const createPayload: CreateServiceDTO = {
          name: name.trim(),
          description: description.trim() || undefined,
          price: Number(price),
          duration_minutes: Number(duration),
          category: category.toLowerCase() as ServiceCategory,
          is_active: isActive,
        };

        const created = await serviceApi.service.create(createPayload);
        toast.success(`Đã thêm mới dịch vụ "${created.name}" thành công!`);
        onSuccess(created, false);
        onClose();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isEdit ? "Không thể cập nhật dịch vụ" : "Không thể tạo mới dịch vụ");
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: string) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
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
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white gradient-primary rounded-xl shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : isEdit ? (
              "Lưu thay đổi"
            ) : (
              "+ Tạo dịch vụ"
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="font-medium">Không thể lưu dịch vụ</p>
              <p className="text-xs text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên dịch vụ <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Ví dụ: Khám tổng quát & Tiêm vaccine 5 bệnh"
              className={cn(
                "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all",
                errors.name
                  ? "border-red-300 focus:ring-red-200"
                  : "border-slate-200 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
              )}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Category & Price (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Danh mục (Category) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.value})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {CATEGORY_OPTIONS.find((c) => c.value === category)?.description}
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Giá dịch vụ (VNĐ) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="1000"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="200000"
                className={cn(
                  "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all",
                  errors.price
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-200 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
                )}
              />
            </div>
            {errors.price ? (
              <p className="text-xs text-red-500 mt-1">{errors.price}</p>
            ) : price ? (
              <p className="text-[11px] text-[#0EA5B7] font-medium mt-1">
                Xem trước: {formatCurrency(price)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Duration & Status (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Thời lượng thực hiện (phút) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  if (errors.duration) setErrors((prev) => ({ ...prev, duration: "" }));
                }}
                placeholder="30"
                className={cn(
                  "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all",
                  errors.duration
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-200 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7]"
                )}
              />
            </div>
            {errors.duration ? (
              <p className="text-xs text-red-500 mt-1">{errors.duration}</p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Ước tính thời gian phục vụ mỗi lượt hẹn
              </p>
            )}
          </div>

          {/* is_active (create mode default true, or toggle) */}
          {!isEdit ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trạng thái ban đầu
              </label>
              <div
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all",
                  isActive
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    )}
                  />
                  <span className="text-xs font-medium text-slate-700">
                    {isActive ? "Kích hoạt ngay (Active)" : "Tạm dừng (Inactive)"}
                  </span>
                </div>
                {/* Switch Graphic */}
                <div
                  className={cn(
                    "w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out",
                    isActive ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out",
                      isActive ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dịch vụ kích hoạt sẽ hiển thị trên trang đặt lịch của chủ nuôi
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-end">
              <span className="text-xs text-slate-500">
                Trạng thái hiện tại:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    serviceToEdit?.is_active ? "text-emerald-600" : "text-slate-500"
                  )}
                >
                  {serviceToEdit?.is_active ? "Đang hoạt động" : "Tạm dừng"}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                * Có thể bật/tắt nhanh trạng thái trực tiếp trên bảng danh sách
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Mô tả chi tiết dịch vụ
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả các bước thực hiện, ghi chú chuẩn bị trước khi đưa thú cưng tới..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/20 focus:border-[#0EA5B7] transition-all resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default ServiceModal;
