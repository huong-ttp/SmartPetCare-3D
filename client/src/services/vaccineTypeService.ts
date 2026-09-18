/**
 * vaccineTypeService.ts
 * Service truy vấn danh mục loại vắc xin (VACCINE_TYPES).
 * Hỗ trợ cả API backend (/vaccine-types) và mock fallback.
 */

import axiosClient from "@/lib/axiosClient";
import type { VaccineType, CreateVaccineTypeDTO } from "@/types/vaccination.type";
import { MOCK_VACCINE_TYPES } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function normalizeVaccineType(raw: any): VaccineType {
  const id = raw.vaccine_type_id ?? raw.id;
  return {
    id: String(id),
    vaccine_type_id: id,
    name: raw.name || "Vắc xin",
    description: raw.description || "",
    recommended_interval_days: Number(raw.recommended_interval_days) || 365,
    applicable_species: raw.applicable_species || (raw.name?.toLowerCase().includes("mèo") ? ["cat"] : ["dog", "cat"]),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const vaccineTypeService = {
  /**
   * Lấy danh sách các loại vắc xin
   * API: vaccine-type.service.list()
   */
  async list(): Promise<VaccineType[]> {
    if (USE_MOCK) {
      return mockDelay(MOCK_VACCINE_TYPES.map(normalizeVaccineType));
    }

    try {
      const res = await axiosClient.get<any>("/vaccine-types");
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map(normalizeVaccineType);
      }
      return MOCK_VACCINE_TYPES.map(normalizeVaccineType);
    } catch (err) {
      console.warn("[vaccineTypeService.list] Failed to fetch from API, falling back to mock:", err);
      return MOCK_VACCINE_TYPES.map(normalizeVaccineType);
    }
  },

  /** Alias: getAll */
  async getAll(): Promise<VaccineType[]> {
    return this.list();
  },

  /** Lấy thông tin 1 loại vắc xin theo ID */
  async getById(id: string | number): Promise<VaccineType | null> {
    const list = await this.list();
    const cleanId = String(id);
    return (
      list.find(
        (v) => String(v.id) === cleanId || String(v.vaccine_type_id) === cleanId
      ) || null
    );
  },

  /** Tạo mới loại vắc xin (admin) */
  async create(dto: CreateVaccineTypeDTO): Promise<VaccineType> {
    if (USE_MOCK) {
      const newType: VaccineType = {
        id: "vt_" + Date.now(),
        vaccine_type_id: Date.now(),
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_VACCINE_TYPES.push(newType);
      return mockDelay(normalizeVaccineType(newType));
    }

    const res = await axiosClient.post<any>("/vaccine-types", dto);
    const raw = res.data?.data ?? res.data;
    return normalizeVaccineType(raw);
  },
};

/**
 * Thỏa mãn cả cú pháp: vaccine-type.service.list()
 */
export const vaccineType = {
  service: vaccineTypeService,
};

export default vaccineTypeService;
