/**
 * petService.ts
 * CRUD thú cưng của owner.
 * Lưu ý: weight_kg chỉ đọc — không cập nhật trực tiếp.
 */

import axiosClient from "@/lib/axiosClient";
import type { Pet, PetSpecies, CreatePetDTO, UpdatePetDTO } from "@/types/pet.type";
import { MOCK_PETS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// Mutable mock store (phản ánh thay đổi trong runtime)
let _mockPets: Pet[] = [...MOCK_PETS];

function normalizePet(item: any): Pet {
  if (!item) return item;
  return {
    ...item,
    id: String(item.id ?? item.pet_id ?? ""),
    microchip_number: item.microchip_number ?? item.microchip_id ?? undefined,
    notes: item.notes ?? item.special_notes ?? undefined,
  };
}

export const petService = {
  /** Lấy tất cả thú cưng của owner hiện tại */
  async getMyPets(): Promise<Pet[]> {
    if (USE_MOCK) return mockDelay([..._mockPets]);
    const res = await axiosClient.get<any>("/pets");
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return rawList.map(normalizePet);
  },

  /** Alias: getMyPets (cho phép gọi petService.list()) */
  async list(): Promise<Pet[]> {
    return petService.getMyPets();
  },

  /** Lấy chi tiết một thú cưng */
  async getPetById(id: string): Promise<Pet> {
    if (USE_MOCK) {
      const pet = _mockPets.find((p) => p.id === id);
      if (!pet) throw new Error("NOT_FOUND");
      return mockDelay({ ...pet });
    }
    const res = await axiosClient.get<any>(`/pets/${id}`);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return normalizePet(raw);
  },

  /** Alias: getPetById (cho phép gọi petService.getById(id)) */
  async getById(id: string): Promise<Pet> {
    return petService.getPetById(id);
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
      _mockPets = [..._mockPets, newPet];
      return mockDelay(newPet);
    }
    // Chuyển đổi DTO nếu backend cần microchip_id / special_notes
    const payload = {
      ...dto,
      microchip_id: (dto as any).microchip_id ?? dto.microchip_number,
      special_notes: (dto as any).special_notes ?? dto.notes,
    };
    const res = await axiosClient.post<any>("/pets", payload);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return normalizePet(raw);
  },

  /** Alias: createPet */
  async create(dto: CreatePetDTO): Promise<Pet> {
    return petService.createPet(dto);
  },

  /**
   * Cập nhật thông tin thú cưng.
   * KHÔNG bao gồm weight_kg — trường này read-only.
   */
  async updatePet(id: string, dto: UpdatePetDTO): Promise<Pet> {
    if (USE_MOCK) {
      const idx = _mockPets.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("NOT_FOUND");
      const updated: Pet = {
        ..._mockPets[idx],
        ...dto,
        species: (dto.species as PetSpecies) || _mockPets[idx].species,
        updated_at: new Date().toISOString(),
      };
      _mockPets = _mockPets.map((p) => (p.id === id ? updated : p));
      return mockDelay(updated);
    }
    const payload = {
      ...dto,
      microchip_id: (dto as any).microchip_id ?? dto.microchip_number,
      special_notes: (dto as any).special_notes ?? dto.notes,
    };
    const res = await axiosClient.patch<any>(`/pets/${id}`, payload);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return normalizePet(raw);
  },

  /** Alias: updatePet */
  async update(id: string, dto: UpdatePetDTO): Promise<Pet> {
    return petService.updatePet(id, dto);
  },

  /** Xóa thú cưng */
  async deletePet(id: string): Promise<void> {
    if (USE_MOCK) {
      _mockPets = _mockPets.filter((p) => p.id !== id);
      return mockDelay(undefined);
    }
    await axiosClient.delete(`/pets/${id}`);
  },

  /** Alias: deletePet (cho phép gọi petService.delete(id)) */
  async delete(id: string): Promise<void> {
    return petService.deletePet(id);
  },
};
