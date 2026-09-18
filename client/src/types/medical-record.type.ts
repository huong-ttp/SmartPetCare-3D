// ============================================================
// MEDICAL_RECORDS entity types
// weight_at_visit → dùng để cập nhật Pet.weight_kg (cache)
// ============================================================

export interface MedicalRecordVaccination {
  vaccination_id?: number | string;
  id?: string;
  pet_id?: number | string;
  vaccine_type_id?: number | string;
  medical_record_id?: number | string;
  administered_by?: number | string;
  date_administered?: string;
  next_due_date?: string;
  batch_number?: string;
  lot_number?: string;
  vaccine_name?: string;
  vaccine_description?: string;
  recommended_interval_days?: number;
}

export interface MedicalRecord {
  id?: string;
  record_id?: number;
  appointment_id?: string | number | null;
  pet_id: string | number;
  doctor_id?: string | number | null;
  doctor_name?: string;
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  owner_id?: number | string;

  /** Cân nặng tại thời điểm khám (kg) */
  weight_at_visit?: number | string;
  temperature?: number;
  record_date?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  follow_up_date?: string; // ISO date
  notes?: string;

  appointment_date?: string;
  appointment_start_time?: string;
  appointment_end_time?: string;
  appointment_status?: string;
  service_name?: string;

  vaccinations?: MedicalRecordVaccination[];

  created_at?: string;
  updated_at?: string;
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
