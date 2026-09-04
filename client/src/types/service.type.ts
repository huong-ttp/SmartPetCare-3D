// ============================================================
// SERVICES entity types (dịch vụ phòng khám)
// ============================================================

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;         // VND
  duration_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceDTO {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export type UpdateServiceDTO = Partial<CreateServiceDTO>;
