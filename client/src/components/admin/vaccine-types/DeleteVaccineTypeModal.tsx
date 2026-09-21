"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { VaccineType } from "@/types/vaccination.type";
import { vaccineType as vaccineTypeApi } from "@/services/vaccineTypeService";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Clock,
  Syringe,
  Info,
  Layers,
} from "lucide-react";
import { formatIntervalPreview } from "./VaccineTypeModal";

export interface DeleteVaccineTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaccineTypeToDelete: VaccineType | null;
  onSuccess: () => void;
}

export const DeleteVaccineTypeModal: React.FC<DeleteVaccineTypeModalProps> = ({
  isOpen,
  onClose,
  vaccineTypeToDelete,
  onSuccess,
}) => {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConstraintError, setIsConstraintError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsConstraintError(false);
    }
  }, [isOpen, vaccineTypeToDelete]);

  if (!vaccineTypeToDelete) return null;

  const id = vaccineTypeToDelete.id ?? vaccineTypeToDelete.vaccine_type_id;

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setIsConstraintError(false);

    try {
      await vaccineTypeApi.service.delete(id);
      toast.success(`Đã xóa loại vắc xin "${vaccineTypeToDelete.name}" thành công.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Delete vaccine type failed:", err);
      const msg: string =
        err?.response?.data?.message ||
        err?.message ||
        "Đã có lỗi xảy ra khi xóa loại vắc xin.";

      const isConflict =
        msg.toLowerCase().includes("vaccination") ||
        msg.toLowerCase().includes("pet_vaccinations") ||
        msg.toLowerCase().includes("records are linked") ||
        msg.toLowerCase().includes("liên kết") ||
        msg.toLowerCase().includes("ràng buộc") ||
        err?.response?.status === 409;

      setIsConstraintError(isConflict);
      setErrorMessage(
        isConflict
          ? "Không thể xóa loại vắc xin này: Đã có hồ sơ tiêm chủng của thú cưng (PET_VACCINATIONS) liên kết với loại vắc xin này. Hệ thống từ chối xóa để tránh mất dữ liệu lịch sử tiêm phòng của thú cưng."
          : msg
      );

      toast.error(
        isConflict
          ? "Không thể xóa: Có hồ sơ tiêm chủng đang liên kết với loại vắc xin này."
          : msg
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const intervalText = formatIntervalPreview(vaccineTypeToDelete.recommended_interval_days);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa loại vắc xin"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>
          {!isConstraintError && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Xác nhận xóa vĩnh viễn</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error Banner if constraint fails */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <ShieldAlert size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900">Ràng buộc toàn vẹn dữ liệu</p>
              <p className="text-xs text-rose-700 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Warning card */}
        {!errorMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">Cảnh báo hành động xóa</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Hành động này sẽ xóa hoàn toàn cấu hình loại vắc xin khỏi hệ thống. Thao tác này không thể hoàn tác.
              </p>
            </div>
          </div>
        )}

        {/* Vaccine type summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0EA5B7] flex items-center justify-center">
              <Syringe size={18} />
            </div>
            <span>{vaccineTypeToDelete.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block mb-0.5">Chu kỳ khuyến cáo:</span>
              <span className="font-medium text-slate-700">
                {vaccineTypeToDelete.recommended_interval_days} ngày
                {intervalText ? ` (${intervalText})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">ID hệ thống:</span>
              <span className="font-mono text-slate-600">#{id}</span>
            </div>
          </div>

          {vaccineTypeToDelete.description && (
            <div className="pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-400 block mb-0.5">Mô tả:</span>
              <p className="text-slate-600 line-clamp-2 italic">
                &ldquo;{vaccineTypeToDelete.description}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Notice about PET_VACCINATIONS constraint */}
        <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2 text-xs text-sky-800">
          <Info size={16} className="shrink-0 mt-0.5 text-[#0EA5B7]" />
          <p className="leading-relaxed">
            Hệ thống bảo vệ toàn vẹn: Nếu loại vắc xin này đang được tham chiếu trong bất kỳ bản ghi tiêm chủng nào của thú cưng (bảng <strong>PET_VACCINATIONS</strong>), thao tác xóa sẽ tự động bị chặn.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteVaccineTypeModal;
