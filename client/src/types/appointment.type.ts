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
  pet_id: string;           // FK → Pet.id
  owner_id: string;         // FK → User.id (role: owner)
  service_id: string;       // FK → Service.id
  /**
   * NULL khi owner vừa đặt — admin gán doctor sau.
   */
  doctor_id: string | null; // FK → User.id (role: doctor)
  scheduled_at: string;     // ISO 8601 datetime
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Owner tạo appointment — không chọn doctor
export interface CreateAppointmentDTO {
  pet_id: string;
  service_id: string;
  scheduled_at: string;
  notes?: string;
}

// Admin gán/đổi bác sĩ
export interface AssignDoctorDTO {
  doctor_id: string;
}

// Admin/Doctor thay đổi trạng thái
export interface UpdateAppointmentStatusDTO {
  status: AppointmentStatus;
}
