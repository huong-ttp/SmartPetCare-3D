/**
 * scheduleService.ts
 * Quản lý Lịch làm việc & Ca trực của Bác sĩ (Doctor Work Schedule / Shifts).
 * Kết nối API hoặc tự động mapping từ appointmentService khi hệ thống chưa có bảng ca trực riêng.
 */

import axiosClient from "@/lib/axiosClient";
import appointmentService from "./appointmentService";
import type { Appointment } from "@/types/appointment.type";
import type { DoctorShift, ScheduleSummary, ShiftType } from "@/types/schedule.type";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

/**
 * Định dạng ngày thành YYYY-MM-DD
 */
export function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Lấy thứ 2 đầu tuần và Chủ Nhật cuối tuần cho một ngày bất kỳ (tuần bắt đầu từ Thứ Hai)
 */
export function getWeekDateRange(baseDate: Date = new Date()): {
  startDate: string;
  endDate: string;
  dates: string[];
} {
  const current = new Date(baseDate);
  // getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const dayOfWeek = current.getDay();
  // Khoảng cách tới Thứ Hai (nếu Chủ Nhật thì lùi 6 ngày, các ngày khác lùi dayOfWeek - 1)
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatIsoDate(d));
  }

  return {
    startDate: dates[0],
    endDate: dates[6],
    dates,
  };
}

/**
 * Tự động tính trạng thái của ca trực theo thời gian thực tế
 */
function calculateShiftStatus(
  dateStr: string,
  shiftType: ShiftType,
  isOff: boolean = false
): "scheduled" | "active" | "completed" | "off" {
  if (isOff) return "off";

  const todayStr = formatIsoDate(new Date());

  if (dateStr < todayStr) {
    return "completed";
  }

  if (dateStr > todayStr) {
    return "scheduled";
  }

  // dateStr === todayStr
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (shiftType === "morning") {
    // 08:00 (480) - 12:00 (720)
    if (currentMinutes < 480) return "scheduled";
    if (currentMinutes <= 720) return "active";
    return "completed";
  }

  if (shiftType === "afternoon") {
    // 13:00 (780) - 17:00 (1020)
    if (currentMinutes < 780) return "scheduled";
    if (currentMinutes <= 1020) return "active";
    return "completed";
  }

  if (shiftType === "on_call") {
    // 17:00 (1020) - 21:00 (1260)
    if (currentMinutes < 1020) return "scheduled";
    if (currentMinutes <= 1260) return "active";
    return "completed";
  }

  return "scheduled";
}

/**
 * Phân bổ lịch hẹn vào đúng ca sáng hoặc ca chiều
 */
function isApptInShift(appt: Appointment, shiftType: ShiftType): boolean {
  const time = appt.start_time || (appt.scheduled_at ? appt.scheduled_at.split("T")[1]?.slice(0, 5) : "");
  if (!time) return shiftType === "morning"; // fallback

  const hour = parseInt(time.split(":")[0], 10);
  if (shiftType === "morning") {
    return hour < 12;
  }
  if (shiftType === "afternoon") {
    return hour >= 12 && hour < 17;
  }
  if (shiftType === "on_call") {
    return hour >= 17;
  }
  return false;
}

export const scheduleService = {
  /**
   * Lấy danh sách ca trực của bác sĩ trong khoảng ngày [startDate, endDate].
   * Tự động mapping với danh sách appointments từ appointmentService.
   */
  async getDoctorShifts(startDate: string, endDate: string): Promise<DoctorShift[]> {
    try {
      // Nếu có API backend /doctor/shifts hoặc /appointments/doctor/shifts
      if (!USE_MOCK) {
        try {
          const res = await axiosClient.get<any>("/doctor/shifts", {
            params: { startDate, endDate },
          });
          const raw = res.data?.data ?? res.data;
          if (Array.isArray(raw) && raw.length > 0) {
            return raw;
          }
        } catch {
          // Bỏ qua lỗi 404/500 và fallback sang cơ chế mapping appointments
        }
      }

      // Lấy toàn bộ appointments của bác sĩ (bao gồm hôm nay, sắp tới và đã hoàn thành)
      const [todayAppts, upcomingAppts, completedAppts] = await Promise.all([
        appointmentService.getDoctorAppointments("today").catch(() => []),
        appointmentService.getDoctorAppointments("upcoming").catch(() => []),
        appointmentService.getDoctorAppointments("completed").catch(() => []),
      ]);

      // Hợp nhất danh sách và loại bỏ trùng lặp theo ID
      const apptMap = new Map<string, Appointment>();
      [...todayAppts, ...upcomingAppts, ...completedAppts].forEach((item) => {
        const key = String(item.id || item.appointment_id);
        if (!apptMap.has(key)) {
          apptMap.set(key, item);
        }
      });
      const allAppts = Array.from(apptMap.values());

      // Tạo mảng ngày giữa startDate và endDate
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateList: string[] = [];

      const current = new Date(start);
      while (current <= end) {
        dateList.push(formatIsoDate(current));
        current.setDate(current.getDate() + 1);
      }

      // Sinh ca trực chuẩn cho mỗi ngày
      const shifts: DoctorShift[] = [];

      dateList.forEach((dateStr) => {
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy

        // Tìm các lịch hẹn trong ngày này
        const dayAppts = allAppts.filter((a) => {
          const aDate = a.appointment_date || (a.scheduled_at ? a.scheduled_at.split("T")[0] : "");
          return aDate === dateStr && a.status !== "cancelled";
        });

        // 1. Ca Sáng (08:00 - 12:00)
        const morningAppts = dayAppts
          .filter((a) => isApptInShift(a, "morning"))
          .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

        shifts.push({
          id: `shift-${dateStr}-morning`,
          date: dateStr,
          shift_type: "morning",
          start_time: "08:00",
          end_time: "12:00",
          room: "Phòng khám 101 - Khám tổng quát & Tiêm phòng",
          status: calculateShiftStatus(dateStr, "morning", false),
          max_patients: 6,
          appointments_count: morningAppts.length,
          appointments: morningAppts,
          note: "Tiếp nhận khám tổng quát, tư vấn dinh dưỡng và tiêm chủng",
        });

        // 2. Ca Chiều (13:00 - 17:00)
        // Chủ Nhật chiều là ca nghỉ định kỳ (off) nếu không có lịch hẹn khẩn cấp
        const isSundayAfternoon = dayOfWeek === 0;
        const afternoonAppts = dayAppts
          .filter((a) => isApptInShift(a, "afternoon"))
          .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

        const isAfternoonOff = isSundayAfternoon && afternoonAppts.length === 0;

        shifts.push({
          id: `shift-${dateStr}-afternoon`,
          date: dateStr,
          shift_type: "afternoon",
          start_time: "13:00",
          end_time: "17:00",
          room: "Phòng khám 103 - Da liễu, Siêu âm & Tiểu phẫu",
          status: calculateShiftStatus(dateStr, "afternoon", isAfternoonOff),
          max_patients: isAfternoonOff ? 0 : 6,
          appointments_count: afternoonAppts.length,
          appointments: afternoonAppts,
          note: isAfternoonOff
            ? "Nghỉ định kỳ chiều Chủ Nhật"
            : "Chẩn đoán hình ảnh, điều trị da liễu & xử lý ca bệnh",
        });
      });

      return mockDelay(shifts, 250);
    } catch (error) {
      console.error("[scheduleService.getDoctorShifts] Error:", error);
      return [];
    }
  },

  /**
   * Tổng hợp số liệu thống kê từ danh sách ca trực
   */
  getScheduleSummary(shifts: DoctorShift[]): ScheduleSummary {
    const todayStr = formatIsoDate(new Date());

    const activeShifts = shifts.filter((s) => s.status !== "off");
    const total_shifts = activeShifts.length;
    const completed_shifts = shifts.filter((s) => s.status === "completed").length;
    const current_active = shifts.filter((s) => s.status === "active").length;
    const upcoming_shifts = shifts.filter((s) => s.status === "scheduled").length;
    const today_shifts = shifts.filter((s) => s.date === todayStr && s.status !== "off").length;

    const total_appointments = shifts.reduce(
      (sum, s) => sum + (s.appointments_count || s.appointments?.length || 0),
      0
    );

    const total_capacity = activeShifts.reduce((sum, s) => sum + (s.max_patients || 0), 0);

    const occupancy_rate =
      total_capacity > 0 ? Math.min(100, Math.round((total_appointments / total_capacity) * 100)) : 0;

    return {
      total_shifts,
      completed_shifts,
      active_shifts: current_active,
      upcoming_shifts,
      today_shifts,
      total_appointments,
      occupancy_rate,
    };
  },
};

export default scheduleService;
