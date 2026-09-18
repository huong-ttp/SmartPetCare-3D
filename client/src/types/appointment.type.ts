// ============================================================
// APPOINTMENT entity types
// Business rules:
//   - status: confirmed | completed | cancelled — KHÔNG có "pending"/"rejected"
//   - owner đặt lịch KHÔNG chọn doctor (doctor_id = null)
//   - admin gán doctor sau khi owner đặt
// ============================================================

/**
 * Appointment chỉ có 3 trạng thái hợp lệ.
 * KHÔNG dùng "pending" hay "rejected".
 */
export type AppointmentStatus = "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  appointment_id?: number | string;
  pet_id: string;           // FK → Pet.id
  owner_id: string;         // FK → User.id (role: owner)
  service_id: string | null;// FK → Service.id (có thể null nếu chưa chọn)
  /**
   * NULL khi owner vừa đặt — admin gán doctor sau.
   */
  doctor_id: string | null; // FK → User.id (role: doctor)
  scheduled_at?: string;    // ISO 8601 datetime
  appointment_date?: string;// YYYY-MM-DD
  start_time?: string;      // HH:MM
  end_time?: string;        // HH:MM
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancel_reason?: string;
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  pet_weight?: number;
  service_name?: string;
  service_description?: string;
  service_price?: number;
  service_duration?: number;
  doctor_name?: string;
  doctor_phone?: string;
  owner_name?: string;
  owner_phone?: string;
  medical_record_id?: number | string;
  invoice_id?: number | string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFilterDTO {
  status?: AppointmentStatus | "all" | string;
  from?: string;
  to?: string;
  owner?: string;
  doctor?: "me" | string;
  date?: string;
  upcoming?: boolean;
}

export interface DoctorDashboardOverview {
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  patients: number;
}

export interface DoctorDashboardData {
  overview: DoctorDashboardOverview;
  todayAppointments: Appointment[];
}

// Owner tạo appointment — không chọn doctor
export interface CreateAppointmentDTO {
  pet_id: string | number;
  service_id?: string | number | null;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:MM
  end_time?: string;        // HH:MM
  reason?: string;
  notes?: string;
  scheduled_at?: string;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
}

// Admin gán/đổi bác sĩ
export interface AssignDoctorDTO {
  doctor_id: string;
}

// Admin/Doctor thay đổi trạng thái
export interface UpdateAppointmentStatusDTO {
  status: AppointmentStatus;
}

