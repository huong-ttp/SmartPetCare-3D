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

// Mutable mock store
let _mockHealthLogs: PetHealthLog[] = [...MOCK_HEALTH_LOGS];

function normalizeLog(item: any): PetHealthLog {
  if (!item) return item;
  return {
    ...item,
    id: String(item.id ?? item.health_log_id ?? item.log_id ?? ""),
    pet_id: String(item.pet_id ?? ""),
    weight_kg: item.weight_kg !== null && item.weight_kg !== undefined ? Number(item.weight_kg) : undefined,
    height_cm: item.height_cm !== null && item.height_cm !== undefined ? Number(item.height_cm) : undefined,
    temperature: item.temperature !== null && item.temperature !== undefined ? Number(item.temperature) : undefined,
    log_date: item.log_date ? (typeof item.log_date === "string" ? item.log_date.split("T")[0] : String(item.log_date)) : "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  };
}

export const healthLogService = {
  async getByPetId(petId: string): Promise<PetHealthLog[]> {
    if (USE_MOCK) {
      return mockDelay(
        _mockHealthLogs
          .filter((l) => String(l.pet_id) === String(petId))
          .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())
      );
    }
    const res = await axiosClient.get<any>(`/health-logs/pet/${petId}`);
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return rawList.map(normalizeLog).sort((a: PetHealthLog, b: PetHealthLog) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  },

  async getLatestByPetId(petId: string): Promise<PetHealthLog | null> {
    if (USE_MOCK) {
      const logs = _mockHealthLogs
        .filter((l) => String(l.pet_id) === String(petId))
        .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
      return mockDelay(logs.length > 0 ? logs[0] : null);
    }
    const res = await axiosClient.get<any>(`/health-logs/pet/${petId}/latest`);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return raw ? normalizeLog(raw) : null;
  },

  async create(dto: CreatePetHealthLogDTO): Promise<PetHealthLog> {
    if (USE_MOCK) {
      const newLog: PetHealthLog = {
        id: "hl_" + Date.now(),
        logged_by: "u1",
        ...dto,
        weight_kg: dto.weight_kg !== undefined ? Number(dto.weight_kg) : undefined,
        height_cm: dto.height_cm !== undefined ? Number(dto.height_cm) : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      _mockHealthLogs.unshift(newLog);
      return mockDelay(newLog);
    }
    const payload = {
      ...dto,
      pet_id: Number(dto.pet_id) || dto.pet_id,
      weight_kg: dto.weight_kg !== undefined ? Number(dto.weight_kg) : undefined,
      height_cm: dto.height_cm !== undefined ? Number(dto.height_cm) : undefined,
    };
    const res = await axiosClient.post<any>("/health-logs", payload);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return normalizeLog(raw);
  },

  async update(id: string, dto: UpdatePetHealthLogDTO): Promise<PetHealthLog> {
    if (USE_MOCK) {
      const idx = _mockHealthLogs.findIndex((l) => l.id === id);
      if (idx === -1) throw new Error("Nhật ký không tồn tại.");
      const updated = { ..._mockHealthLogs[idx], ...dto, updated_at: new Date().toISOString() };
      _mockHealthLogs[idx] = updated;
      return mockDelay(updated);
    }
    const res = await axiosClient.patch<any>(`/health-logs/${id}`, dto);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return normalizeLog(raw);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      _mockHealthLogs = _mockHealthLogs.filter((l) => l.id !== id);
      return mockDelay(undefined);
    }
    await axiosClient.delete(`/health-logs/${id}`);
  },
};
