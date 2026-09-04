/**
 * healthLogService.ts — Nhật ký sức khỏe thú cưng
 */
import axiosClient from "@/lib/axiosClient";
import type { PetHealthLog, CreatePetHealthLogDTO, UpdatePetHealthLogDTO } from "@/types/health-log.type";
import { MOCK_HEALTH_LOGS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const healthLogService = {
  async getByPetId(petId: string): Promise<PetHealthLog[]> {
    if (USE_MOCK) return mockDelay(MOCK_HEALTH_LOGS.filter((l) => l.pet_id === petId));
    const res = await axiosClient.get<PetHealthLog[]>(`/pets/${petId}/health-logs`);
    return res.data;
  },

  async create(dto: CreatePetHealthLogDTO): Promise<PetHealthLog> {
    if (USE_MOCK) {
      return mockDelay({
        id: "hl_" + Date.now(),
        logged_by: "u1",
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PetHealthLog);
    }
    const res = await axiosClient.post<PetHealthLog>("/health-logs", dto);
    return res.data;
  },

  async update(id: string, dto: UpdatePetHealthLogDTO): Promise<PetHealthLog> {
    if (USE_MOCK) {
      const l = MOCK_HEALTH_LOGS.find((l) => l.id === id);
      if (!l) throw new Error("Nhật ký không tồn tại.");
      return mockDelay({ ...l, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<PetHealthLog>(`/health-logs/${id}`, dto);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await axiosClient.delete(`/health-logs/${id}`);
  },
};
