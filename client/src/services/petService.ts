/**
 * petService.ts
 * CRUD thú cưng của owner.
 * Lưu ý: weight_kg chỉ đọc — không cập nhật trực tiếp.
 */

import axiosClient from "@/lib/axiosClient";
import type { Pet, CreatePetDTO, UpdatePetDTO } from "@/types/pet.type";
import { MOCK_PETS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const petService = {
  /** Lấy tất cả thú cưng của owner hiện tại */
  async getMyPets(): Promise<Pet[]> {
    if (USE_MOCK) return mockDelay(MOCK_PETS);
    const res = await axiosClient.get<Pet[]>("/pets");
    return res.data;
  },

  /** Lấy chi tiết một thú cưng */
  async getPetById(id: string): Promise<Pet> {
    if (USE_MOCK) {
      const pet = MOCK_PETS.find((p) => p.id === id);
      if (!pet) throw new Error("Thú cưng không tồn tại.");
      return mockDelay(pet);
    }
    const res = await axiosClient.get<Pet>(`/pets/${id}`);
    return res.data;
  },

  /** Tạo thú cưng mới */
  async createPet(dto: CreatePetDTO): Promise<Pet> {
    if (USE_MOCK) {
      const newPet: Pet = {
        id: "p_" + Date.now(),
        owner_id: "u1",
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockDelay(newPet);
    }
    const res = await axiosClient.post<Pet>("/pets", dto);
    return res.data;
  },

  /**
   * Cập nhật thông tin thú cưng.
   * KHÔNG bao gồm weight_kg — trường này read-only.
   */
  async updatePet(id: string, dto: UpdatePetDTO): Promise<Pet> {
    if (USE_MOCK) {
      const pet = MOCK_PETS.find((p) => p.id === id);
      if (!pet) throw new Error("Thú cưng không tồn tại.");
      return mockDelay({ ...pet, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<Pet>(`/pets/${id}`, dto);
    return res.data;
  },

  /** Xóa thú cưng */
  async deletePet(id: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await axiosClient.delete(`/pets/${id}`);
  },
};
