"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Syringe,
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Building,
  Hash,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { vaccinationService } from "@/services/vaccinationService";
import { petService } from "@/services/petService";
import type { VaccineType } from "@/types/vaccination.type";
import type { Pet } from "@/types/pet.type";
import { useToast } from "@/components/ui/Toast";

export default function DoctorVaccinationCreatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, requireRole } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const medicalRecordId = searchParams.get("medical_record_id") || "";
  const petId = searchParams.get("pet_id") || "";
  const appointmentId = searchParams.get("appointment_id") || "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);
  const [selectedVaccineTypeId, setSelectedVaccineTypeId] = useState<string>("");
  const [dateAdministered, setDateAdministered] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [lotNumber, setLotNumber] = useState<string>("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    requireRole("doctor");
    if (appointmentId) {
      router.replace(
        `/appointments/${appointmentId}/vaccinate?medical_record_id=${medicalRecordId}&pet_id=${petId}`
      );
    }
  }, [requireRole, appointmentId, medicalRecordId, petId, router]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vTypes, petData] = await Promise.all([
        vaccinationService.getVaccineTypes(),
        petId ? petService.getById(petId).catch(() => null) : Promise.resolve(null),
      ]);

      setVaccineTypes(vTypes);
      if (vTypes.length > 0) {
        setSelectedVaccineTypeId(String(vTypes[0].id));
      }
      if (petData) {
        setPet(petData);
      }
    } catch (err: any) {
      console.error("[VaccinationCreate] Load data failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedVaccine = vaccineTypes.find(
    (vt) => String(vt.id) === String(selectedVaccineTypeId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccineTypeId) {
      setValidationError("Vui lòng chọn loại vắc xin tiêm phòng.");
      return;
    }
    if (!dateAdministered) {
      setValidationError("Vui lòng chọn ngày tiêm.");
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    try {
      await vaccinationService.createVaccination({
        pet_id: petId || "p1",
        vaccine_type_id: selectedVaccineTypeId,
        appointment_id: appointmentId || undefined,
        medical_record_id: medicalRecordId || undefined,
        date_administered: dateAdministered,
        lot_number: lotNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      showSuccess("Đã ghi nhận mũi tiêm thành công và tự động tính hạn tiêm nhắc!");
      router.push(petId ? `/pets/${petId}/vaccinations` : "/doctor/appointments");
    } catch (err: any) {
      console.error("[VaccinationCreate] Save failed:", err);
      showError(err?.message || "Không thể lưu mũi tiêm. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/doctor/dashboard" className="hover:text-[#0EA5B7] transition-colors">
            Bác sĩ
          </Link>
          <span>/</span>
          <Link href="/doctor/appointments" className="hover:text-[#0EA5B7] transition-colors">
            Lịch hẹn
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Ghi nhận tiêm phòng (Prompt 24)</span>
        </div>

        <Link
          href={appointmentId ? `/appointments/${appointmentId}` : "/doctor/appointments"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Syringe size={14} />
              <span>Ghi Nhận Mũi Tiêm Vắc Xin — Prompt 24 Bridge</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              Tiêm Phòng Cho {pet?.name || "Thú cưng"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Ghi nhận vắc xin đã tiêm tại phòng khám. Ngày tiêm nhắc lại sẽ được tự động tính toán
              theo chu kỳ khuyến nghị của loại vắc xin.
            </p>
          </div>

          {medicalRecordId && (
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
              <span className="text-[11px] text-slate-400 block">Gắn với bệnh án</span>
              <span className="text-sm font-bold text-emerald-300">#{medicalRecordId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Vaccine Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Loại Vắc Xin <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedVaccineTypeId}
              onChange={(e) => setSelectedVaccineTypeId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              required
            >
              {vaccineTypes.map((vt) => (
                <option key={vt.id} value={vt.id}>
                  {vt.name} (Khoảng cách tiêm nhắc: {vt.recommended_interval_days} ngày)
                </option>
              ))}
            </select>
            {selectedVaccine?.description && (
              <p className="text-xs text-slate-500">{selectedVaccine.description}</p>
            )}
          </div>

          {/* Date Administered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Ngày Tiêm <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateAdministered}
                onChange={(e) => setDateAdministered(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Số Lô (Lot / Batch Number)
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Ví dụ: BATCH-2026-X99"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Manufacturer & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nhà Sản Xuất (Manufacturer)
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Ví dụ: Zoetis / Boehringer Ingelheim"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Ghi Chú Phản Ứng Sau Tiêm
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Bé khỏe mạnh, không sưng đỏ tại vị trí tiêm"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push("/doctor/appointments")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold text-center transition-colors"
            >
              Bỏ qua & Quay về Lịch hẹn
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang lưu mũi tiêm...</span>
                </>
              ) : (
                <>
                  <Syringe size={16} />
                  <span>Lưu Mũi Tiêm Vắc Xin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
