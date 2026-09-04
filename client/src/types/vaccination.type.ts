// ============================================================
// VACCINE_TYPES + PET_VACCINATIONS entity types
// Business rule:
//   next_due_date = date_administered + recommended_interval_days
//   → Không sửa tay next_due_date, tính toán phía backend/service
// ============================================================

export interface VaccineType {
  id: string;
  name: string;
  description?: string;
  /** Số ngày khuyến cáo giữa hai lần tiêm */
  recommended_interval_days: number;
  applicable_species: string[]; // e.g. ["dog", "cat"]
  created_at: string;
  updated_at: string;
}

export interface PetVaccination {
  id: string;
  pet_id: string;            // FK → Pet.id
  vaccine_type_id: string;   // FK → VaccineType.id
  doctor_id: string;         // FK → User.id (role: doctor)
  appointment_id?: string;   // FK → Appointment.id (optional)
  date_administered: string; // ISO date
  /**
   * READ-ONLY — computed: date_administered + recommended_interval_days.
   * Không được cập nhật bằng tay.
   */
  readonly next_due_date: string; // ISO date
  lot_number?: string;
  manufacturer?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePetVaccinationDTO {
  pet_id: string;
  vaccine_type_id: string;
  appointment_id?: string;
  date_administered: string;
  lot_number?: string;
  manufacturer?: string;
  notes?: string;
  // next_due_date tự tính — KHÔNG truyền
}

export interface CreateVaccineTypeDTO {
  name: string;
  description?: string;
  recommended_interval_days: number;
  applicable_species: string[];
}
