/**
 * vaccinationService.ts
 * next_due_date tự tính phía backend — không gửi trong DTO.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  VaccineType,
  PetVaccination,
  CreatePetVaccinationDTO,
  CreateVaccineTypeDTO,
} from "@/types/vaccination.type";
import { MOCK_VACCINE_TYPES, MOCK_PET_VACCINATIONS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const vaccinationService = {
  // ─── Vaccine types (admin quản lý) ─────────────────────────────────────

  async getVaccineTypes(): Promise<VaccineType[]> {
    if (USE_MOCK) return mockDelay(MOCK_VACCINE_TYPES);
    const res = await axiosClient.get<VaccineType[]>("/vaccine-types");
    return res.data;
  },

  async createVaccineType(dto: CreateVaccineTypeDTO): Promise<VaccineType> {
    if (USE_MOCK) {
      return mockDelay({
        id: "vt_" + Date.now(),
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    const res = await axiosClient.post<VaccineType>("/vaccine-types", dto);
    return res.data;
  },

  // ─── Pet vaccinations ───────────────────────────────────────────────────

  async getVaccinationsByPetId(petId: string): Promise<PetVaccination[]> {
    if (USE_MOCK) return mockDelay(MOCK_PET_VACCINATIONS.filter((v) => v.pet_id === petId));
    const res = await axiosClient.get<PetVaccination[]>(`/pets/${petId}/vaccinations`);
    return res.data;
  },

  /**
   * Tạo bản ghi tiêm — next_due_date KHÔNG truyền, backend tự tính.
   */
  async createVaccination(dto: CreatePetVaccinationDTO): Promise<PetVaccination> {
    if (USE_MOCK) {
      const vt = MOCK_VACCINE_TYPES.find((v) => v.id === dto.vaccine_type_id);
      const intervalDays = vt?.recommended_interval_days ?? 365;
      const nextDue = new Date(dto.date_administered);
      nextDue.setDate(nextDue.getDate() + intervalDays);

      return mockDelay({
        id: "pv_" + Date.now(),
        doctor_id: "u2",
        ...dto,
        next_due_date: nextDue.toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PetVaccination);
    }
    const res = await axiosClient.post<PetVaccination>("/vaccinations", dto);
    return res.data;
  },
};
