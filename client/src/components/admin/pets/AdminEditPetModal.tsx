"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Calendar,
  Sparkles,
  Info,
  Scale,
  User,
  AlertCircle,
  Save,
  Loader2,
  Lock,
  Search,
} from "lucide-react";
import type { Pet, PetSpecies, PetGender, UpdatePetDTO } from "@/types/pet.type";
import type { User as UserType } from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { petService } from "@/services/petService";
import { useToast } from "@/components/ui/Toast";
import { SPECIES_LABELS, SPECIES_EMOJIS, GENDER_LABELS } from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

interface AdminEditPetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  onClose: () => void;
  onSuccess: (updatedPet: Pet) => void;
}

interface FormState {
  avatar_url: string;
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  date_of_birth: string;
  color: string;
  microchip_id: string;
  is_neutered: boolean;
  allergies: string;
  chronic_conditions: string;
  special_notes: string;
  owner_id: string;
}

interface FormErrors {
  name?: string;
  species?: string;
  date_of_birth?: string;
  general?: string;
}

export const AdminEditPetModal: React.FC<AdminEditPetModalProps> = ({
  isOpen,
  pet,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormState>({
    avatar_url: "",
    name: "",
    species: "dog",
    breed: "",
    gender: "male",
    date_of_birth: "",
    color: "",
    microchip_id: "",
    is_neutered: false,
    allergies: "",
    chronic_conditions: "",
    special_notes: "",
    owner_id: "",
  });

  const [availableOwners, setAvailableOwners] = useState<UserType[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Helpers
  const formatInitialText = (val?: string | string[]): string => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join(", ");
    return val;
  };

  const formatInitialDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  // Populate form when pet changes
  useEffect(() => {
    if (pet) {
      setFormData({
        avatar_url: pet.avatar_url || "",
        name: pet.name || "",
        species: (pet.species as PetSpecies) || "dog",
        breed: pet.breed || "",
        gender: (pet.gender as PetGender) || "male",
        date_of_birth: formatInitialDate(pet.date_of_birth),
        color: pet.color || "",
        microchip_id:
          (pet as any).microchip_id || pet.microchip_number || "",
        is_neutered: pet.is_neutered || false,
        allergies: formatInitialText(pet.allergies),
        chronic_conditions: formatInitialText(pet.chronic_conditions),
        special_notes: (pet as any).special_notes || pet.notes || "",
        owner_id: pet.owner_id || "",
      });
      setAvatarPreview(pet.avatar_url || "");
      setErrors({});
    }
  }, [pet]);

  // Load user list for owner assignment
  useEffect(() => {
    if (isOpen) {
      setIsLoadingOwners(true);
      adminService
        .listUsers({ limit: 100 })
        .then((res) => {
          setAvailableOwners(res.items || []);
        })
        .catch((err) => {
          console.warn("Failed to fetch owners list:", err);
        })
        .finally(() => {
          setIsLoadingOwners(false);
        });
    }
  }, [isOpen]);

  if (!isOpen || !pet) return null;

  // Handle avatar upload & convert to data URL
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        general: "Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        general: "Dung lượng ảnh không được vượt quá 5MB.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setFormData((prev) => ({ ...prev, avatar_url: result }));
      setErrors((prev) => ({ ...prev, general: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setFormData((prev) => ({ ...prev, avatar_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên thú cưng là bắt buộc.";
    }

    if (!formData.species) {
      newErrors.species = "Vui lòng chọn loài thú cưng.";
    }

    if (formData.date_of_birth) {
      const selectedDate = new Date(formData.date_of_birth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date_of_birth = "Ngày sinh không được ở thời điểm tương lai.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload: UpdatePetDTO = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed.trim() || undefined,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || undefined,
        color: formData.color.trim() || undefined,
        microchip_id: formData.microchip_id.trim() || undefined,
        microchip_number: formData.microchip_id.trim() || undefined,
        is_neutered: formData.is_neutered,
        avatar_url: formData.avatar_url || undefined,
        allergies: formData.allergies.trim() || undefined,
        chronic_conditions: formData.chronic_conditions.trim() || undefined,
        special_notes: formData.special_notes.trim() || undefined,
        notes: formData.special_notes.trim() || undefined,
        owner_id: formData.owner_id || undefined,
      };

      // Call petService.update(id, payload) as requested in API spec
      const updated = await petService.update(pet.id, payload);
      toast.success(
        `Đã cập nhật thông tin thú cưng "${updated.name}" thành công!`,
        "Cập nhật thành công"
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update pet:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật thông tin thú cưng. Vui lòng kiểm tra lại.";
      setErrors((prev) => ({ ...prev, general: errMsg }));
      toast.error(errMsg, "Lỗi cập nhật");
    } finally {
      setIsSubmitting(false);
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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                🐾
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Chỉnh sửa thú cưng (Admin)
                </h2>
                <p className="text-xs text-slate-500">
                  Cập nhật thông tin nhận dạng, chủ nuôi và tiền sử sức khỏe cho #{pet.id}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* Error Banner */}
              {errors.general && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* READONLY WEIGHT RULE BANNER - MANDATORY */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Scale size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Cân nặng hiện tại (Cache): {pet.weight_kg !== undefined ? `${pet.weight_kg} kg` : "Chưa ghi nhận"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 flex items-center gap-1">
                      <Lock size={10} /> Chỉ đọc
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    Theo quy tắc nghiệp vụ, trường cân nặng được tính toán tự động từ lần khám lâm sàng hoặc hồ sơ bệnh án gần nhất. Quản trị viên và người dùng <strong>không thể sửa trực tiếp</strong> giá trị này tại đây.
                  </p>
                </div>
              </div>

              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl select-none">
                      {SPECIES_EMOJIS[formData.species] || "🐾"}
                    </span>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Ảnh đại diện thú cưng
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Định dạng PNG, JPG, WebP tối đa 5MB.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
                    >
                      <Upload size={13} />
                      Tải ảnh mới
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                      >
                        Gỡ ảnh
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Owner Assignment (Admin feature) */}
              <div className="p-4 rounded-xl bg-cyan-50/40 border border-cyan-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-cyan-600" />
                    Chủ sở hữu (Owner)
                  </label>
                  <span className="text-[11px] text-cyan-700">
                    Admin có thể đổi chủ nuôi nếu cần hỗ trợ
                  </span>
                </div>

                <select
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">-- Chọn tài khoản chủ sở hữu --</option>
                  {availableOwners.map((u) => {
                    const uId = String(u.user_id || u.id);
                    return (
                      <option key={uId} value={uId}>
                        {u.full_name} ({u.email || u.phone || `ID: ${uId}`})
                      </option>
                    );
                  })}
                  {/* Fallback if current owner not in list */}
                  {pet.owner_id &&
                    !availableOwners.some(
                      (u) => String(u.user_id || u.id) === String(pet.owner_id)
                    ) && (
                      <option value={pet.owner_id}>
                        {pet.owner_name || `Chủ nuôi hiện tại (#${pet.owner_id})`}
                      </option>
                    )}
                </select>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pet Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tên thú cưng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: Mochi, LuLu..."
                    className={cn(
                      "w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all",
                      errors.name
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800"
                    )}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Species */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Loài thú cưng <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="species"
                    value={formData.species}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer"
                  >
                    {Object.entries(SPECIES_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {SPECIES_EMOJIS[val as PetSpecies]} {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Giống loài
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    placeholder="VD: Poodle, Corgi, Mèo Anh lông ngắn..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="male">Đực (Male)</option>
                    <option value="female">Cái (Female)</option>
                    <option value="unknown">Chưa rõ (Unknown)</option>
                  </select>
                </div>

                {/* Date of birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    className={cn(
                      "w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all",
                      errors.date_of_birth
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800"
                    )}
                  />
                  {errors.date_of_birth && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Màu lông
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="VD: Trắng kem, Xám tro..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                {/* Microchip */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mã số Microchip
                  </label>
                  <input
                    type="text"
                    name="microchip_id"
                    value={formData.microchip_id}
                    onChange={handleChange}
                    placeholder="VD: 985141004826542"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                {/* Neutered checkbox */}
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_neutered"
                      checked={formData.is_neutered}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                    />
                    <span>Đã triệt sản (Neutered / Spayed)</span>
                  </label>
                </div>
              </div>

              {/* Health Notes Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tiền sử & Ghi chú sức khỏe
                </h3>

                {/* Allergies */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dị ứng (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="VD: Hải sản, Phấn hoa, Thuốc kháng sinh A..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                {/* Chronic conditions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bệnh lý mãn tính (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    name="chronic_conditions"
                    value={formData.chronic_conditions}
                    onChange={handleChange}
                    placeholder="VD: Viêm da cơ địa, Suy thận độ 1..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                {/* Special notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú chăm sóc / Dặn dò đặc biệt
                  </label>
                  <textarea
                    name="special_notes"
                    rows={3}
                    value={formData.special_notes}
                    onChange={handleChange}
                    placeholder="Nhập ghi chú hoặc cảnh báo đặc biệt về thói quen, tính cách, ăn uống..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-cyan-500/25 transition-all cursor-pointer",
                  isSubmitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminEditPetModal;
