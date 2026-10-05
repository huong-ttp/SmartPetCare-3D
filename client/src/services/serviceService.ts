/**
 * serviceService.ts — Dịch vụ phòng khám (Owner xem, Admin CRUD)
 */
import axiosClient from "@/lib/axiosClient";
import type {
  Service,
  ServiceCategory,
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceFilterParams,
  ServicePagination,
  ServiceListResult,
} from "@/types/service.type";
import type { ApiResponse } from "@/types/api.type";
import { MOCK_SERVICES } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

/**
 * Tự động phân loại danh mục dựa trên từ khóa nếu backend chưa có cột category
 */
export function inferCategory(name = "", description = ""): ServiceCategory {
  const text = `${name} ${description}`.toLowerCase();
  if (/tiêm|vaccine|vắc xin|phòng dại|rabisin|ngừa|miễn dịch/.test(text)) {
    return "Vaccination";
  }
  if (/phẫu thuật|triệt sản|tiểu phẫu|mổ|cạo vôi|nhổ răng|gây mê|khâu|xương/.test(text)) {
    return "Surgery";
  }
  if (/tắm|spa|grooming|cắt tỉa|tỉa lông|cắt móng|vệ sinh tai|nhổ lông tai|sấy/.test(text)) {
    return "Grooming";
  }
  if (/khám|siêu âm|xét nghiệm|nội soi|chẩn đoán|doppler|sinh hóa|máu|x-quang/.test(text)) {
    return "Examination";
  }
  if (/khách sạn|lưu trú|đưa đón|nội trú|trông giữ/.test(text)) {
    return "Other";
  }
  return "Other";
}

/**
 * Chuẩn hóa chuỗi category thành 1 trong 5 danh mục chuẩn
 */
export function normalizeCategory(cat?: string, name?: string, description?: string): ServiceCategory {
  if (!cat) return inferCategory(name, description);
  const lower = cat.toLowerCase().trim();
  if (lower === "examination" || lower === "khám bệnh" || lower === "kham") return "Examination";
  if (lower === "vaccination" || lower === "tiêm phòng" || lower === "tiem") return "Vaccination";
  if (lower === "surgery" || lower === "phẫu thuật" || lower === "phau thuat") return "Surgery";
  if (lower === "grooming" || lower === "spa" || lower === "làm đẹp") return "Grooming";
  if (lower === "other" || lower === "khác" || lower === "khac") return "Other";
  return inferCategory(name, description);
}

/**
 * Chuẩn hóa entity Service từ API hoặc Mock
 */
export function normalizeService(item: unknown): Service {
  if (!item) return item as unknown as Service;
  const s = item as Record<string, unknown>;
  const name = (s.name as string) ?? "Dịch vụ phòng khám";
  const desc = (s.description as string) ?? "";
  return {
    ...(item as Service),
    id: String(s.id ?? s.service_id ?? ""),
    name,
    description: desc,
    price: Number(s.price ?? 0),
    duration_minutes: s.duration_minutes !== undefined && s.duration_minutes !== null ? Number(s.duration_minutes) : 30,
    category: normalizeCategory(s.category as string | undefined, name, desc),
    is_active: s.is_active !== undefined ? Boolean(s.is_active) : true,
    created_at: (s.created_at as string) ?? new Date().toISOString(),
    updated_at: (s.updated_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Lấy danh sách dịch vụ:
 * - Admin query: trả về ServiceListResult { items: Service[], pagination: ServicePagination }
 * - Owner query / simple query: trả về Service[]
 */
export async function listServices(filters: ServiceFilterParams): Promise<ServiceListResult>;
export async function listServices(params?: { is_active?: boolean }): Promise<Service[]>;
export async function listServices(params?: ServiceFilterParams | { is_active?: boolean }): Promise<ServiceListResult | Service[]> {
  const isAdminQuery =
    params &&
    ((params as ServiceFilterParams).page !== undefined ||
      (params as ServiceFilterParams).limit !== undefined ||
      (params as ServiceFilterParams).status !== undefined ||
      (params as ServiceFilterParams).category !== undefined ||
      (params as ServiceFilterParams).search !== undefined);

  if (isAdminQuery) {
    const filters = params as ServiceFilterParams;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const category = filters.category && filters.category !== "all" ? filters.category.toLowerCase() : undefined;
    const status = filters.status && filters.status !== "all" ? filters.status : undefined;
    const search = filters.search?.trim() || undefined;

    if (USE_MOCK) {
      let list = MOCK_SERVICES.map(normalizeService);
      if (search) {
        list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
      }
      if (category) {
        list = list.filter((s) => s.category.toLowerCase() === category);
      }
      if (status) {
        list = list.filter((s) => (status === "active" ? s.is_active : !s.is_active));
      }
      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedItems = list.slice(startIndex, startIndex + limit);
      return mockDelay<ServiceListResult>({
        items: paginatedItems,
        pagination: { page, limit, total, totalPages },
      });
    }

    const res = await axiosClient.get<ApiResponse<{ items?: Service[]; pagination?: ServicePagination }>>("/services/admin", {
      params: { search, category, status, page, limit },
    });
    const raw = res.data?.data ?? (res.data as unknown as { items?: Service[]; pagination?: ServicePagination });
    const items = ((raw?.items ?? []) as Array<Partial<Service> & Record<string, unknown>>).map(normalizeService);
    const pagination: ServicePagination = raw?.pagination ?? {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
    };
    return { items, pagination };
  }

  return serviceService.getAll(params as { is_active?: boolean });
}

export const serviceService = {
  /**
   * Lấy danh sách dịch vụ (hỗ trợ filter is_active)
   */
  async getAll(params?: { is_active?: boolean }): Promise<Service[]> {
    if (USE_MOCK) {
      let list = MOCK_SERVICES.map(normalizeService);
      if (params?.is_active !== undefined) {
        list = list.filter((s) => s.is_active === params.is_active);
      }
      return mockDelay(list);
    }

    const res = await axiosClient.get<ApiResponse<Service[]> | Service[]>("/services", { params });
    const raw = res.data;
    let list: unknown[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && Array.isArray((raw as ApiResponse<Service[]>).data)) {
      list = (raw as ApiResponse<Service[]>).data ?? [];
    } else if (raw && typeof raw === "object" && "items" in raw && Array.isArray((raw as { items?: Service[] }).items)) {
      list = (raw as { items: Service[] }).items;
    }

    let normalized = list.map(normalizeService);
    if (params?.is_active !== undefined) {
      normalized = normalized.filter((s) => s.is_active === params.is_active);
    }
    return normalized;
  },

  list: listServices,

  async getById(id: string | number): Promise<Service> {
    if (USE_MOCK) {
      const s = MOCK_SERVICES.find((s) => String(s.id) === String(id));
      if (!s) throw new Error("Dịch vụ không tồn tại.");
      return mockDelay(normalizeService(s));
    }
    const res = await axiosClient.get<ApiResponse<Service> | Service>(`/services/${id}`);
    const raw = (res.data as ApiResponse<Service>)?.data ?? (res.data as Service);
    return normalizeService(raw as Partial<Service> & Record<string, unknown>);
  },

  async create(dto: CreateServiceDTO): Promise<Service> {
    const payload = {
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      price: Number(dto.price),
      duration_minutes: dto.duration_minutes ? Number(dto.duration_minutes) : undefined,
      category: (dto.category || "other").toLowerCase(),
      is_active: dto.is_active ?? true,
    };

    if (USE_MOCK) {
      const created = normalizeService({
        id: "sv_" + Date.now(),
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      MOCK_SERVICES.unshift(created);
      return mockDelay(created);
    }

    const res = await axiosClient.post<ApiResponse<Service> | Service>("/services/admin", payload);
    const raw = (res.data as ApiResponse<Service>)?.data ?? (res.data as Service);
    return normalizeService(raw as Partial<Service> & Record<string, unknown>);
  },

  async update(id: string | number, dto: UpdateServiceDTO): Promise<Service> {
    const payload: Partial<CreateServiceDTO> = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description?.trim() || undefined;
    if (dto.price !== undefined) payload.price = Number(dto.price);
    if (dto.duration_minutes !== undefined) payload.duration_minutes = dto.duration_minutes ? Number(dto.duration_minutes) : undefined;
    if (dto.category !== undefined) payload.category = dto.category;

    if (USE_MOCK) {
      const index = MOCK_SERVICES.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error("Dịch vụ không tồn tại.");
      const updated = normalizeService({
        ...MOCK_SERVICES[index],
        ...payload,
        updated_at: new Date().toISOString(),
      });
      MOCK_SERVICES[index] = updated;
      return mockDelay(updated);
    }

    const res = await axiosClient.put<ApiResponse<Service> | Service>(`/services/admin/${id}`, payload);
    const raw = (res.data as ApiResponse<Service>)?.data ?? (res.data as Service);
    return normalizeService(raw as Partial<Service> & Record<string, unknown>);
  },

  async toggleActive(id: string | number): Promise<Service> {
    if (USE_MOCK) {
      const index = MOCK_SERVICES.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error("Dịch vụ không tồn tại.");
      const current = MOCK_SERVICES[index];
      const updated = normalizeService({
        ...current,
        is_active: !current.is_active,
        updated_at: new Date().toISOString(),
      });
      MOCK_SERVICES[index] = updated;
      return mockDelay(updated);
    }

    const res = await axiosClient.patch<ApiResponse<Service> | Service>(`/services/admin/${id}/toggle-active`);
    const raw = (res.data as ApiResponse<Service>)?.data ?? (res.data as Service);
    return normalizeService(raw as Partial<Service> & Record<string, unknown>);
  },

  async delete(id: string | number): Promise<void> {
    if (USE_MOCK) {
      const index = MOCK_SERVICES.findIndex((s) => String(s.id) === String(id));
      if (index !== -1) {
        MOCK_SERVICES.splice(index, 1);
      }
      return mockDelay(undefined);
    }

    try {
      await axiosClient.delete(`/services/admin/${id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xóa dịch vụ.";
      throw new Error(message);
    }
  },
};

/**
 * Thỏa mãn cả cú pháp: service.service.list(filters), service.service.create({...}), etc.
 */
export const service = {
  service: serviceService,
};

export default serviceService;
