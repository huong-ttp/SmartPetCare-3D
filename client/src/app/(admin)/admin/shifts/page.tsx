"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Sun,
  Sunset,
  Coffee,
  Users,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import scheduleService, { formatIsoDate, getWeekDateRange } from "@/services/scheduleService";
import type {
  DoctorShift,
  ShiftDoctorOption,
  ShiftStatus,
} from "@/types/schedule.type";
import { cn } from "@/utils/cn";

const WEEKDAYS = [
  { label: "T2", value: 1 },
  { label: "T3", value: 2 },
  { label: "T4", value: 3 },
  { label: "T5", value: 4 },
  { label: "T6", value: 5 },
  { label: "T7", value: 6 },
  { label: "CN", value: 0 },
];

const WEEKDAY_NAMES = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const DEFAULT_TIMES = {
  morning: { start: "08:00", end: "12:00" },
  afternoon: { start: "13:00", end: "17:00" },
};

const STATUS_STYLES: Record<ShiftStatus, { label: string; cls: string }> = {
  active: { label: "Đang trực", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  scheduled: { label: "Sắp diễn ra", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  completed: { label: "Đã xong", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  off: { label: "Nghỉ trực", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

const inputCls =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:border-[#0EA5B7] focus:ring-2 focus:ring-[#0EA5B7]/20";

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

function formatVn(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function listDates(from: string, to: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end && out.length < 62) {
    out.push(formatIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export default function AdminShiftsPage() {
  const toast = useToast();

  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [doctorFilter, setDoctorFilter] = useState<number | "all">("all");
  const [doctors, setDoctors] = useState<ShiftDoctorOption[]>([]);
  const [shifts, setShifts] = useState<DoctorShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorShift | null>(null);
  const [deleting, setDeleting] = useState<DoctorShift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const week = useMemo(() => getWeekDateRange(anchor), [anchor]);
  const todayIso = useMemo(() => formatIsoDate(new Date()), []);

  const loadShifts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await scheduleService.listAdminShifts(
        week.startDate,
        week.endDate,
        doctorFilter === "all" ? null : doctorFilter
      );
      setShifts(data);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách ca trực."));
    } finally {
      setIsLoading(false);
    }
  }, [week.startDate, week.endDate, doctorFilter]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    scheduleService
      .getDoctorOptions()
      .then(setDoctors)
      .catch((err) => toast.error(getErrorMessage(err, "Không thể tải danh sách bác sĩ.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, DoctorShift[]>();
    week.dates.forEach((d) => map.set(d, []));
    shifts.forEach((s) => map.get(s.date)?.push(s));
    return map;
  }, [shifts, week.dates]);

  const stats = useMemo(() => {
    const working = shifts.filter((s) => s.status !== "off");
    return {
      total: working.length,
      off: shifts.length - working.length,
      appointments: shifts.reduce((sum, s) => sum + (s.appointments_count || 0), 0),
      doctors: new Set(working.map((s) => s.doctor_id)).size,
    };
  }, [shifts]);

  const shiftWeek = (delta: number) => {
    const next = new Date(anchor);
    next.setDate(next.getDate() + delta * 7);
    setAnchor(next);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await scheduleService.deleteShift(deleting.shift_id ?? deleting.id);
      toast.success("Đã xóa ca trực.");
      setDeleting(null);
      loadShifts();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa ca trực."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium">Ca trực bác sĩ</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-[#0EA5B7] border border-sky-100 shadow-sm">
              <CalendarClock size={22} />
            </span>
            Quản lý ca trực bác sĩ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân ca sáng/chiều cho bác sĩ, theo dõi công suất và số lịch hẹn trong từng ca.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadShifts}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
            title="Tải lại"
          >
            <RefreshCw size={18} className={cn(isLoading && "animate-spin text-[#0EA5B7]")} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0EA5B7] to-sky-600 text-white font-medium text-sm rounded-xl shadow-md shadow-sky-500/20 hover:opacity-95 transition-all"
          >
            <Plus size={18} />
            <span>Phân ca mới</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ca làm việc trong tuần", value: stats.total, icon: <CalendarClock size={22} />, tone: "bg-sky-50 text-[#0EA5B7]" },
          { label: "Bác sĩ có ca", value: stats.doctors, icon: <Stethoscope size={22} />, tone: "bg-emerald-50 text-emerald-600" },
          { label: "Lịch hẹn trong ca", value: stats.appointments, icon: <Users size={22} />, tone: "bg-indigo-50 text-indigo-600" },
          { label: "Ca nghỉ", value: stats.off, icon: <Coffee size={22} />, tone: "bg-amber-50 text-amber-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", c.tone)}>{c.icon}</div>
            <div>
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <p className="text-2xl font-heading font-bold text-slate-900 mt-0.5">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => shiftWeek(-1)} className="p-2 rounded-lg text-slate-600 hover:bg-white" title="Tuần trước">
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(new Date())}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-white"
            >
              Tuần này
            </button>
            <button type="button" onClick={() => shiftWeek(1)} className="p-2 rounded-lg text-slate-600 hover:bg-white" title="Tuần sau">
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-sm font-semibold text-slate-700">
            {formatVn(week.startDate)} – {formatVn(week.endDate)}
          </span>
        </div>

        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className={cn(inputCls, "md:w-64")}
          aria-label="Lọc theo bác sĩ"
        >
          <option value="all">Tất cả bác sĩ</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {error && (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <p className="text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={loadShifts}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0EA5B7] rounded-xl"
            >
              <RefreshCw size={16} /> Thử lại
            </button>
          </div>
        )}

        {isLoading && !error && (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && !error && shifts.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-sky-50 text-[#0EA5B7] flex items-center justify-center border border-sky-100">
              <CalendarClock size={32} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Chưa có ca trực nào trong tuần này</h3>
            <p className="text-sm text-slate-500">Bấm “Phân ca mới” để xếp lịch trực cho bác sĩ.</p>
          </div>
        )}

        {!isLoading && !error && shifts.length > 0 && (
          <div className="divide-y divide-slate-100">
            {week.dates.map((date) => {
              const dayShifts = shiftsByDate.get(date) ?? [];
              if (dayShifts.length === 0) return null;
              const dow = new Date(`${date}T00:00:00`).getDay();
              const isToday = date === todayIso;

              return (
                <div key={date} className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className={cn("font-heading font-bold text-sm", isToday ? "text-[#0EA5B7]" : "text-slate-800")}>
                      {WEEKDAY_NAMES[dow]} · {formatVn(date)}
                    </h3>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#0EA5B7] text-white">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {dayShifts.map((s) => {
                      const st = STATUS_STYLES[s.status];
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "rounded-xl border p-3.5 flex items-start justify-between gap-3",
                            s.status === "off" ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-[#0EA5B7]/40"
                          )}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {s.shift_type === "morning" ? (
                                <Sun size={15} className="text-amber-500" />
                              ) : (
                                <Sunset size={15} className="text-teal-600" />
                              )}
                              <span className="font-semibold text-sm text-slate-900">
                                {s.shift_type === "morning" ? "Ca sáng" : "Ca chiều"}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={12} /> {s.start_time} – {s.end_time}
                              </span>
                              <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold border", st.cls)}>
                                {st.label}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 flex items-center gap-1.5">
                              <Stethoscope size={13} className="text-slate-400" />
                              <span className="font-medium">{s.doctor_name}</span>
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                              <Building size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{s.room}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Lịch hẹn:{" "}
                              <span className="font-semibold text-slate-700">
                                {s.appointments_count ?? 0}/{s.max_patients}
                              </span>
                              {s.note ? <span className="text-slate-400"> · {s.note}</span> : null}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditing(s)}
                              className="p-2 text-slate-500 hover:text-[#0EA5B7] hover:bg-sky-50 rounded-lg transition-all"
                              title="Chỉnh sửa ca"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(s)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Xóa ca"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateShiftModal
        isOpen={isCreateOpen}
        doctors={doctors}
        defaultDate={week.startDate}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadShifts}
      />

      <EditShiftModal shift={editing} onClose={() => setEditing(null)} onSuccess={loadShifts} />

      <Modal
        isOpen={Boolean(deleting)}
        onClose={() => !isDeleting && setDeleting(null)}
        title="Xóa ca trực"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeleting ? "Đang xóa..." : "Xóa ca"}
            </button>
          </div>
        }
      >
        {deleting && (
          <p className="text-sm text-slate-600 leading-relaxed">
            Xóa {deleting.shift_type === "morning" ? "ca sáng" : "ca chiều"} ngày{" "}
            <strong>{formatVn(deleting.date)}</strong> của <strong>{deleting.doctor_name}</strong>?
            {(deleting.appointments_count ?? 0) > 0 && (
              <span className="block mt-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                Ca này đang có {deleting.appointments_count} lịch hẹn. Lịch hẹn sẽ không bị hủy nhưng không còn
                nằm trong ca trực nào.
              </span>
            )}
          </p>
        )}
      </Modal>
    </div>
  );
}

// ─── Create modal ────────────────────────────────────────────────────────────

function CreateShiftModal({
  isOpen,
  doctors,
  defaultDate,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  doctors: ShiftDoctorOption[];
  defaultDate: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [doctorId, setDoctorId] = useState<number | "">("");
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [types, setTypes] = useState<("morning" | "afternoon")[]>(["morning", "afternoon"]);
  const [maxPatients, setMaxPatients] = useState(6);
  const [isOff, setIsOff] = useState(false);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDoctorId("");
      setFromDate(defaultDate);
      setToDate(defaultDate);
      setWeekdays([1, 2, 3, 4, 5, 6]);
      setTypes(["morning", "afternoon"]);
      setMaxPatients(6);
      setIsOff(false);
      setNote("");
      setFormError("");
    }
  }, [isOpen, defaultDate]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const dates = useMemo(
    () =>
      fromDate && toDate && toDate >= fromDate
        ? listDates(fromDate, toDate).filter((d) => weekdays.includes(new Date(`${d}T00:00:00`).getDay()))
        : [],
    [fromDate, toDate, weekdays]
  );

  const handleSubmit = async () => {
    if (!doctorId) return setFormError("Vui lòng chọn bác sĩ.");
    if (!fromDate || !toDate || toDate < fromDate) return setFormError("Khoảng ngày không hợp lệ.");
    if (dates.length === 0) return setFormError("Không có ngày nào được chọn trong khoảng này.");
    if (dates.length > 62) return setFormError("Chỉ phân tối đa 62 ngày mỗi lần.");
    if (types.length === 0) return setFormError("Chọn ít nhất 1 ca.");

    setIsSubmitting(true);
    setFormError("");
    try {
      const res = await scheduleService.createShifts({
        doctor_id: doctorId,
        dates,
        shift_types: types,
        max_patients: maxPatients,
        is_off: isOff,
        note: note.trim() || null,
      });
      toast.success(
        res.skipped_count > 0
          ? `Đã tạo ${res.created_count} ca, bỏ qua ${res.skipped_count} ca đã tồn tại.`
          : `Đã tạo ${res.created_count} ca trực.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err, "Không thể tạo ca trực."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Phân ca trực mới"
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-xs text-slate-500">
            {dates.length} ngày × {types.length} ca = <strong>{dates.length * types.length}</strong> ca
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white gradient-primary rounded-xl hover:opacity-95 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? "Đang tạo..." : "Tạo ca trực"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Bác sĩ <span className="text-rose-500">*</span>
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : "")}
            className={inputCls}
          >
            <option value="">— Chọn bác sĩ —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Từ ngày</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đến ngày</label>
            <input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Áp dụng cho các thứ</label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWeekdays((p) => toggle(p, w.value))}
                className={cn(
                  "w-10 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  weekdays.includes(w.value)
                    ? "bg-[#0EA5B7] text-white border-[#0EA5B7]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ca trực</label>
          <div className="flex gap-2">
            {(["morning", "afternoon"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypes((p) => toggle(p, t))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                  types.includes(t)
                    ? "bg-sky-50 border-[#0EA5B7] text-[#0EA5B7]"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
              >
                {t === "morning" ? <Sun size={15} /> : <Sunset size={15} />}
                {t === "morning"
                  ? `Ca sáng (${DEFAULT_TIMES.morning.start} - ${DEFAULT_TIMES.morning.end})`
                  : `Ca chiều (${DEFAULT_TIMES.afternoon.start} - ${DEFAULT_TIMES.afternoon.end})`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số bệnh nhân tối đa / ca</label>
            <input
              type="number"
              min={0}
              max={100}
              value={maxPatients}
              onChange={(e) => setMaxPatients(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-2.5 cursor-pointer">
            <input type="checkbox" checked={isOff} onChange={(e) => setIsOff(e.target.checked)} className="w-4 h-4 accent-[#0EA5B7]" />
            Đánh dấu là ca nghỉ
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="Tuỳ chọn" />
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit modal ──────────────────────────────────────────────────────────────

function EditShiftModal({
  shift,
  onClose,
  onSuccess,
}: {
  shift: DoctorShift | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [room, setRoom] = useState("");
  const [maxPatients, setMaxPatients] = useState(6);
  const [isOff, setIsOff] = useState(false);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shift) {
      setStart(shift.start_time);
      setEnd(shift.end_time);
      setRoom(shift.room || "");
      setMaxPatients(shift.is_off ? 6 : shift.max_patients);
      setIsOff(Boolean(shift.is_off));
      setNote(shift.note || "");
      setFormError("");
    }
  }, [shift]);

  const handleSubmit = async () => {
    if (!shift) return;
    if (!start || !end || end <= start) return setFormError("Giờ kết thúc phải sau giờ bắt đầu.");

    setIsSubmitting(true);
    setFormError("");
    try {
      await scheduleService.updateShift(shift.shift_id ?? shift.id, {
        start_time: start,
        end_time: end,
        room: room.trim() || null,
        max_patients: maxPatients,
        is_off: isOff,
        note: note.trim() || null,
      });
      toast.success("Đã cập nhật ca trực.");
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err, "Không thể cập nhật ca trực."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(shift)}
      onClose={onClose}
      title="Chỉnh sửa ca trực"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white gradient-primary rounded-xl hover:opacity-95 disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      }
    >
      {shift && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{shift.doctor_name}</strong> · {shift.shift_type === "morning" ? "Ca sáng" : "Ca chiều"} ·{" "}
            {formatVn(shift.date)}
          </p>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giờ bắt đầu</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giờ kết thúc</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phòng khám</label>
            <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số bệnh nhân tối đa</label>
              <input
                type="number"
                min={0}
                max={100}
                value={maxPatients}
                onChange={(e) => setMaxPatients(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-2.5 cursor-pointer">
              <input type="checkbox" checked={isOff} onChange={(e) => setIsOff(e.target.checked)} className="w-4 h-4 accent-[#0EA5B7]" />
              Ca nghỉ
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </div>
        </div>
      )}
    </Modal>
  );
}
