// ============================================================
// DOCTOR SCHEDULE & SHIFT entity types
// ============================================================

import type { Appointment } from "./appointment.type";

export type ShiftType = "morning" | "afternoon" | "on_call";

export type ShiftStatus = "scheduled" | "active" | "completed" | "off";

export interface DoctorShift {
  id: string;
  date: string; // YYYY-MM-DD
  shift_type: ShiftType;
  start_time: string; // HH:mm (e.g. "08:00")
  end_time: string;   // HH:mm (e.g. "12:00")
  room: string;       // e.g. "Phòng khám 101 - Khám tổng quát"
  status: ShiftStatus;
  max_patients: number;
  appointments_count?: number;
  appointments?: Appointment[];
  note?: string;
}

export interface ScheduleSummary {
  total_shifts: number;
  completed_shifts: number;
  active_shifts: number;
  upcoming_shifts: number;
  today_shifts: number;
  total_appointments: number;
  occupancy_rate: number; // Tỷ lệ lấp đầy phần trăm (0 - 100)
}

export interface ShiftFilterDTO {
  startDate?: string;
  endDate?: string;
  shift_type?: ShiftType | "all";
  status?: ShiftStatus | "all";
}
