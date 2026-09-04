/**
 * serviceService.ts — Dịch vụ phòng khám (admin CRUD)
 */
import axiosClient from "@/lib/axiosClient";
import type { Service, CreateServiceDTO, UpdateServiceDTO } from "@/types/service.type";
import { MOCK_SERVICES } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const serviceService = {
  async getAll(): Promise<Service[]> {
    if (USE_MOCK) return mockDelay(MOCK_SERVICES);
    const res = await axiosClient.get<Service[]>("/services");
    return res.data;
  },

  async getById(id: string): Promise<Service> {
    if (USE_MOCK) {
      const s = MOCK_SERVICES.find((s) => s.id === id);
      if (!s) throw new Error("Dịch vụ không tồn tại.");
      return mockDelay(s);
    }
    const res = await axiosClient.get<Service>(`/services/${id}`);
    return res.data;
  },

  async create(dto: CreateServiceDTO): Promise<Service> {
    if (USE_MOCK) {
      return mockDelay({
        id: "sv_" + Date.now(),
        is_active: true,
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    const res = await axiosClient.post<Service>("/services", dto);
    return res.data;
  },

  async update(id: string, dto: UpdateServiceDTO): Promise<Service> {
    if (USE_MOCK) {
      const s = MOCK_SERVICES.find((s) => s.id === id);
      if (!s) throw new Error("Dịch vụ không tồn tại.");
      return mockDelay({ ...s, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<Service>(`/services/${id}`, dto);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await axiosClient.delete(`/services/${id}`);
  },
};
