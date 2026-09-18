"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Stethoscope,
  Info,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText,
  Dog,
  Cat,
} from "lucide-react";
import { petService } from "@/services/petService";
import { serviceService } from "@/services/serviceService";
import { appointmentService } from "@/services/appointmentService";
import type { Pet } from "@/types/pet.type";
import type { Service } from "@/types/service.type";
import type { AvailableSlot } from "@/types/appointment.type";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function CreateAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: showSuccess, error: showError } = useToast();

  // Query params: service_id, from, pet_id
  const initialServiceId = searchParams.get("service_id") || searchParams.get("serviceId") || "";
  const initialPetId = searchParams.get("pet_id") || searchParams.get("petId") || "";
  const fromSource = searchParams.get("from") || "";

  // Data states
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState<boolean>(true);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Form states
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);

  // Default date: today in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [appointmentDate, setAppointmentDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // UX states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // ─── 1. Fetch Pets & Services on mount ─────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingPets(true);
      setIsLoadingServices(true);

      try {
        const [petsList, servicesList] = await Promise.all([
          petService.getMyPets(),
          serviceService.list({ is_active: true }),
        ]);

        const validPets = Array.isArray(petsList) ? petsList : [];
        setPets(validPets);
        if (validPets.length > 0) {
          if (initialPetId && validPets.some((p) => String(p.id) === initialPetId)) {
            setSelectedPetId(initialPetId);
          } else {
            setSelectedPetId(String(validPets[0].id));
          }
        }

        const validServices = Array.isArray(servicesList) ? servicesList : [];
        setServices(validServices);
        if (initialServiceId && validServices.some((s) => String(s.id) === initialServiceId)) {
          setSelectedServiceId(initialServiceId);
        }
      } catch (err) {
        console.error("[CreateAppointment] Error loading pets or services:", err);
        showError("Không thể tải danh sách thú cưng hoặc dịch vụ.");
      } finally {
        setIsLoadingPets(false);
        setIsLoadingServices(false);
      }
    }

    loadInitialData();
  }, [initialPetId, initialServiceId, showError]);

  // Selected entities helper
  const selectedPet = useMemo(() => {
    return pets.find((p) => String(p.id) === String(selectedPetId));
  }, [pets, selectedPetId]);

  const selectedService = useMemo(() => {
    return services.find((s) => String(s.id) === String(selectedServiceId));
  }, [services, selectedServiceId]);

  // Duration in minutes (default 30 mins if no service selected)
  const durationMinutes = useMemo(() => {
    return selectedService?.duration_minutes || 30;
  }, [selectedService]);

  // Compute End Time based on start time & duration
  const computedEndTime = useMemo(() => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return "";
    const date = new Date(1970, 0, 1, h, m);
    date.setMinutes(date.getMinutes() + durationMinutes);
    const endH = String(date.getHours()).padStart(2, "0");
    const endM = String(date.getMinutes()).padStart(2, "0");
    return `${endH}:${endM}`;
  }, [startTime, durationMinutes]);

  // ─── 2. Fetch Available Slots when Pet or Date changes ─────────────
  const loadAvailableSlots = useCallback(async () => {
    if (!selectedPetId || !appointmentDate) {
      setSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    setConflictWarning(null);
    try {
      const data = await appointmentService.getAvailableSlots(selectedPetId, appointmentDate);
      setSlots(data);

      // Check if current startTime conflicts with booked slots
      if (startTime) {
        const matchingSlot = data.find((s) => s.time === startTime);
        if (matchingSlot && !matchingSlot.available) {
          setConflictWarning(
            `Thú cưng ${selectedPet?.name || "này"} đã có lịch hẹn vào lúc ${startTime} ngày ${appointmentDate}.`
          );
        }
      }
    } catch (err) {
      console.warn("[CreateAppointment] Error loading slots:", err);
      // Default slots
      setSlots([
        { time: "08:00", available: true },
        { time: "08:30", available: true },
        { time: "09:00", available: true },
        { time: "09:30", available: true },
        { time: "10:00", available: true },
        { time: "10:30", available: true },
        { time: "11:00", available: true },
        { time: "13:00", available: true },
        { time: "13:30", available: true },
        { time: "14:00", available: true },
        { time: "14:30", available: true },
        { time: "15:00", available: true },
        { time: "15:30", available: true },
        { time: "16:00", available: true },
      ]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedPetId, appointmentDate, startTime, selectedPet?.name]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  // Handle choosing a slot
  const handleSelectSlot = (slot: AvailableSlot) => {
    if (!slot.available) {
      setConflictWarning(
        `Thú cưng ${selectedPet?.name || "này"} đã có lịch hẹn vào lúc ${slot.time} ngày ${appointmentDate}. Vui lòng chọn khung giờ khác!`
      );
      setStartTime(slot.time);
      return;
    }
    setConflictWarning(null);
    setStartTime(slot.time);
  };

  // ─── 3. Submit Appointment Form ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (pets.length === 0) {
      setSubmitError("Bạn chưa có thú cưng nào. Vui lòng thêm thú cưng trước khi đặt lịch.");
      return;
    }

    if (!selectedPetId) {
      setSubmitError("Vui lòng chọn thú cưng cần khám.");
      return;
    }

    if (!appointmentDate) {
      setSubmitError("Vui lòng chọn ngày khám.");
      return;
    }

    if (!startTime) {
      setSubmitError("Vui lòng chọn khung giờ khám.");
      return;
    }

    if (conflictWarning) {
      setSubmitError("Khung giờ bạn chọn đã bị trùng lịch với thú cưng này. Vui lòng chọn giờ khác.");
      return;
    }

    if (!reason.trim()) {
      setSubmitError("Vui lòng nhập lý do khám hoặc triệu chứng của bé.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create appointment payload
      // ⚠️ DOCTOR IS NOT SELECTED: doctor_id is handled as NULL by backend!
      const payload = {
        pet_id: selectedPetId,
        service_id: selectedServiceId || null,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: computedEndTime || undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      const result = await appointmentService.create(payload);

      showSuccess("Đặt lịch khám thành công! Lịch hẹn đã được xác nhận.");
      // Redirect to appointments list or details
      const newId = result?.id || result?.appointment_id;
      if (newId) {
        router.push("/appointments");
      } else {
        router.push("/appointments");
      }
    } catch (err: any) {
      console.error("[CreateAppointment] Submit failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể đặt lịch khám. Vui lòng kiểm tra lại thông tin và thử lại.";
      setSubmitError(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick date pickers
  const handleQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split("T")[0];
    setAppointmentDate(dateStr);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Header & Breadcrumb ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-[#0EA5B7] transition-colors">
            Tổng quan
          </Link>
          <span>/</span>
          <Link href="/appointments" className="hover:text-[#0EA5B7] transition-colors">
            Lịch hẹn
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Đặt lịch mới</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span>Đặt Lịch Khám Thú Cưng</span>
              {fromSource === "lobby" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0EA5B7] border border-sky-200/80">
                  <Sparkles size={13} />
                  Quầy Lễ Tân 3D
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Đăng ký lịch khám, tiêm chủng hoặc chăm sóc thú cưng nhanh chóng chỉ với vài bước đơn giản.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Zero Pets Blocking Banner ────────────────────────────────── */}
      {!isLoadingPets && pets.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Dog size={32} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-amber-900">
              Bạn chưa có thú cưng nào trong hồ sơ
            </h3>
            <p className="text-xs md:text-sm text-amber-700">
              Để tiến hành đặt lịch khám và theo dõi sức khỏe cho các bé, bạn cần tạo hồ sơ thú cưng trước.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/pets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0EA5B7] hover:bg-[#0b8fa0] text-white text-sm font-bold shadow-lg shadow-[#0EA5B7]/25 transition-all active:scale-95"
            >
              <PlusCircle size={18} />
              <span>Thêm thú cưng ngay bây giờ</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Main Content Grid: Form (Left) & Summary (Right) ─────────── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Booking Form Fields (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Chọn Thú cưng */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Chọn Thú Cưng Cần Khám</h2>
                </div>
                <Link
                  href="/pets"
                  className="text-xs font-semibold text-[#0EA5B7] hover:underline inline-flex items-center gap-1"
                >
                  <PlusCircle size={13} />
                  Thêm bé khác
                </Link>
              </div>

              {isLoadingPets ? (
                <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              ) : pets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pets.map((p) => {
                    const isSelected = String(p.id) === String(selectedPetId);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPetId(String(p.id));
                          setConflictWarning(null);
                        }}
                        className={cn(
                          "relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 outline-none",
                          isSelected
                            ? "border-[#0EA5B7] bg-sky-50/60 ring-2 ring-[#0EA5B7]/30 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0",
                            isSelected ? "bg-[#0EA5B7] text-white" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {p.species === "cat" ? <Cat size={20} /> : <Dog size={20} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{p.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {p.breed || (p.species === "cat" ? "Mèo" : "Chó")} {p.weight_kg ? `• ${p.weight_kg}kg` : ""}
                          </p>
                        </div>

                        {isSelected && (
                          <CheckCircle2
                            size={18}
                            className="absolute top-2 right-2 text-[#0EA5B7] fill-white"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Step 2: Chọn Dịch vụ (Không bắt buộc) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Chọn Dịch Vụ Khám</h2>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Tùy chọn
                    </span>
                  </div>
                </div>

                <Link
                  href="/services"
                  className="text-xs font-semibold text-[#0EA5B7] hover:underline"
                >
                  Xem bảng giá chi tiết →
                </Link>
              </div>

              {isLoadingServices ? (
                <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30 focus:border-[#0EA5B7] transition-all cursor-pointer"
                    >
                      <option value="">
                        Khám tổng quát / Chưa chọn trước dịch vụ (Tư vấn trực tiếp)
                      </option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {formatCurrency(s.price)} ({s.duration_minutes || 30} phút)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedService ? (
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
                      <Stethoscope size={18} className="text-[#0EA5B7] shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-700 space-y-1">
                        <p className="font-semibold text-slate-900">
                          {selectedService.name} •{" "}
                          <span className="text-[#0EA5B7] font-bold">
                            {formatCurrency(selectedService.price)}
                          </span>
                        </p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {selectedService.description || "Dịch vụ phòng khám SmartPetCare."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic px-1">
                      💡 Bạn có thể để trống mục này. Bác sĩ sẽ trực tiếp khám sàng lọc ban đầu và tư vấn dịch vụ cần thiết khi bạn đưa bé tới phòng khám.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Chọn Ngày & Khung Giờ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900">Chọn Ngày & Khung Giờ Khám</h2>
              </div>

              {/* Date selection & Quick buttons */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày hẹn khám <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      min={todayStr}
                      value={appointmentDate}
                      onChange={(e) => {
                        setAppointmentDate(e.target.value);
                        setStartTime("");
                        setConflictWarning(null);
                      }}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30 focus:border-[#0EA5B7] transition-all cursor-pointer"
                    />
                  </div>

                  {/* Quick buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickDate(0)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                        appointmentDate === todayStr
                          ? "bg-[#0EA5B7] text-white border-[#0EA5B7]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate(1)}
                      className="px-3 py-2 rounded-xl text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-all"
                    >
                      Ngày mai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate(2)}
                      className="px-3 py-2 rounded-xl text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-all"
                    >
                      Ngày kia
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Khung giờ khả dụng <span className="text-red-500">*</span>
                  </label>
                  {isLoadingSlots && (
                    <span className="text-xs text-[#0EA5B7] inline-flex items-center gap-1">
                      <Clock size={12} className="animate-spin" />
                      Đang kiểm tra slot trống...
                    </span>
                  )}
                </div>

                {/* Conflict Warning */}
                {conflictWarning && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <div>
                      <p className="font-bold">Cảnh báo trùng lịch hẹn!</p>
                      <p className="mt-0.5 text-red-600">{conflictWarning}</p>
                    </div>
                  </div>
                )}

                {/* Slots List */}
                <div className="space-y-3">
                  {/* Sáng */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Buổi sáng (08:00 - 11:30)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {slots
                        .filter((s) => s.time < "12:00")
                        .map((slot) => {
                          const isSelected = startTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                "py-2 px-2 rounded-xl text-xs font-bold transition-all duration-150 border text-center relative",
                                isSelected
                                  ? "bg-[#0EA5B7] text-white border-[#0EA5B7] shadow-sm shadow-[#0EA5B7]/30 scale-102"
                                  : slot.available
                                  ? "bg-white text-slate-700 border-slate-200 hover:border-[#0EA5B7] hover:bg-sky-50/50"
                                  : "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60"
                              )}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Chiều */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Buổi chiều (13:00 - 17:00)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {slots
                        .filter((s) => s.time >= "12:00")
                        .map((slot) => {
                          const isSelected = startTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                "py-2 px-2 rounded-xl text-xs font-bold transition-all duration-150 border text-center relative",
                                isSelected
                                  ? "bg-[#0EA5B7] text-white border-[#0EA5B7] shadow-sm shadow-[#0EA5B7]/30 scale-102"
                                  : slot.available
                                  ? "bg-white text-slate-700 border-slate-200 hover:border-[#0EA5B7] hover:bg-sky-50/50"
                                  : "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60"
                              )}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Lý do khám & Ghi chú */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0EA5B7]/10 text-[#0EA5B7] flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h2 className="text-base font-bold text-slate-900">Lý Do Khám & Ghi Chú</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lý do khám / Triệu chứng ban đầu <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ví dụ: Khám sức khỏe định kỳ, tiêm nhắc vaccine, bé có dấu hiệu nôn ói hoặc biếng ăn 2 ngày nay..."
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30 focus:border-[#0EA5B7] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ghi chú thêm cho phòng khám (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dặn dò thêm về tính cách bé (nhát người, sợ kim tiêm) hoặc yêu cầu đặc biệt..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5B7]/30 focus:border-[#0EA5B7] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Bác sĩ - CHÍNH SÁCH QUY ĐỊNH (KHÔNG CHỌN BÁC SĨ) */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 space-y-0.5">
                <p className="font-bold">Chính sách phân công bác sĩ</p>
                <p className="text-indigo-700 leading-relaxed text-[11px]">
                  Để đảm bảo chất lượng y khoa tốt nhất, Quản trị viên phòng khám sẽ phân công bác sĩ chuyên khoa phù hợp với tình trạng sức khỏe của bé sau khi tiếp nhận lịch hẹn. Lịch hẹn của bạn sẽ được kích hoạt ngay lập tức.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Summary & Submit Action (4 Cols) */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Tóm Tắt Lịch Hẹn</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Xác nhận ngay
                </span>
              </h3>

              {/* Summary Items */}
              <div className="space-y-3.5 text-xs text-slate-600">
                {/* Pet */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Thú cưng:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedPet ? selectedPet.name : "Chưa chọn"}
                  </span>
                </div>

                {/* Service */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">Dịch vụ:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[180px]">
                    {selectedService ? selectedService.name : "Khám tổng quát (Linh hoạt)"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ngày hẹn:</span>
                  <span className="font-semibold text-slate-800">
                    {appointmentDate || "Chưa chọn"}
                  </span>
                </div>

                {/* Time */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Khung giờ:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {startTime ? (
                      <span className="text-[#0EA5B7]">
                        {startTime} {computedEndTime && `→ ${computedEndTime}`}
                      </span>
                    ) : (
                      "Chưa chọn giờ"
                    )}
                  </span>
                </div>

                {/* Estimated Price */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-slate-500">Chi phí dự kiến:</span>
                  <span className="text-lg font-black text-[#0EA5B7]">
                    {selectedService ? formatCurrency(selectedService.price) : "Theo tư vấn"}
                  </span>
                </div>
              </div>

              {/* Submit Error banner if any */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || pets.length === 0 || !startTime || !!conflictWarning}
                className={cn(
                  "w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2",
                  isSubmitting || pets.length === 0 || !startTime || !!conflictWarning
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-[#0EA5B7] hover:bg-[#0b8fa0] active:scale-98 shadow-[#0EA5B7]/25 hover:shadow-xl hover:shadow-[#0EA5B7]/30"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra & tạo lịch...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Lịch Hẹn</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-[11px] text-slate-400">
                  Lịch hẹn sẽ được kích hoạt ngay với trạng thái{" "}
                  <strong className="text-emerald-600">Đã xác nhận (Confirmed)</strong>
                </p>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#0EA5B7]" />
                Cần hỗ trợ đặt lịch khẩn cấp?
              </p>
              <p className="text-[11px] leading-relaxed">
                Trong trường hợp thú cưng có triệu chứng ngộ độc hoặc cấp cứu nguy kịch, vui lòng liên hệ hotline: <strong className="text-slate-800">1900 6868</strong> để được hỗ trợ ưu tiên ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
