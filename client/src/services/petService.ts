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
  async getPetById(id: string | number): Promise<Pet> {
    const cleanId = String(id ?? "").trim();
    if (!cleanId || cleanId === "undefined" || cleanId === "null") {
      console.warn("[petService.getPetById] Invalid or missing petId:", id);
      throw new Error("petId không hợp lệ hoặc không được cung cấp.");
    }

    if (USE_MOCK) {
      const pet = _mockPets.find((p) => String(p.id) === cleanId);
      if (!pet) throw new Error("NOT_FOUND");
      return mockDelay({ ...pet });
    }
    const res = await axiosClient.get<any>(`/pets/${cleanId}`);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return normalizePet(raw);
  },

  /** Alias: getPetById (cho phép gọi petService.getById(id)) */
  async getById(id: string | number): Promise<Pet> {
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
    // Chuyển đổi DTO và làm sạch chuỗi rỗng
    const rawChip = (dto as any).microchip_id ?? dto.microchip_number;
    const cleanMicrochip = typeof rawChip === "string" && rawChip.trim() !== "" ? rawChip.trim() : undefined;
    const rawNotes = (dto as any).special_notes ?? dto.notes;
    const cleanNotes = typeof rawNotes === "string" && rawNotes.trim() !== "" ? rawNotes.trim() : undefined;
    const cleanDob = typeof dto.date_of_birth === "string" && dto.date_of_birth.trim() !== "" ? dto.date_of_birth.trim() : undefined;
    const cleanBreed = typeof dto.breed === "string" && dto.breed.trim() !== "" ? dto.breed.trim() : undefined;
    const cleanColor = typeof dto.color === "string" && dto.color.trim() !== "" ? dto.color.trim() : undefined;
    const cleanAvatar = typeof dto.avatar_url === "string" && dto.avatar_url.trim() !== "" ? dto.avatar_url.trim() : undefined;
    const cleanAllergies = typeof dto.allergies === "string" && dto.allergies.trim() !== "" ? dto.allergies.trim() : undefined;
    const cleanChronic = typeof dto.chronic_conditions === "string" && dto.chronic_conditions.trim() !== "" ? dto.chronic_conditions.trim() : undefined;

    const payload = {
      ...dto,
      name: dto.name.trim(),
      species: dto.species,
      gender: dto.gender,
      breed: cleanBreed,
      color: cleanColor,
      date_of_birth: cleanDob,
      microchip_id: cleanMicrochip,
      avatar_url: cleanAvatar,
      allergies: cleanAllergies,
      chronic_conditions: cleanChronic,
      special_notes: cleanNotes,
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
  async updatePet(id: string | number, dto: UpdatePetDTO): Promise<Pet> {
    const cleanId = String(id ?? "").trim();
    if (USE_MOCK) {
      const idx = _mockPets.findIndex((p) => String(p.id) === cleanId);
      if (idx === -1) throw new Error("NOT_FOUND");
      const updated: Pet = {
        ..._mockPets[idx],
        ...dto,
        species: (dto.species as PetSpecies) || _mockPets[idx].species,
        updated_at: new Date().toISOString(),
      };
      _mockPets = _mockPets.map((p) => (String(p.id) === cleanId ? updated : p));
      return mockDelay(updated);
    }
    const rawChip = (dto as any).microchip_id ?? dto.microchip_number;
    const cleanMicrochip = typeof rawChip === "string" && rawChip.trim() !== "" ? rawChip.trim() : (rawChip === "" ? null : undefined);
    const rawNotes = (dto as any).special_notes ?? dto.notes;
    const cleanNotes = typeof rawNotes === "string" && rawNotes.trim() !== "" ? rawNotes.trim() : (rawNotes === "" ? null : undefined);
    const cleanDob = typeof dto.date_of_birth === "string" && dto.date_of_birth.trim() !== "" ? dto.date_of_birth.trim() : (dto.date_of_birth === "" ? null : undefined);
    const cleanBreed = typeof dto.breed === "string" && dto.breed.trim() !== "" ? dto.breed.trim() : (dto.breed === "" ? null : undefined);
    const cleanColor = typeof dto.color === "string" && dto.color.trim() !== "" ? dto.color.trim() : (dto.color === "" ? null : undefined);
    const cleanAvatar = typeof dto.avatar_url === "string" && dto.avatar_url.trim() !== "" ? dto.avatar_url.trim() : (dto.avatar_url === "" ? null : undefined);
    const cleanAllergies = typeof dto.allergies === "string" && dto.allergies.trim() !== "" ? dto.allergies.trim() : (dto.allergies === "" ? null : undefined);
    const cleanChronic = typeof dto.chronic_conditions === "string" && dto.chronic_conditions.trim() !== "" ? dto.chronic_conditions.trim() : (dto.chronic_conditions === "" ? null : undefined);

    const payload = {
      ...dto,
      name: dto.name ? dto.name.trim() : undefined,
      breed: cleanBreed,
      color: cleanColor,
      date_of_birth: cleanDob,
      microchip_id: cleanMicrochip,
      avatar_url: cleanAvatar,
      allergies: cleanAllergies,
      chronic_conditions: cleanChronic,
      special_notes: cleanNotes,
    };
    try {
      const res = await axiosClient.patch<any>(`/pets/${cleanId}`, payload);
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      return normalizePet(raw);
    } catch (err: any) {
      // If 403 Forbidden or 404 from /pets/:id (e.g. user is admin editing someone else's pet), try admin route
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        const adminRes = await axiosClient.put<any>(`/admin/pets/${cleanId}`, payload);
        const adminRaw = adminRes.data?.data !== undefined ? adminRes.data.data : adminRes.data;
        return normalizePet(adminRaw);
      }
      throw err;
    }
  },

  /** Alias: updatePet */
  async update(id: string | number, dto: UpdatePetDTO): Promise<Pet> {
    return petService.updatePet(id, dto);
  },

  /** Xóa thú cưng */
  async deletePet(id: string | number): Promise<void> {
    const cleanId = String(id ?? "").trim();
    if (USE_MOCK) {
      _mockPets = _mockPets.filter((p) => String(p.id) !== cleanId);
      return mockDelay(undefined);
    }
    try {
      await axiosClient.delete(`/pets/${cleanId}`);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        await axiosClient.delete(`/admin/pets/${cleanId}`);
        return;
      }
      throw err;
    }
  },

  /** Alias: deletePet (cho phép gọi petService.delete(id)) */
  async delete(id: string | number): Promise<void> {
    return petService.deletePet(id);
  },
};
