// ============================================================
// MEDICAL_RECORDS entity types
// weight_at_visit → dùng để cập nhật Pet.weight_kg (cache)
// ============================================================

export interface MedicalRecord {
  id: string;
  appointment_id: string; // FK → Appointment.id (1-1)
  pet_id: string;         // FK → Pet.id
  doctor_id: string;      // FK → User.id (role: doctor)
  /**
   * Cân nặng tại thời điểm khám — giá trị này được dùng để
   * cập nhật Pet.weight_kg (read-only cache).
   */
  weight_at_visit?: number; // kg
  temperature?: number;     // °C
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  follow_up_date?: string;  // ISO date
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicalRecordDTO {
  appointment_id: string;
  pet_id: string;
  weight_at_visit?: number;
  temperature?: number;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  follow_up_date?: string;
  notes?: string;
}

export type UpdateMedicalRecordDTO = Partial<Omit<CreateMedicalRecordDTO, "appointment_id" | "pet_id">>;
