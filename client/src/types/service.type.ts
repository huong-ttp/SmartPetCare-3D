// ============================================================
// SERVICES entity types (dịch vụ phòng khám)
// ============================================================

export type ServiceCategory =
  | "examination"
  | "vaccination"
  | "surgery"
  | "grooming"
  | "other"
  | "Examination"
  | "Vaccination"
  | "Surgery"
  | "Grooming"
  | "Other";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;         // VND
  duration_minutes?: number;
  category: ServiceCategory;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceDTO {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  category?: ServiceCategory;
  is_active?: boolean;
}

export type UpdateServiceDTO = Partial<CreateServiceDTO>;

export interface ServiceFilterParams {
  search?: string;
  category?: string;
  status?: string; // 'all' | 'active' | 'inactive'
  page?: number;
  limit?: number;
}

export interface ServicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServiceListResult {
  items: Service[];
  pagination: ServicePagination;
}

