/**
 * serviceService.ts — Dịch vụ phòng khám (Owner xem, Admin CRUD)
 */
import axiosClient from "@/lib/axiosClient";
import type { Service, ServiceCategory, CreateServiceDTO, UpdateServiceDTO } from "@/types/service.type";
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
      // Fallback to mock data if backend route has issue
      let list = MOCK_SERVICES.map(normalizeService);
      if (params?.is_active !== undefined) {
        list = list.filter((s) => s.is_active === params.is_active);
      }
      return list;
    }
  },

  /**
   * Alias: list({ is_active: true })
   */
  async list(params: { is_active?: boolean } = { is_active: true }): Promise<Service[]> {
    return serviceService.getAll(params);
  },

  async getById(id: string): Promise<Service> {
    if (USE_MOCK) {
      const s = MOCK_SERVICES.find((s) => s.id === id);
      if (!s) throw new Error("Dịch vụ không tồn tại.");
      return mockDelay(normalizeService(s));
    }
    const res = await axiosClient.get<any>(`/services/${id}`);
    const raw = res.data?.data ?? res.data;
    return normalizeService(raw);
  },

  async create(dto: CreateServiceDTO): Promise<Service> {
    if (USE_MOCK) {
      return mockDelay(
        normalizeService({
          id: "sv_" + Date.now(),
          is_active: true,
          ...dto,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      );
    }
    const res = await axiosClient.post<Service>("/services", dto);
    const raw = (res.data as any)?.data ?? res.data;
    return normalizeService(raw);
  },

  async update(id: string, dto: UpdateServiceDTO): Promise<Service> {
    if (USE_MOCK) {
      const s = MOCK_SERVICES.find((s) => s.id === id);
      if (!s) throw new Error("Dịch vụ không tồn tại.");
      return mockDelay(normalizeService({ ...s, ...dto, updated_at: new Date().toISOString() }));
    }
    const res = await axiosClient.patch<Service>(`/services/${id}`, dto);
    const raw = (res.data as any)?.data ?? res.data;
    return normalizeService(raw);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await axiosClient.delete(`/services/${id}`);
  },
};

/**
 * Thỏa mãn cả cú pháp: service.service.list({is_active: true})
 */
export const service = {
  service: serviceService,
};

export default serviceService;
