// ============================================================
// PET_HEALTH_LOGS entity types
// weight_kg tại đây → dùng để cập nhật Pet.weight_kg (cache)
// ============================================================

export interface PetHealthLog {
  id: string;
  pet_id: string;     // FK → Pet.id
  logged_by: string;  // FK → User.id (owner hoặc doctor)
  log_date: string;   // ISO date
  /**
   * Cân nặng đo được — sẽ được dùng để cập nhật Pet.weight_kg cache.
   */
  weight_kg?: number;
  temperature?: number; // °C
  appetite?: "normal" | "decreased" | "increased" | "none";
  activity_level?: "normal" | "low" | "high" | "lethargic";
  stool_condition?: "normal" | "soft" | "liquid" | "hard" | "blood";
  vomiting?: boolean;
  symptoms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePetHealthLogDTO {
  pet_id: string;
  log_date: string;
  weight_kg?: number;
  temperature?: number;
  appetite?: PetHealthLog["appetite"];
  activity_level?: PetHealthLog["activity_level"];
  stool_condition?: PetHealthLog["stool_condition"];
  vomiting?: boolean;
  symptoms?: string;
  notes?: string;
}

export type UpdatePetHealthLogDTO = Partial<Omit<CreatePetHealthLogDTO, "pet_id">>;
