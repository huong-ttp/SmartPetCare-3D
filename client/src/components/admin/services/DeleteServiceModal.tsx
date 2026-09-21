"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Service } from "@/types/service.type";
import { service as serviceApi } from "@/services/serviceService";
import { useToast } from "@/components/ui/Toast";
import { AlertTriangle, Trash2, ShieldAlert, PauseCircle } from "lucide-react";

export interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToDelete: Service | null;
  onSuccess: () => void;
  onToggleActiveInstead?: (service: Service) => void;
}

export const DeleteServiceModal: React.FC<DeleteServiceModalProps> = ({
  isOpen,
  onClose,
  serviceToDelete,
  onSuccess,
  onToggleActiveInstead,
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
  }, [isOpen, serviceToDelete]);

  if (!serviceToDelete) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    setIsConstraintError(false);

    try {
      await serviceApi.service.delete(serviceToDelete.id);
      toast.success(`Đã xóa dịch vụ "${serviceToDelete.name}" thành công.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ||
        err?.message ||
        "Đã có lỗi xảy ra khi xóa dịch vụ.";

      const isConflict =
        msg.toLowerCase().includes("appointment") ||
        msg.toLowerCase().includes("invoice") ||
        msg.toLowerCase().includes("linked") ||
        msg.toLowerCase().includes("ràng buộc") ||
        err?.response?.status === 409;

      setIsConstraintError(isConflict);
      setErrorMessage(msg);

      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateInstead = () => {
    if (onToggleActiveInstead && serviceToDelete) {
      onToggleActiveInstead(serviceToDelete);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa dịch vụ"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          {isConstraintError && onToggleActiveInstead && serviceToDelete.is_active && (
            <button
              type="button"
              onClick={handleDeactivateInstead}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
            >
              <PauseCircle size={16} />
              Chuyển sang Tạm dừng
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Xóa vĩnh viễn</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning Icon and Content */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Bạn có chắc chắn muốn xóa dịch vụ này không?
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dịch vụ <strong className="text-slate-800">"{serviceToDelete.name}"</strong> (
              ID: {serviceToDelete.id}) sẽ bị xóa khỏi cơ sở dữ liệu. Thao tác này không thể hoàn tác.
            </p>
          </div>
        </div>

        {/* Constraint Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-red-900">
              <ShieldAlert size={16} className="text-red-600 shrink-0" />
              <span>Ràng buộc dữ liệu hệ thống:</span>
            </div>
            <p>{errorMessage}</p>
            {isConstraintError && (
              <p className="text-amber-800 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200/60 mt-2">
                💡 <strong>Khuyến nghị Admin:</strong> Dịch vụ này đã có dữ liệu lịch hẹn hoặc hóa đơn liên quan. Thay vì xóa, bạn nên chuyển trạng thái dịch vụ thành <strong>"Tạm dừng" (Inactive)</strong> để ẩn khỏi trang đặt lịch của chủ nuôi mà vẫn bảo toàn lịch sử y tế.
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        {!errorMessage && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs leading-relaxed">
            <p>
              <strong>Lưu ý:</strong> Nếu dịch vụ này đã từng được đặt lịch hoặc có trong hóa đơn thanh toán, hệ thống sẽ ngăn chặn xóa để bảo toàn dữ liệu lịch sử.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteServiceModal;
