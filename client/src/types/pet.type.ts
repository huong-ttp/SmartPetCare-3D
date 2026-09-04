// ============================================================
// PET entity types
// ============================================================

export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "hamster" | "other";
export type PetGender  = "male" | "female" | "unknown";

export interface Pet {
  id: string;
  owner_id: string;   // FK → User.id (role: owner)
  name: string;
  species: PetSpecies;
  breed?: string;
  gender: PetGender;
  date_of_birth?: string; // ISO date YYYY-MM-DD
  avatar_url?: string;
  color?: string;
  microchip_number?: string;
  /**
   * CHỈ ĐỌC — được cache từ PET_HEALTH_LOGS.weight_kg hoặc
   * MEDICAL_RECORDS.weight_at_visit mới nhất.
   * KHÔNG được cập nhật trực tiếp.
   */
  readonly weight_kg?: number;
  is_neutered?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePetDTO {
  name: string;
  species: PetSpecies;
  breed?: string;
  gender: PetGender;
  date_of_birth?: string;
  avatar_url?: string;
  color?: string;
  microchip_number?: string;
  is_neutered?: boolean;
  notes?: string;
}

export type UpdatePetDTO = Partial<Omit<CreatePetDTO, "species">>;
