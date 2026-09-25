"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  AlertCircle,
  Loader2,
  Save,
  ArrowLeft,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Pet, PetSpecies, PetGender, CreatePetDTO, UpdatePetDTO } from "@/types/pet.type";
import { petService } from "@/services/petService";
import { useToast } from "@/components/ui/Toast";
import { SPECIES_LABELS, SPECIES_EMOJIS, GENDER_LABELS } from "@/utils/petHelpers";

export interface PetFormProps {
  mode: "create" | "edit";
  initialData?: Pet;
  petId?: string;
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
  allergies: string;
  chronic_conditions: string;
  special_notes: string;
}

interface FormErrors {
  name?: string;
  species?: string;
  date_of_birth?: string;
  microchip_id?: string;
  general?: string;
}

export const PetForm: React.FC<PetFormProps> = ({ mode, initialData, petId }) => {
  const router = useRouter();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper format initial allergies/chronic_conditions if they are arrays or strings
  const formatInitialText = (val?: string | string[]): string => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join(", ");
    return val;
  };

  // Format initial date for input[type="date"]
  const formatInitialDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  const [formData, setFormData] = useState<FormState>({
    avatar_url: initialData?.avatar_url || "",
    name: initialData?.name || "",
    species: (initialData?.species as PetSpecies) || "dog",
    breed: initialData?.breed || "",
    gender: (initialData?.gender as PetGender) || "male",
    date_of_birth: formatInitialDate(initialData?.date_of_birth),
    color: initialData?.color || "",
    microchip_id: (initialData as any)?.microchip_id || initialData?.microchip_number || "",
    allergies: formatInitialText(initialData?.allergies),
    chronic_conditions: formatInitialText(initialData?.chronic_conditions),
    special_notes: (initialData as any)?.special_notes || initialData?.notes || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar_url || "");

  // Handle avatar file selection & convert to Base64 data URL
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, general: "Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, general: "Dung lượng ảnh không được vượt quá 5MB." }));
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

  // Validate form client-side
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

  // Handle input change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field when user modifies it
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "create") {
        const payload: CreatePetDTO = {
          name: formData.name.trim(),
          species: formData.species,
          breed: formData.breed.trim() || undefined,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth?.trim() || undefined,
          color: formData.color.trim() || undefined,
          microchip_id: formData.microchip_id.trim() || undefined,
          microchip_number: formData.microchip_id.trim() || undefined,
          avatar_url: formData.avatar_url?.trim() || undefined,
          allergies: formData.allergies.trim() || undefined,
          chronic_conditions: formData.chronic_conditions.trim() || undefined,
          special_notes: formData.special_notes.trim() || undefined,
          notes: formData.special_notes.trim() || undefined,
        };

        const createdPet = await petService.create(payload);
        showToastSuccess(`Đã thêm thú cưng "${createdPet.name}" thành công!`);
        router.push(`/pets/${createdPet.id}`);
      } else {
        const targetId = petId || initialData?.id;
        if (!targetId) throw new Error("ID thú cưng không hợp lệ.");

        const payload: UpdatePetDTO = {
          name: formData.name.trim(),
          species: formData.species,
          breed: formData.breed.trim() || undefined,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth?.trim() || undefined,
          color: formData.color.trim() || undefined,
          microchip_id: formData.microchip_id.trim() || undefined,
          microchip_number: formData.microchip_id.trim() || undefined,
          avatar_url: formData.avatar_url?.trim() || undefined,
          allergies: formData.allergies.trim() || undefined,
          chronic_conditions: formData.chronic_conditions.trim() || undefined,
          special_notes: formData.special_notes.trim() || undefined,
          notes: formData.special_notes.trim() || undefined,
        };

        const updatedPet = await petService.update(targetId, payload);
        showToastSuccess(`Đã cập nhật thông tin thú cưng "${updatedPet.name}"!`);
        router.push(`/pets/${updatedPet.id || targetId}`);
      }
    } catch (err: any) {
      console.error("Pet form submit error:", err);
      const responseData = err.response?.data;
      const apiMessage = responseData?.message || err.message || "Có lỗi xảy ra, vui lòng thử lại.";

      // Handle backend microchip duplicate error specifically
      if (
        apiMessage.toLowerCase().includes("microchip") ||
        responseData?.errors?.microchip_id ||
        responseData?.errors?.microchip_number
      ) {
        const chipError =
          responseData?.errors?.microchip_id?.[0] ||
          responseData?.errors?.microchip_number?.[0] ||
          apiMessage;
        setErrors((prev) => ({
          ...prev,
          microchip_id: chipError,
        }));
        showToastError("Microchip ID này đã tồn tại trong hệ thống.");
      } else if (responseData?.errors) {
        // Field validation error from backend zod
        const fieldErrors: FormErrors = {};
        if (responseData.errors.name) fieldErrors.name = responseData.errors.name[0];
        if (responseData.errors.species) fieldErrors.species = responseData.errors.species[0];
        if (responseData.errors.date_of_birth) fieldErrors.date_of_birth = responseData.errors.date_of_birth[0];
        setErrors((prev) => ({ ...prev, ...fieldErrors, general: apiMessage }));
        showToastError(apiMessage);
      } else {
        setErrors((prev) => ({ ...prev, general: apiMessage }));
        showToastError(apiMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Global error banner if present */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-sm"
            role="alert"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold">Đã xảy ra lỗi</p>
              <p className="text-red-500/90">{errors.general}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section 1: Ảnh đại diện (Avatar) ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            Hình ảnh đại diện
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chọn ảnh đại diện rõ nét để nhận diện bé dễ dàng trong danh sách và hồ sơ y tế.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {avatarPreview ? (
              <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-md">
                <img
                  src={avatarPreview}
                  alt="Pet Avatar Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  title="Xóa ảnh"
                  aria-label="Xóa ảnh đại diện"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary cursor-pointer bg-slate-50 hover:bg-primary/5 transition-all"
              >
                <Upload size={28} />
                <span className="text-xs font-medium text-center px-2">Tải ảnh lên</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <input
              ref={fileInputRef}
              type="file"
              id="pet-avatar-upload"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="Tải ảnh đại diện cho thú cưng"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
            >
              <Upload size={16} />
              {avatarPreview ? "Đổi ảnh khác" : "Chọn ảnh từ máy tính"}
            </button>
            <p className="text-xs text-slate-400">
              Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Thông tin cơ bản (STRICT PET ENTITY FIELDS) ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Thông tin cơ bản
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Các trường đánh dấu sao đỏ (<span className="text-red-500 font-bold">*</span>) là bắt buộc.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Tên thú cưng (Name - Required) */}
          <div>
            <label htmlFor="pet-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên thú cưng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="pet-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: LuLu, Miu Miu..."
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "pet-name-error" : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-500 ring-red-500/20 bg-red-50/10"
                  : "border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
              }`}
            />
            {errors.name && (
              <p id="pet-name-error" className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={14} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Loài (Species - Required) */}
          <div>
            <label htmlFor="pet-species" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Loài thú cưng <span className="text-red-500">*</span>
            </label>
            <select
              id="pet-species"
              name="species"
              value={formData.species}
              onChange={handleChange}
              aria-invalid={!!errors.species}
              aria-describedby={errors.species ? "pet-species-error" : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                errors.species
                  ? "border-red-500 ring-red-500/20 bg-red-50/10"
                  : "border-slate-200 focus:border-primary focus:ring-primary/20"
              }`}
            >
              {(Object.keys(SPECIES_LABELS) as PetSpecies[]).map((speciesKey) => (
                <option key={speciesKey} value={speciesKey}>
                  {SPECIES_EMOJIS[speciesKey]} {SPECIES_LABELS[speciesKey]}
                </option>
              ))}
            </select>
            {errors.species && (
              <p id="pet-species-error" className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={14} />
                {errors.species}
              </p>
            )}
          </div>

          {/* Giống (Breed) */}
          <div>
            <label htmlFor="pet-breed" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Giống loài (Breed)
            </label>
            <input
              type="text"
              id="pet-breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="VD: Corgi, Golden Retriever, British Shorthair..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all focus:outline-none bg-white"
            />
          </div>

          {/* Giới tính (Gender) */}
          <div>
            <label htmlFor="pet-gender" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Giới tính
            </label>
            <select
              id="pet-gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all focus:outline-none bg-white"
            >
              {(Object.keys(GENDER_LABELS) as PetGender[]).map((genderKey) => (
                <option key={genderKey} value={genderKey}>
                  {GENDER_LABELS[genderKey]}
                </option>
              ))}
            </select>
          </div>

          {/* Ngày sinh (Date of Birth) */}
          <div>
            <label htmlFor="pet-dob" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ngày sinh
            </label>
            <div className="relative">
              <input
                type="date"
                id="pet-dob"
                name="date_of_birth"
                max={new Date().toISOString().split("T")[0]}
                value={formData.date_of_birth}
                onChange={handleChange}
                aria-invalid={!!errors.date_of_birth}
                aria-describedby={errors.date_of_birth ? "pet-dob-error" : undefined}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                  errors.date_of_birth
                    ? "border-red-500 ring-red-500/20 bg-red-50/10"
                    : "border-slate-200 focus:border-primary focus:ring-primary/20"
                }`}
              />
            </div>
            {errors.date_of_birth && (
              <p id="pet-dob-error" className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={14} />
                {errors.date_of_birth}
              </p>
            )}
          </div>

          {/* Màu lông (Color) */}
          <div>
            <label htmlFor="pet-color" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Màu lông (Color)
            </label>
            <input
              type="text"
              id="pet-color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="VD: Trắng đốm nâu, Xám tro, Vàng cam..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all focus:outline-none bg-white"
            />
          </div>

          {/* Mã Microchip (Microchip ID - Unique) */}
          <div className="sm:col-span-2">
            <label htmlFor="pet-microchip" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mã Microchip ID
            </label>
            <input
              type="text"
              id="pet-microchip"
              name="microchip_id"
              value={formData.microchip_id}
              onChange={handleChange}
              placeholder="VD: 981098123456789 (mã định danh điện tử gắn dưới da)"
              aria-invalid={!!errors.microchip_id}
              aria-describedby={errors.microchip_id ? "pet-microchip-error" : "pet-microchip-desc"}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all font-mono tracking-wider focus:outline-none focus:ring-2 ${
                errors.microchip_id
                  ? "border-red-500 ring-red-500/20 bg-red-50/10 text-red-700"
                  : "border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
              }`}
            />
            {errors.microchip_id ? (
              <p id="pet-microchip-error" className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={14} />
                {errors.microchip_id}
              </p>
            ) : (
              <p id="pet-microchip-desc" className="text-xs text-slate-400 mt-1.5">
                Mỗi thú cưng có mã Microchip duy nhất để phân biệt và quản lý y tế.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Hồ sơ y tế & Ghi chú (Health & Notes) ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-rose-500" />
            Hồ sơ y tế & Ghi chú đặc biệt
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi nhận tiền sử dị ứng, tình trạng bệnh lý mãn tính và các lưu ý chăm sóc đặc thù.
          </p>
        </div>

        <div className="space-y-6">
          {/* Tiền sử dị ứng (Allergies - Textarea) */}
          <div>
            <label htmlFor="pet-allergies" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Dị ứng (Allergies)
            </label>
            <textarea
              id="pet-allergies"
              name="allergies"
              rows={3}
              value={formData.allergies}
              onChange={handleChange}
              placeholder="VD: Dị ứng thịt gà, dị ứng thuốc kháng sinh penicillin, phấn hoa... (phân cách bởi dấu phẩy)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all focus:outline-none bg-white resize-y"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Liệt kê các loại thức ăn, thành phần hóa học hoặc thuốc thú y gây dị ứng.
            </p>
          </div>

          {/* Bệnh mãn tính (Chronic Conditions - Textarea) */}
          <div>
            <label htmlFor="pet-chronic-conditions" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bệnh mãn tính (Chronic Conditions)
            </label>
            <textarea
              id="pet-chronic-conditions"
              name="chronic_conditions"
              rows={3}
              value={formData.chronic_conditions}
              onChange={handleChange}
              placeholder="VD: Suy thận nhẹ giai đoạn 1, tiểu đường, viêm khớp thoái hóa... (phân cách bởi dấu phẩy)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all focus:outline-none bg-white resize-y"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Thông tin này giúp bác sĩ thú y chỉ định phác đồ điều trị an toàn nhất.
            </p>
          </div>

          {/* Ghi chú đặc biệt (Special Notes - Textarea) */}
          <div>
            <label htmlFor="pet-special-notes" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ghi chú đặc biệt (Special Notes)
            </label>
            <textarea
              id="pet-special-notes"
              name="special_notes"
              rows={4}
              value={formData.special_notes}
              onChange={handleChange}
              placeholder="VD: Bé hơi nhút nhát khi gặp người lạ, thích được vuốt cằm, không thích đụng vào đuôi..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all focus:outline-none bg-white resize-y"
            />
          </div>
        </div>
      </div>

      {/* ── Form action buttons ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Hủy
        </button>

        <button
          type="submit"
          id="submit-pet-form-btn"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>{mode === "create" ? "Tạo hồ sơ" : "Lưu thay đổi"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PetForm;
