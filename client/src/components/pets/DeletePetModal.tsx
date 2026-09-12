"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/utils/cn";

interface DeletePetModalProps {
  isOpen: boolean;
  petName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeletePetModal: React.FC<DeletePetModalProps> = ({
  isOpen,
  petName,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa thú cưng"
      size="sm"
      closeOnOverlay={!isDeleting}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            id="confirm-delete-pet"
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-xl inline-flex items-center gap-2 transition-all",
              "bg-red-500 text-white hover:bg-red-600 active:scale-95",
              "disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Xác nhận xóa
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning icon */}
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-700 leading-relaxed">
            Bạn có chắc chắn muốn xóa hồ sơ thú cưng{" "}
            <span className="font-bold text-slate-900">"{petName}"</span> không?
          </p>
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed">
            ⚠️ Hành động này không thể hoàn tác. Toàn bộ hồ sơ bệnh án, lịch tiêm phòng và nhật ký sức khỏe của{" "}
            <span className="font-semibold">{petName}</span> sẽ bị xóa vĩnh viễn.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePetModal;
