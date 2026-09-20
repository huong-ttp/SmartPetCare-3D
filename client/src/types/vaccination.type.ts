// ============================================================
// VACCINE_TYPES + PET_VACCINATIONS entity types
// Business rule:
//   next_due_date = date_administered + recommended_interval_days
//   → Không sửa tay next_due_date, tính toán phía backend/service
// ============================================================

export interface VaccineType {
  id?: string | number;
  vaccine_type_id?: number | string;
  name: string;
  description?: string;
  /** Số ngày khuyến cáo giữa hai lần tiêm */
  recommended_interval_days: number;
  applicable_species?: string[]; // e.g. ["dog", "cat"]
  created_at?: string;
  updated_at?: string;
}

export interface PetVaccination {
  id?: string;
  vaccination_id?: number;
  pet_id: string | number;
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  pet_avatar?: string;
  owner_id?: string | number;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  vaccine_type_id: string | number;
  vaccine_name?: string;
  vaccine_type?: string;
  vaccine_description?: string;
  recommended_interval_days?: number;
  medical_record_id?: string | number | null;
  administered_by?: string | number;
  doctor_id?: string | number;
  doctor_name?: string;
  doctor_phone?: string;
  doctor_email?: string;
  appointment_id?: string | number | null;
  date_administered: string; // ISO date
  /**
   * READ-ONLY — computed: date_administered + recommended_interval_days.
   * Không được cập nhật bằng tay.
   */
  readonly next_due_date: string; // ISO date
  batch_number?: string;
  lot_number?: string;
  manufacturer?: string;
  reminder_sent?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePetVaccinationDTO {
  pet_id: string | number;
  vaccine_type_id: string | number;
  appointment_id?: string | number;
  medical_record_id?: string | number | null;
  date_administered: string;
  batch_number?: string;
  lot_number?: string;
  manufacturer?: string;
  notes?: string;
  next_due_date?: string;
}

export interface UpdatePetVaccinationDTO {
  batch_number?: string;
  date_administered?: string;
  notes?: string;
  administered_by?: string | number;
}

export interface CreateVaccineTypeDTO {
  name: string;
  description?: string;
  recommended_interval_days: number;
  applicable_species: string[];
}

export interface AdminVaccinationFilterParams {
  search?: string;
  vaccineType?: string | number;
  dueStatus?: "all" | "upcoming" | "due_soon" | "overdue" | "valid";
  page?: number;
  limit?: number;
}

export interface AdminVaccinationListResult {
  items: PetVaccination[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

