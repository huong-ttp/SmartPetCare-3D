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
export function normalizeService(item: any): Service {
  if (!item) return item;
  const name = item.name ?? "Dịch vụ phòng khám";
  const desc = item.description ?? "";
  return {
    ...item,
    id: String(item.id ?? item.service_id ?? ""),
    name,
    description: desc,
    price: Number(item.price ?? 0),
    duration_minutes: item.duration_minutes !== undefined ? Number(item.duration_minutes) : 30,
    category: normalizeCategory(item.category, name, desc),
    is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
    created_at: item.created_at ?? new Date().toISOString(),
    updated_at: item.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Lấy danh sách dịch vụ:
 * - Admin query: trả về ServiceListResult { items: Service[], pagination: ServicePagination }
 * - Owner query / simple query: trả về Service[]
 */
export async function listServices(filters: ServiceFilterParams): Promise<ServiceListResult>;
export async function listServices(params?: { is_active?: boolean }): Promise<Service[]>;
export async function listServices(params?: ServiceFilterParams | { is_active?: boolean }): Promise<any> {
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

    try {
      const res = await axiosClient.get<any>("/services/admin", {
        params: { search, category, status, page, limit },
      });
      const raw = res.data?.data ?? res.data;
      const items = (raw?.items ?? []).map(normalizeService);
      const pagination: ServicePagination = raw?.pagination ?? {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit) || 1,
      };
      return { items, pagination };
    } catch (err: any) {
      console.warn("[serviceService.list admin] API failed, falling back to mock:", err);
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
      return {
        items: paginatedItems,
        pagination: { page, limit, total, totalPages },
      };
    }
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

    try {
      const res = await axiosClient.get<any>("/services", { params });
      const raw = res.data;
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.data)) {
        list = raw.data;
      } else if (Array.isArray(raw?.items)) {
        list = raw.items;
      }

      let normalized = list.map(normalizeService);
      if (params?.is_active !== undefined) {
        normalized = normalized.filter((s) => s.is_active === params.is_active);
      }
      return normalized;
    } catch (err) {
      console.warn("[serviceService.getAll] API failed, using fallback mock data:", err);
      let list = MOCK_SERVICES.map(normalizeService);
      if (params?.is_active !== undefined) {
        list = list.filter((s) => s.is_active === params.is_active);
      }
      return list;
    }
  },

  list: listServices,


  async getById(id: string | number): Promise<Service> {
    if (USE_MOCK) {
      const s = MOCK_SERVICES.find((s) => String(s.id) === String(id));
      if (!s) throw new Error("Dịch vụ không tồn tại.");
      return mockDelay(normalizeService(s));
    }
    const res = await axiosClient.get<any>(`/services/${id}`);
    const raw = res.data?.data ?? res.data;
    return normalizeService(raw);
  },

  async create(dto: CreateServiceDTO): Promise<Service> {
    const payload = {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      price: Number(dto.price),
      duration_minutes: dto.duration_minutes ? Number(dto.duration_minutes) : null,
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
      MOCK_SERVICES.unshift(created as any);
      return mockDelay(created);
    }

    const res = await axiosClient.post<any>("/services/admin", payload);
    const raw = res.data?.data ?? res.data;
    return normalizeService(raw);
  },

  async update(id: string | number, dto: UpdateServiceDTO): Promise<Service> {
    const payload: any = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description?.trim() || null;
    if (dto.price !== undefined) payload.price = Number(dto.price);
    if (dto.duration_minutes !== undefined) payload.duration_minutes = dto.duration_minutes ? Number(dto.duration_minutes) : null;
    if (dto.category !== undefined) payload.category = (dto.category as string).toLowerCase();

    if (USE_MOCK) {
      const index = MOCK_SERVICES.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error("Dịch vụ không tồn tại.");
      const updated = normalizeService({
        ...MOCK_SERVICES[index],
        ...payload,
        updated_at: new Date().toISOString(),
      });
      MOCK_SERVICES[index] = updated as any;
      return mockDelay(updated);
    }

    const res = await axiosClient.put<any>(`/services/admin/${id}`, payload);
    const raw = res.data?.data ?? res.data;
    return normalizeService(raw);
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
      MOCK_SERVICES[index] = updated as any;
      return mockDelay(updated);
    }

    const res = await axiosClient.patch<any>(`/services/admin/${id}/toggle-active`);
    const raw = res.data?.data ?? res.data;
    return normalizeService(raw);
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
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
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

