"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  Calendar,
  FileText,
  ShieldAlert,
} from "lucide-react";
import type { Pet } from "@/types/pet.type";
import { petService } from "@/services/petService";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

interface AdminDeletePetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  onClose: () => void;
  onSuccess: (deletedPetId: string) => void;
}

export const AdminDeletePetModal: React.FC<AdminDeletePetModalProps> = ({
  isOpen,
  pet,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !pet) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      // Calls petService.delete(id) as specified in the API requirements
      await petService.delete(pet.id);
      toast.success(
        `Đã xóa hồ sơ thú cưng "${pet.name}" thành công!`,
        "Xóa thành công"
      );
      onSuccess(pet.id);
      onClose();
    } catch (err: any) {
      console.error("Failed to delete pet:", err);
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message || err?.message || "";

      if (status === 409 || serverMsg.toLowerCase().includes("appointment") || serverMsg.toLowerCase().includes("medical")) {
        setErrorMessage(
          "Không thể xóa thú cưng này vì đang có Lịch hẹn (Appointments) hoặc Hồ sơ bệnh án (Medical Records) liên kết trong hệ thống để bảo toàn lịch sử y tế."
        );
      } else {
        setErrorMessage(
          serverMsg ||
            "Không thể xóa thú cưng. Vui lòng kiểm tra lại quyền hạn hoặc kết nối máy chủ."
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6 space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Danger Icon & Heading */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Xác nhận xóa thú cưng?
              </h3>
              <p className="text-xs text-slate-500">
                Thao tác quản trị mang tính chất vĩnh viễn
              </p>
            </div>
          </div>

          {/* Pet Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg overflow-hidden shrink-0">
              {pet.avatar_url ? (
                <img
                  src={pet.avatar_url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                "🐾"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {pet.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                Chủ nuôi: <span className="font-medium text-slate-700">{pet.owner_name || "N/A"}</span> • #{pet.id}
              </p>
            </div>
          </div>

          {/* Explicit Warning Callout */}
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
              <ShieldAlert size={15} className="text-amber-600" />
              <span>Cảnh báo quan trọng</span>
            </div>
            <ul className="text-xs text-amber-900/90 space-y-1 pl-4 list-disc leading-relaxed">
              <li>
                Nếu thú cưng đã có <strong>Lịch hẹn khám (Appointments)</strong> hoặc <strong>Hồ sơ bệnh án (Medical Records)</strong>, hệ thống sẽ từ chối xóa để đảm bảo toàn vẹn dữ liệu y tế.
              </li>
              <li>
                Mọi dữ liệu theo dõi sức khỏe và lịch tiêm phòng liên quan cũng sẽ bị gỡ bỏ.
              </li>
            </ul>
          </div>

          {/* Server Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all cursor-pointer",
                isDeleting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Xác nhận xóa</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminDeletePetModal;
