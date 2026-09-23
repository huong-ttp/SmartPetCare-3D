"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Search,
  Calendar,
  User,
  Phone,
  RefreshCw,
  Plus,
  Scale,
  Thermometer,
  Utensils,
  Zap,
  Sparkles,
  Stethoscope,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  AlertTriangle,
  ChevronRight,
  Eye,
  Heart,
  Dog,
  Cat,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { healthLogService } from "@/services/healthLogService";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { DoctorPatient, MedicalRecord } from "@/types/medical-record.type";
import type { PetHealthLog, CreatePetHealthLogDTO } from "@/types/health-log.type";
import { HealthLogStatsCards } from "@/components/health-logs/HealthLogStatsCards";
import { HealthLogCharts } from "@/components/health-logs/HealthLogCharts";
import { HealthLogHistoryTable } from "@/components/health-logs/HealthLogHistoryTable";
import { getSpeciesEmoji, getSpeciesLabel, getSpeciesBadgeColor } from "@/utils/petHelpers";
import { formatDate } from "@/utils/formatDate";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

export default function DoctorHealthLogsPage() {
  const { user } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  // Patients state
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Selected pet telemetry state
  const [logs, setLogs] = useState<PetHealthLog[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Health Log Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formDate, setFormDate] = useState(todayStr);
  const [formWeight, setFormWeight] = useState("");
  const [formTemp, setFormTemp] = useState("");
  const [formAppetite, setFormAppetite] = useState<PetHealthLog["appetite"]>("normal");
  const [formActivity, setFormActivity] = useState<PetHealthLog["activity_level"]>("normal");
  const [formStool, setFormStool] = useState<PetHealthLog["stool_condition"]>("normal");
  const [formVomiting, setFormVomiting] = useState(false);
  const [formSymptoms, setFormSymptoms] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // 1. Fetch Doctor's patients
  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const data = await medicalRecordService.listPatientsByDoctor(user?.id);
      setPatients(data);
      if (data.length > 0 && !selectedPetId) {
        setSelectedPetId(String(data[0].pet_id));
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách bệnh nhân:", err);
      showToastError("Không thể tải danh sách bệnh nhân theo dõi.");
    } finally {
      setIsLoadingPatients(false);
    }
  }, [user?.id, selectedPetId, showToastError]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // 2. Fetch logs & medical records for selected patient
  const fetchPatientTelemetry = useCallback(
    async (petId: string, showIndicator = true) => {
      if (showIndicator) setIsLoadingLogs(true);
      try {
        const [logsData, mrData] = await Promise.all([
          healthLogService.getByPetId(petId).catch((err) => {
            console.warn("Lỗi getByPetId:", err);
            return [] as PetHealthLog[];
          }),
          medicalRecordService.getByPetId(petId).catch((err) => {
            console.warn("Lỗi getByPetId MR:", err);
            return [] as MedicalRecord[];
          }),
        ]);
        setLogs(logsData);
        setMedicalRecords(mrData);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu sức khỏe của thú cưng:", err);
        showToastError("Không thể tải dữ liệu chỉ số sức khỏe của thú cưng.");
      } finally {
        if (showIndicator) setIsLoadingLogs(false);
      }
    },
    [showToastError]
  );

  useEffect(() => {
    if (selectedPetId) {
      fetchPatientTelemetry(selectedPetId);
    }
  }, [selectedPetId, fetchPatientTelemetry]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!selectedPetId) return;
    setIsRefreshing(true);
    await fetchPatientTelemetry(selectedPetId, false);
    setIsRefreshing(false);
    showToastSuccess("Đã làm mới dữ liệu sinh hiệu & nhật ký theo dõi.");
  };

  // Filter patients by search term
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.owner_name.toLowerCase().includes(q) ||
        (p.breed && p.breed.toLowerCase().includes(q)) ||
        (p.owner_phone && p.owner_phone.includes(q))
    );
  }, [patients, patientSearch]);

  // Currently selected patient object
  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.pet_id) === String(selectedPetId)) || null;
  }, [patients, selectedPetId]);

  // Open modal handler
  const handleOpenAddModal = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormWeight(selectedPatient?.weight_kg ? String(selectedPatient.weight_kg) : "");
    setFormTemp("");
    setFormAppetite("normal");
    setFormActivity("normal");
    setFormStool("normal");
    setFormVomiting(false);
    setFormSymptoms("");
    setFormNotes("");
    setModalError(null);
    setIsAddModalOpen(true);
  };

  // Handle modal submit
  const handleCreateHealthLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) return;
    setModalError(null);

    const numWeight = formWeight.trim() ? parseFloat(formWeight) : undefined;
    const numTemp = formTemp.trim() ? parseFloat(formTemp) : undefined;

    if (numWeight === undefined && numTemp === undefined) {
      setModalError("Vui lòng nhập ít nhất Cân nặng (kg) hoặc Thân nhiệt (°C).");
      return;
    }

    if (numWeight !== undefined && (isNaN(numWeight) || numWeight <= 0 || numWeight > 300)) {
      setModalError("Cân nặng không hợp lệ (phải từ 0.05 đến 300 kg).");
      return;
    }

    if (numTemp !== undefined && (isNaN(numTemp) || numTemp < 32 || numTemp > 45)) {
      setModalError("Thân nhiệt không hợp lệ (phải nằm trong khoảng 32°C đến 45°C).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreatePetHealthLogDTO = {
        pet_id: selectedPetId,
        log_date: formDate,
        weight_kg: numWeight,
        temperature: numTemp,
        appetite: formAppetite,
        activity_level: formActivity,
        stool_condition: formStool,
        vomiting: formVomiting,
        symptoms: formSymptoms.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };

      const newLog = await healthLogService.create(payload);

      // Prepend log to list
      setLogs((prev) => [newLog, ...prev]);

      // Update patient cache weight if provided
      if (numWeight !== undefined) {
        setPatients((prev) =>
          prev.map((p) =>
            String(p.pet_id) === String(selectedPetId)
              ? { ...p, weight_kg: numWeight }
              : p
          )
        );
      }

      showToastSuccess(`Đã ghi nhận nhật ký sức khỏe cho bé ${selectedPatient?.name || ""} thành công.`);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("Lỗi khi thêm nhật ký:", err);
      const msg = err?.response?.data?.message || err?.message || "Không thể lưu nhật ký sức khỏe.";
      setModalError(msg);
      showToastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle log deleted callback
  const handleLogDeleted = (deletedId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== deletedId));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header Banner ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 translate-y-12 w-48 h-48 rounded-full bg-cyan-300/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Activity size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Nhật ký theo dõi & Sinh hiệu Bệnh nhân
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
                  Telemetry Hub
                </span>
              </div>
              <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Theo dõi biến thiên cân nặng, thân nhiệt, thói quen ăn uống và phản ứng lâm sàng của các thú cưng đang trong phác đồ điều trị hoặc theo dõi định kỳ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-right">
              <div className="text-[11px] text-sky-100 font-medium">Bệnh nhân đang theo dõi</div>
              <div className="text-lg font-black text-white">{patients.length} bé</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main 2-Column Master - Detail Layout ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── CỘT TRÁI (Patient Selector - 30% width / lg:col-span-4) ─── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5 sticky top-20">
            {/* Header selector */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                  {filteredPatients.length}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Danh sách Bệnh nhân</h2>
                  <p className="text-[11px] text-slate-400">Chọn thú cưng để theo dõi sinh hiệu</p>
                </div>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative mb-3.5">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="search-patient-input"
                type="text"
                placeholder="Tìm tên bé, chủ nuôi, giống..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder:text-slate-400"
              />
              {patientSearch && (
                <button
                  type="button"
                  onClick={() => setPatientSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {isLoadingPatients ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-200" />
                      <div className="space-y-1 flex-1">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredPatients.length === 0 ? (
                <div className="py-8 text-center px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <Search size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Không tìm thấy bệnh nhân</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thử tìm kiếm với từ khóa khác
                  </p>
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const isSelected = String(patient.pet_id) === String(selectedPetId);
                  const speciesColor = getSpeciesBadgeColor(patient.species);

                  return (
                    <motion.button
                      key={patient.pet_id}
                      type="button"
                      onClick={() => setSelectedPetId(String(patient.pet_id))}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border transition-all relative flex items-start gap-3",
                        isSelected
                          ? "border-cyan-400 bg-gradient-to-r from-sky-50/90 via-cyan-50/50 to-white shadow-md ring-2 ring-cyan-400/30 border-l-4 border-l-cyan-500"
                          : "border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
                      )}
                    >
                      {/* Avatar / Emoji */}
                      {patient.avatar_url ? (
                        <img
                          src={patient.avatar_url}
                          alt={patient.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100 shadow-xs",
                            speciesColor.bg
                          )}
                        >
                          {getSpeciesEmoji(patient.species)}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3
                            className={cn(
                              "text-xs font-bold truncate",
                              isSelected ? "text-cyan-950" : "text-slate-900"
                            )}
                          >
                            {patient.name}
                          </h3>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-md font-semibold border shrink-0",
                              speciesColor.bg,
                              speciesColor.text,
                              speciesColor.border
                            )}
                          >
                            {getSpeciesLabel(patient.species)}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {patient.breed || "Giống chưa rõ"} • Chủ: {patient.owner_name}
                        </div>

                        {/* Bottom metrics */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {patient.last_visit_date
                              ? formatDate(patient.last_visit_date)
                              : "Mới tạo"}
                          </span>

                          <span className="font-bold text-slate-700 flex items-center gap-1 bg-slate-100/90 px-1.5 py-0.5 rounded-md">
                            <Scale size={10} className="text-violet-500" />
                            {patient.weight_kg !== undefined && patient.weight_kg !== null
                              ? `${patient.weight_kg} kg`
                              : "Chưa có"}
                          </span>
                        </div>
                      </div>

                      {/* Active arrow indicator */}
                      {isSelected && (
                        <div className="text-cyan-600 shrink-0 self-center">
                          <ChevronRight size={16} />
                        </div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── CỘT PHẢI (Telemetry Dashboard - 70% width / lg:col-span-8) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedPatient ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
                <Stethoscope size={30} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Chưa chọn thú cưng bệnh nhân
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Vui lòng chọn một thú cưng từ danh sách bên trái để xem bảng chỉ số sinh hiệu và nhật ký theo dõi.
              </p>
            </div>
          ) : (
            <>
              {/* ── Detail Header Banner ─────────────────────────────────── */}
              <motion.div
                key={selectedPatient.pet_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedPatient.avatar_url ? (
                      <img
                        src={selectedPatient.avatar_url}
                        alt={selectedPatient.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center text-3xl shadow-sm shrink-0">
                        {getSpeciesEmoji(selectedPatient.species)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-slate-900">
                          {selectedPatient.name}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          {getSpeciesEmoji(selectedPatient.species)} {getSpeciesLabel(selectedPatient.species)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                          {selectedPatient.gender === "male" ? "♂ Đực" : selectedPatient.gender === "female" ? "♀ Cái" : "Giới tính: Không rõ"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 mt-1">
                        <span>Giống: <strong className="text-slate-700">{selectedPatient.breed || "Chưa rõ"}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          Chủ: <strong className="text-slate-700">{selectedPatient.owner_name}</strong>
                        </span>
                        {selectedPatient.owner_phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-cyan-700">
                              <Phone size={12} />
                              {selectedPatient.owner_phone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
                      title="Tải lại chỉ số mới nhất"
                    >
                      <RefreshCw size={13} className={cn(isRefreshing && "animate-spin text-cyan-600")} />
                      Làm mới
                    </button>

                    <button
                      id="btn-add-doctor-health-log"
                      type="button"
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                    >
                      <Plus size={15} />
                      + Thêm nhật ký sức khỏe
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* ── Khu vực 1: HealthLogStatsCards ──────────────────────── */}
              <HealthLogStatsCards logs={logs} petName={selectedPatient.name} />

              {/* ── Khu vực 2: HealthLogCharts ──────────────────────────── */}
              <HealthLogCharts
                logs={logs}
                medicalRecords={medicalRecords}
                petName={selectedPatient.name}
              />

              {/* ── Khu vực 3: HealthLogHistoryTable ────────────────────── */}
              <HealthLogHistoryTable
                logs={logs}
                petName={selectedPatient.name}
                onLogDeleted={handleLogDeleted}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Modal: Bác sĩ thêm nhật ký theo dõi ────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-sky-50 via-cyan-50 to-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Ghi nhận nhật ký sức khỏe & Sinh hiệu
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bệnh nhân: <strong className="text-cyan-800">{selectedPatient.name}</strong> • Chủ nuôi: {selectedPatient.owner_name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleCreateHealthLog} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{modalError}</span>
                  </div>
                )}

                {/* Row 1: Ngày ghi nhận, Cân nặng, Thân nhiệt */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Log Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Calendar size={12} className="text-cyan-600" />
                      Ngày ghi nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      max={todayStr}
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-slate-800"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Scale size={12} className="text-violet-500" />
                      Cân nặng (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="300"
                        placeholder="VD: 4.8"
                        value={formWeight}
                        onChange={(e) => setFormWeight(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all pr-8 font-medium text-slate-800"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Thermometer size={12} className="text-rose-500" />
                      Thân nhiệt (°C)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="32"
                        max="44"
                        placeholder="VD: 38.5"
                        value={formTemp}
                        onChange={(e) => setFormTemp(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all pr-8 font-medium text-slate-800"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold pointer-events-none">
                        °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Ăn uống & Mức độ vận động */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Appetite */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Utensils size={12} className="text-emerald-500" />
                      Tình trạng ăn uống
                    </label>
                    <select
                      value={formAppetite}
                      onChange={(e) => setFormAppetite(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white transition-all font-medium text-slate-800"
                    >
                      <option value="normal">Bình thường (Ăn tốt)</option>
                      <option value="increased">Tăng khẩu vị (Ham ăn hơn)</option>
                      <option value="decreased">Giảm sút (Ăn kém)</option>
                      <option value="none">Bỏ ăn hoàn toàn</option>
                    </select>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Zap size={12} className="text-cyan-500" />
                      Mức độ vận động
                    </label>
                    <select
                      value={formActivity}
                      onChange={(e) => setFormActivity(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white transition-all font-medium text-slate-800"
                    >
                      <option value="normal">Bình thường (Linh hoạt)</option>
                      <option value="high">Rất năng động (Chạy nhảy nhiều)</option>
                      <option value="low">Kém vận động (Ít di chuyển)</option>
                      <option value="lethargic">Uể oải / Nằm li bì</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Tình trạng phân & Nôn mửa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stool Condition */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tình trạng phân / Tiêu hóa
                    </label>
                    <select
                      value={formStool}
                      onChange={(e) => setFormStool(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white transition-all font-medium text-slate-800"
                    >
                      <option value="normal">Phân tốt (Có khuôn chuẩn)</option>
                      <option value="soft">Phân mềm</option>
                      <option value="liquid">Tiêu chảy / Phân lỏng</option>
                      <option value="hard">Táo bón / Phân khô cứng</option>
                      <option value="blood">Phân có lẫn máu / Nhầy</option>
                    </select>
                  </div>

                  {/* Vomiting checkbox */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hiện tượng nôn mửa
                    </label>
                    <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={formVomiting}
                        onChange={(e) => setFormVomiting(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Bé có biểu hiện buồn nôn hoặc nôn mửa
                      </span>
                    </label>
                  </div>
                </div>

                {/* Triệu chứng lâm sàng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" />
                    Triệu chứng lâm sàng quan sát được
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Chảy nước mũi, mắt có ghèn, thở nhanh nhẹ, rụng lông..."
                    value={formSymptoms}
                    onChange={(e) => setFormSymptoms(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                  />
                </div>

                {/* Ghi chú / Lời dặn lâm sàng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <FileText size={12} className="text-slate-400" />
                    Lời dặn lâm sàng / Ghi chú của Bác sĩ
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Tiếp tục dùng kháng sinh đúng giờ, bổ sung men vi sinh và nước điện giải, tái khám đo lại thân nhiệt sau 48h..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800 resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Cân nặng sẽ tự động đồng bộ vào thông tin chung của thú cưng
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          Lưu nhật ký theo dõi
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
