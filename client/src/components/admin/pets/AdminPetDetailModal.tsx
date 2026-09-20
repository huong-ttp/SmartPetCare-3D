"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Dna,
  Heart,
  Scale,
  Cake,
  Palette,
  Cpu,
  AlertTriangle,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react";
import type { Pet } from "@/types/pet.type";
import {
  getSpeciesLabel,
  getSpeciesEmoji,
  getGenderLabel,
  SPECIES_BADGE_COLORS,
  GENDER_BADGE_COLORS,
  formatWeight,
  normalizeStringArray,
} from "@/utils/petHelpers";
import { formatDate, calcAge } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

interface AdminPetDetailModalProps {
  isOpen: boolean;
  pet: Pet | null;
  onClose: () => void;
  onEdit?: (pet: Pet) => void;
}

export const AdminPetDetailModal: React.FC<AdminPetDetailModalProps> = ({
  isOpen,
  pet,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !pet) return null;

  const speciesBadge =
    SPECIES_BADGE_COLORS[pet.species as keyof typeof SPECIES_BADGE_COLORS] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    };

  const genderBadge =
    GENDER_BADGE_COLORS[pet.gender as keyof typeof GENDER_BADGE_COLORS] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    };

  const allergies = normalizeStringArray(pet.allergies);
  const conditions = normalizeStringArray(pet.chronic_conditions);

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

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 text-white shrink-0">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Pet Avatar / Species Icon */}
              <div className="relative w-20 h-20 rounded-2xl bg-white/10 border border-white/20 p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-lg">
                {pet.avatar_url ? (
                  <img
                    src={pet.avatar_url}
                    alt={pet.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-4xl select-none">
                    {getSpeciesEmoji(pet.species)}
                  </span>
                )}
              </div>

              {/* Title & Badges */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-2xl font-bold text-white tracking-tight truncate">
                    {pet.name}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      speciesBadge.bg,
                      speciesBadge.text,
                      speciesBadge.border
                    )}
                  >
                    <span>{getSpeciesEmoji(pet.species)}</span>
                    <span>{getSpeciesLabel(pet.species)}</span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                      genderBadge.bg,
                      genderBadge.text,
                      genderBadge.border
                    )}
                  >
                    {getGenderLabel(pet.gender)}
                  </span>
                </div>

                <p className="text-sm text-cyan-200/80 flex items-center gap-2">
                  <span>{pet.breed || "Chưa cập nhật giống"}</span>
                  {pet.is_neutered !== undefined && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span>{pet.is_neutered ? "Đã triệt sản" : "Chưa triệt sản"}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Body Content - Scrollable */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {/* Owner Details Card (Admin Highlight) */}
            <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-xs bg-gradient-to-r from-cyan-50/40 via-white to-sky-50/30">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-cyan-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Thông tin chủ sở hữu (Owner)
                  </h3>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800">
                  ID: {pet.owner_id || "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Họ và tên</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {pet.owner_name || "Chưa có thông tin"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Số điện thoại</p>
                  <p className="font-medium text-slate-700 mt-0.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    {pet.owner_phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email liên hệ</p>
                  <p className="font-medium text-slate-700 mt-0.5 flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{pet.owner_email || "—"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column: Basic Info & Health Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1: Basic Information */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Info size={16} className="text-cyan-600" />
                  Thông tin cơ bản
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Cake size={15} className="text-slate-400" />
                      Ngày sinh
                    </span>
                    <span className="font-medium text-slate-800">
                      {pet.date_of_birth ? formatDate(pet.date_of_birth) : "Chưa rõ"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Sparkles size={15} className="text-slate-400" />
                      Độ tuổi
                    </span>
                    <span className="font-medium text-slate-800">
                      {pet.date_of_birth ? calcAge(pet.date_of_birth) : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Palette size={15} className="text-slate-400" />
                      Màu lông
                    </span>
                    <span className="font-medium text-slate-800">
                      {pet.color || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Cpu size={15} className="text-slate-400" />
                      Mã Microchip
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {pet.microchip_number || "Chưa gắn chip"}
                    </span>
                  </div>

                  {/* Weight - Highlighted Cache/Readonly */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-amber-600" />
                      <div>
                        <span className="text-xs font-semibold text-amber-900 block">
                          Cân nặng (Cache)
                        </span>
                        <span className="text-[10px] text-amber-700/80">
                          Đồng bộ từ khám/bệnh án
                        </span>
                      </div>
                    </div>
                    <span className="text-base font-bold text-amber-900 font-mono">
                      {pet.weight_kg !== undefined ? `${pet.weight_kg} kg` : "Chưa có"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Health Information */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Heart size={16} className="text-rose-500" />
                  Hồ sơ sức khỏe
                </h3>

                {/* Allergies */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" />
                    Dị ứng đã biết:
                  </p>
                  {allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {allergies.map((alg, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Không ghi nhận tiền sử dị ứng
                    </p>
                  )}
                </div>

                {/* Chronic conditions */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Heart size={13} className="text-rose-500" />
                    Bệnh lý mãn tính:
                  </p>
                  {conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {conditions.map((cond, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/70"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Thể trạng bình thường, không có bệnh mãn tính
                    </p>
                  )}
                </div>

                {/* Special notes */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <FileText size={13} className="text-cyan-600" />
                    Ghi chú chăm sóc đặc biệt:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed min-h-[60px]">
                    {pet.notes || (pet as any).special_notes ? (
                      pet.notes || (pet as any).special_notes
                    ) : (
                      <span className="text-slate-400 italic">
                        Chưa có ghi chú chăm sóc đặc biệt nào cho thú cưng này.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
              <span>Hồ sơ tạo lúc: {formatDate(pet.created_at)}</span>
              <span>Cập nhật lần cuối: {formatDate(pet.updated_at)}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Mã hồ sơ: #{pet.id}
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(pet);
                  }}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminPetDetailModal;
