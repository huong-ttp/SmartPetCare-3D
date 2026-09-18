/**
 * medicalRecordService.ts
 * Hồ sơ bệnh án — doctor tạo sau khi khám xong.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  MedicalRecord,
  CreateMedicalRecordDTO,
  UpdateMedicalRecordDTO,
} from "@/types/medical-record.type";
import { MOCK_MEDICAL_RECORDS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const medicalRecordService = {
  async listByPet(petId: string | number): Promise<MedicalRecord[]> {
    if (USE_MOCK) {
      return mockDelay(
        MOCK_MEDICAL_RECORDS.filter((r) => String(r.pet_id) === String(petId))
      );
    }
    const res = await axiosClient.get<any>(`/medical-records/pet/${petId}`);
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return rawList;
  },

  // Alias for backward compatibility
  async getByPetId(petId: string | number): Promise<MedicalRecord[]> {
    return this.listByPet(petId);
  },

  async getById(id: string | number): Promise<MedicalRecord> {
    if (USE_MOCK) {
      const r = MOCK_MEDICAL_RECORDS.find(
        (r) => String(r.id) === String(id) || String(r.record_id) === String(id)
      );
      if (!r) throw new Error("Hồ sơ không tồn tại.");
      return mockDelay(r);
    }
    const res = await axiosClient.get<any>(`/medical-records/${id}`);
    const data = res.data?.data ?? res.data;
    if (!data) throw new Error("Hồ sơ không tồn tại.");
    return data;
  },

  async create(dto: CreateMedicalRecordDTO): Promise<MedicalRecord> {
    if (USE_MOCK) {
      return mockDelay({
        id: "mr_" + Date.now(),
        doctor_id: "u2",
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as MedicalRecord);
    }
    const res = await axiosClient.post<MedicalRecord>("/medical-records", dto);
    return res.data;
  },

  async update(id: string, dto: UpdateMedicalRecordDTO): Promise<MedicalRecord> {
    if (USE_MOCK) {
      const r = MOCK_MEDICAL_RECORDS.find((r) => r.id === id);
      if (!r) throw new Error("Hồ sơ không tồn tại.");
      return mockDelay({ ...r, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<MedicalRecord>(`/medical-records/${id}`, dto);
    return res.data;
  },
};
