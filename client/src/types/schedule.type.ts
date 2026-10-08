// ============================================================
// DOCTOR SCHEDULE & SHIFT entity types
// ============================================================

import type { Appointment } from "./appointment.type";

export type ShiftType = "morning" | "afternoon";

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
  shift_id?: number;
  doctor_id?: number;
  doctor_name?: string;
  is_off?: boolean;
}

export interface CreateShiftDTO {
  doctor_id: number;
  dates: string[];
  shift_types: ShiftType[];
  start_time?: string;
  end_time?: string;
  room?: string | null;
  max_patients?: number;
  is_off?: boolean;
  note?: string | null;
}

export interface UpdateShiftDTO {
  start_time?: string;
  end_time?: string;
  room?: string | null;
  max_patients?: number;
  is_off?: boolean;
  note?: string | null;
}

export interface CreateShiftResult {
  created_count: number;
  skipped_count: number;
}

export interface ShiftDoctorOption {
  id: number;
  full_name: string;
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
