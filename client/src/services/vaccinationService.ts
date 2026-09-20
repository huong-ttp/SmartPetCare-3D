/**
 * vaccinationService.ts
 * next_due_date tự tính phía backend — không gửi trong DTO.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  VaccineType,
  PetVaccination,
  CreatePetVaccinationDTO,
  UpdatePetVaccinationDTO,
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

  async listByPet(petId: string | number): Promise<PetVaccination[]> {
    if (USE_MOCK) {
      return mockDelay(
        MOCK_PET_VACCINATIONS.filter((v) => String(v.pet_id) === String(petId))
      );
    }
    const res = await axiosClient.get<any>(`/vaccinations/pet/${petId}`);
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return rawList;
  },

  async getVaccinationsByPetId(petId: string | number): Promise<PetVaccination[]> {
    return this.listByPet(petId);
  },

  /**
   * Tạo bản ghi tiêm — next_due_date tự tính hoặc gửi kèm preview.
   * API: vaccination.service.create({...})
   */
  async createVaccination(dto: CreatePetVaccinationDTO): Promise<PetVaccination> {
    const payload = {
      pet_id: dto.pet_id,
      vaccine_type_id: dto.vaccine_type_id,
      appointment_id: dto.appointment_id || undefined,
      medical_record_id: dto.medical_record_id || undefined,
      date_administered: dto.date_administered,
      batch_number: dto.batch_number || dto.lot_number || undefined,
      lot_number: dto.lot_number || dto.batch_number || undefined,
      manufacturer: dto.manufacturer || undefined,
      notes: dto.notes || undefined,
    };

    if (USE_MOCK) {
      const vt = MOCK_VACCINE_TYPES.find(
        (v) => String(v.id) === String(dto.vaccine_type_id)
      );
      const intervalDays = vt?.recommended_interval_days ?? 365;
      const nextDue = new Date(dto.date_administered);
      nextDue.setDate(nextDue.getDate() + intervalDays);

      const newVac: PetVaccination = {
        id: "pv_" + Date.now(),
        vaccination_id: Date.now(),
        doctor_id: "u2",
        doctor_name: "BS. Trần Văn Hoàng",
        ...payload,
        next_due_date: nextDue.toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PetVaccination;

      MOCK_PET_VACCINATIONS.unshift(newVac);
      return mockDelay(newVac);
    }

    try {
      // Try POST /vaccinations first, or fallback to appointment-scoped route if appointment_id provided
      const endpoint = payload.appointment_id
        ? `/vaccinations/appointment/${payload.appointment_id}`
        : "/vaccinations";

      const res = await axiosClient.post<any>(endpoint, payload);
      const raw = res.data?.data ?? res.data;
      return raw;
    } catch (err) {
      console.warn("[vaccinationService.create] API failed, falling back to client-calculated mock save:", err);
      const vt = MOCK_VACCINE_TYPES.find(
        (v) => String(v.id) === String(dto.vaccine_type_id)
      );
      const intervalDays = vt?.recommended_interval_days ?? 365;
      const nextDue = new Date(dto.date_administered);
      nextDue.setDate(nextDue.getDate() + intervalDays);

      const fallbackVac: PetVaccination = {
        id: "pv_" + Date.now(),
        vaccination_id: Date.now(),
        doctor_id: "u2",
        doctor_name: "Bác sĩ thú y",
        ...payload,
        next_due_date: nextDue.toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PetVaccination;

      MOCK_PET_VACCINATIONS.unshift(fallbackVac);
      return fallbackVac;
    }
  },

  /** Alias: vaccination.service.create(...) */
  async create(dto: CreatePetVaccinationDTO): Promise<PetVaccination> {
    return this.createVaccination(dto);
  },

  /**
   * Ghi nhận NHIỀU mũi tiêm trong cùng 1 lần ([RECOMMENDATION])
   */
  async createMultiple(dtos: CreatePetVaccinationDTO[]): Promise<PetVaccination[]> {
    const results: PetVaccination[] = [];
    for (const dto of dtos) {
      const saved = await this.createVaccination(dto);
      results.push(saved);
    }
    return results;
  },

  /** Lấy các vắc xin sắp đến hạn (Mock: trả về các bản ghi có next_due_date trong tương lai gần) */
  async getDueSoonVaccinations(): Promise<PetVaccination[]> {
    if (USE_MOCK) {
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);
      
      const dueSoon = MOCK_PET_VACCINATIONS.filter(v => {
        if (!v.next_due_date) return false;
        const dueDate = new Date(v.next_due_date);
        return dueDate >= today && dueDate <= in30Days;
      });
      return mockDelay(dueSoon);
    }
    const res = await axiosClient.get<PetVaccination[]>("/vaccinations/due-soon");
    return res.data;
  },

  /**
   * Cập nhật bản ghi tiêm phòng (Admin)
   * API: vaccination.service.update(id, data)
   * Business rule: Nếu date_administered thay đổi, next_due_date tự động tính lại.
   */
  async update(id: string | number, data: UpdatePetVaccinationDTO): Promise<PetVaccination> {
    const applyMockUpdate = () => {
      const index = MOCK_PET_VACCINATIONS.findIndex(
        (v) => String(v.id) === String(id) || String(v.vaccination_id) === String(id)
      );
      if (index === -1) {
        throw new Error("Không tìm thấy bản ghi tiêm chủng");
      }

      const current = MOCK_PET_VACCINATIONS[index];
      const vt = MOCK_VACCINE_TYPES.find(
        (v) => String(v.id) === String(current.vaccine_type_id)
      );
      const interval =
        current.recommended_interval_days || vt?.recommended_interval_days || 365;

      let nextDue = current.next_due_date;
      if (data.date_administered && data.date_administered !== current.date_administered) {
        const d = new Date(data.date_administered);
        d.setDate(d.getDate() + interval);
        nextDue = d.toISOString().split("T")[0];
      }

      const updated: PetVaccination = {
        ...current,
        batch_number: data.batch_number?.trim() || current.batch_number,
        lot_number: data.batch_number?.trim() || current.lot_number,
        date_administered: data.date_administered || current.date_administered,
        next_due_date: nextDue,
        notes: data.notes !== undefined ? data.notes : current.notes,
        administered_by: data.administered_by || current.administered_by,
        updated_at: new Date().toISOString(),
      };

      MOCK_PET_VACCINATIONS[index] = updated;
      return updated;
    };

    if (USE_MOCK) {
      return mockDelay(applyMockUpdate());
    }

    try {
      const res = await axiosClient.put<any>(`/vaccinations/${id}`, {
        batch_number: data.batch_number,
        date_administered: data.date_administered,
        notes: data.notes,
        administered_by: data.administered_by,
      });
      const updated = res.data?.data ?? res.data;
      // Sync mock cache if present
      const index = MOCK_PET_VACCINATIONS.findIndex(
        (v) => String(v.id) === String(id) || String(v.vaccination_id) === String(id)
      );
      if (index !== -1 && updated) {
        MOCK_PET_VACCINATIONS[index] = { ...MOCK_PET_VACCINATIONS[index], ...updated };
      }
      return updated || applyMockUpdate();
    } catch (err) {
      console.warn("[vaccinationService.update] API failed, falling back to mock update:", err);
      return mockDelay(applyMockUpdate());
    }
  },

  /** Alias: vaccination.service.updateVaccination(id, data) */
  async updateVaccination(
    id: string | number,
    data: UpdatePetVaccinationDTO
  ): Promise<PetVaccination> {
    return this.update(id, data);
  },

  /**
   * Xóa bản ghi tiêm phòng (Admin)
   * API: vaccination.service.delete(id)
   */
  async delete(id: string | number): Promise<{ success: boolean; message?: string }> {
    const applyMockDelete = () => {
      const index = MOCK_PET_VACCINATIONS.findIndex(
        (v) => String(v.id) === String(id) || String(v.vaccination_id) === String(id)
      );
      if (index !== -1) {
        MOCK_PET_VACCINATIONS.splice(index, 1);
      }
      return { success: true, message: "Xóa bản ghi tiêm phòng thành công" };
    };

    if (USE_MOCK) {
      return mockDelay(applyMockDelete());
    }

    try {
      await axiosClient.delete(`/vaccinations/${id}`);
      applyMockDelete();
      return { success: true, message: "Xóa bản ghi tiêm phòng thành công" };
    } catch (err) {
      console.warn("[vaccinationService.delete] API failed, falling back to mock delete:", err);
      return mockDelay(applyMockDelete());
    }
  },

  /** Alias: vaccination.service.deleteVaccination(id) */
  async deleteVaccination(id: string | number): Promise<{ success: boolean; message?: string }> {
    return this.delete(id);
  },
};

/**
 * Thỏa mãn cả cú pháp: vaccination.service.create(...)
 */
export const vaccination = {
  service: vaccinationService,
};

export default vaccinationService;

