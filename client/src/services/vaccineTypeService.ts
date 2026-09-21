/**
 * vaccineTypeService.ts
 * Service truy vấn danh mục loại vắc xin (VACCINE_TYPES).
 * Hỗ trợ cả API backend (/vaccine-types) và mock fallback.
 */

import axiosClient from "@/lib/axiosClient";
import type { VaccineType, CreateVaccineTypeDTO, UpdateVaccineTypeDTO } from "@/types/vaccination.type";
import { MOCK_VACCINE_TYPES, MOCK_PET_VACCINATIONS } from "@/lib/mock";

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
      if (Array.isArray(rawList)) {
        return rawList.map(normalizeVaccineType);
      }
      return [];
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

    const payload = {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      recommended_interval_days: Number(dto.recommended_interval_days),
    };

    const res = await axiosClient.post<any>("/vaccine-types", payload);
    const raw = res.data?.data ?? res.data;
    return normalizeVaccineType(raw);
  },

  /** Cập nhật thông tin loại vắc xin (admin) */
  async update(id: string | number, dto: UpdateVaccineTypeDTO): Promise<VaccineType> {
    if (USE_MOCK) {
      const cleanId = String(id);
      const index = MOCK_VACCINE_TYPES.findIndex(
        (v) => String(v.id) === cleanId || String(v.vaccine_type_id) === cleanId
      );
      if (index !== -1) {
        MOCK_VACCINE_TYPES[index] = {
          ...MOCK_VACCINE_TYPES[index],
          ...dto,
          updated_at: new Date().toISOString(),
        };
        return mockDelay(normalizeVaccineType(MOCK_VACCINE_TYPES[index]));
      }
      throw new Error("Không tìm thấy loại vắc xin");
    }

    const payload = {
      name: dto.name?.trim(),
      description: dto.description?.trim() || null,
      recommended_interval_days: dto.recommended_interval_days !== undefined ? Number(dto.recommended_interval_days) : undefined,
    };

    const res = await axiosClient.put<any>(`/vaccine-types/${id}`, payload);
    const raw = res.data?.data ?? res.data;
    return normalizeVaccineType(raw);
  },

  /** Xóa loại vắc xin (admin) */
  async delete(id: string | number): Promise<void> {
    if (USE_MOCK) {
      const cleanId = String(id);
      // Kiểm tra xem có hồ sơ tiêm chủng nào đang sử dụng loại vaccine này không
      const hasLinked = MOCK_PET_VACCINATIONS.some(
        (pv) => String(pv.vaccine_type_id) === cleanId
      );
      if (hasLinked) {
        throw new Error("Cannot delete vaccine type because vaccination records are linked.");
      }

      const index = MOCK_VACCINE_TYPES.findIndex(
        (v) => String(v.id) === cleanId || String(v.vaccine_type_id) === cleanId
      );
      if (index !== -1) {
        MOCK_VACCINE_TYPES.splice(index, 1);
      }
      return mockDelay(undefined);
    }

    try {
      await axiosClient.delete(`/vaccine-types/${id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xóa loại vắc xin.";
      throw new Error(message);
    }
  },
};

/**
 * Thỏa mãn cả cú pháp: vaccineType.service.list(), vaccine-type.service.list()
 */
export const vaccineType = {
  service: vaccineTypeService,
};

// Export thêm alias cho quy chuẩn vaccine-type
export const vaccineTypeApi = {
  service: vaccineTypeService,
};

export default vaccineTypeService;
