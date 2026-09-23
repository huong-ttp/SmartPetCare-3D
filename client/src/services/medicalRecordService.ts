/**
 * medicalRecordService.ts
 * Hồ sơ bệnh án — doctor tạo sau khi khám xong.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  MedicalRecord,
  CreateMedicalRecordDTO,
  UpdateMedicalRecordDTO,
  DoctorPatient,
} from "@/types/medical-record.type";
import { MOCK_MEDICAL_RECORDS, MOCK_APPOINTMENTS, MOCK_PETS, MOCK_USERS } from "@/lib/mock";
import { DEMO_DOCTOR_APPOINTMENTS } from "@/services/appointmentService";

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
    const cleanId = String(id);
    const findInMock = () => {
      const r = MOCK_MEDICAL_RECORDS.find(
        (r) => String(r.id) === cleanId || String(r.record_id) === cleanId
      );
      if (!r) throw new Error("Hồ sơ không tồn tại.");
      return r;
    };

    if (USE_MOCK || isNaN(Number(cleanId))) {
      return mockDelay(findInMock());
    }

    try {
      const res = await axiosClient.get<any>(`/medical-records/${cleanId}`);
      const data = res.data?.data ?? res.data;
      if (!data) throw new Error("Hồ sơ không tồn tại.");
      return data;
    } catch (err) {
      console.warn("[medicalRecordService.getById] API call failed, falling back to mock:", err);
      try {
        return mockDelay(findInMock());
      } catch {
        throw err;
      }
    }
  },

  async create(dto: CreateMedicalRecordDTO): Promise<any> {
    if (USE_MOCK) {
      const newRecId = "mr_" + Date.now();
      const numRecId = Date.now();
      const newRec = {
        id: newRecId,
        record_id: numRecId,
        doctor_id: "u2",
        doctor_name: "BS. Trần Văn Hoàng",
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as MedicalRecord;
      MOCK_MEDICAL_RECORDS.unshift(newRec);

      // Cập nhật appointment status thành completed
      if (dto.appointment_id) {
        const cleanApptId = String(dto.appointment_id);
        const allAppts = [...DEMO_DOCTOR_APPOINTMENTS, ...MOCK_APPOINTMENTS];
        const appt = allAppts.find(
          (a) => String(a.id) === cleanApptId || String(a.appointment_id) === cleanApptId
        );
        if (appt) {
          appt.status = "completed";
          appt.medical_record_id = newRec.id;
          appt.updated_at = new Date().toISOString();
        }
      }

      // Cập nhật cân nặng Pet cache nếu có weight_at_visit
      if (dto.pet_id && dto.weight_at_visit) {
        const pet = MOCK_PETS.find((p) => String(p.id) === String(dto.pet_id));
        if (pet) {
          (pet as any).weight_kg = Number(dto.weight_at_visit);
        }
      }

      // Mock tự động sinh invoice
      const mockInvoice = {
        invoice_id: "inv_" + Date.now(),
        appointment_id: dto.appointment_id,
        status: "unpaid",
        total_amount: 250000,
        issued_date: new Date().toISOString().split("T")[0],
      };

      return mockDelay({
        medical_record: newRec,
        invoice: mockInvoice,
        ...newRec,
        message: "Medical record created successfully. Invoice generated automatically.",
      });
    }

    if (dto.appointment_id) {
      try {
        const res = await axiosClient.post<any>(
          `/medical-records/appointment/${dto.appointment_id}`,
          dto
        );
        const responseData = res.data?.data ?? res.data;
        return responseData;
      } catch (err: any) {
        // Fallback to standard POST /medical-records if appointment endpoint is unavailable
        const res = await axiosClient.post<any>("/medical-records", dto);
        return res.data?.data ?? res.data;
      }
    }

    const res = await axiosClient.post<any>("/medical-records", dto);
    return res.data?.data ?? res.data;
  },

  async update(id: string | number, dto: UpdateMedicalRecordDTO): Promise<MedicalRecord> {
    const cleanId = String(id);
    const updateInMock = () => {
      const idx = MOCK_MEDICAL_RECORDS.findIndex(
        (r) => String(r.id) === cleanId || String(r.record_id) === cleanId
      );
      if (idx === -1) throw new Error("Hồ sơ không tồn tại.");
      const updated = {
        ...MOCK_MEDICAL_RECORDS[idx],
        ...dto,
        updated_at: new Date().toISOString(),
      };
      MOCK_MEDICAL_RECORDS[idx] = updated;
      return updated;
    };

    if (USE_MOCK || isNaN(Number(cleanId))) {
      return mockDelay(updateInMock());
    }

    try {
      const res = await axiosClient.put<any>(`/medical-records/${cleanId}`, dto);
      return res.data?.data ?? res.data;
    } catch {
      try {
        const res = await axiosClient.patch<any>(`/medical-records/${cleanId}`, dto);
        return res.data?.data ?? res.data;
      } catch (err) {
        console.warn("[medicalRecordService.update] API error, falling back to mock:", err);
        return mockDelay(updateInMock());
      }
    }
  },

  async delete(id: string | number): Promise<{ message: string }> {
    const cleanId = String(id);
    const deleteInMock = () => {
      const idx = MOCK_MEDICAL_RECORDS.findIndex(
        (r) => String(r.id) === cleanId || String(r.record_id) === cleanId
      );
      if (idx === -1) throw new Error("Hồ sơ y tế không tồn tại.");
      const record = MOCK_MEDICAL_RECORDS[idx];

      // Ràng buộc nghiệp vụ: kiểm tra tiêm chủng liên kết
      if (record.vaccinations && record.vaccinations.length > 0) {
        throw new Error(
          "Không thể xóa hồ sơ bệnh án vì đã có dữ liệu tiêm chủng (Pet Vaccinations) liên kết."
        );
      }

      MOCK_MEDICAL_RECORDS.splice(idx, 1);
      return { message: "Xóa hồ sơ bệnh án thành công." };
    };

    if (USE_MOCK || isNaN(Number(cleanId))) {
      return mockDelay(deleteInMock());
    }

    try {
      const res = await axiosClient.delete<any>(`/medical-records/${cleanId}`);
      return res.data?.data ?? res.data;
    } catch (err) {
      console.warn("[medicalRecordService.delete] API error, falling back to mock:", err);
      return mockDelay(deleteInMock());
    }
  },

  /**
   * listPatientsByDoctor
   * Lấy danh sách thú cưng distinct mà bác sĩ đã từng có Medical Record hoặc Appointment completed.
   */
  async listPatientsByDoctor(
    doctorId?: string | number,
    search?: string
  ): Promise<DoctorPatient[]> {
    if (USE_MOCK) {
      const currentDocId = String(doctorId || "u2");
      const matchedPetIds = new Set<string>();

      MOCK_MEDICAL_RECORDS.forEach((mr) => {
        if (!mr.doctor_id || String(mr.doctor_id) === currentDocId) {
          matchedPetIds.add(String(mr.pet_id));
        }
      });

      MOCK_APPOINTMENTS.forEach((appt) => {
        if (
          (!appt.doctor_id || String(appt.doctor_id) === currentDocId) &&
          appt.status === "completed"
        ) {
          matchedPetIds.add(String(appt.pet_id));
        }
      });

      // Default mock fallback: if doctor has no records yet, ensure demo pets
      if (matchedPetIds.size === 0) {
        matchedPetIds.add("p1");
        matchedPetIds.add("p2");
      }

      const patients: DoctorPatient[] = Array.from(matchedPetIds).map((pId) => {
        const pet = MOCK_PETS.find((p) => String(p.id) === pId) || {
          id: pId,
          name: "Bé cưng #" + pId,
          species: "dog" as const,
          breed: "Poodle",
          gender: "male" as const,
          owner_id: "u1",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        };
        const owner = MOCK_USERS.find((u) => String(u.id) === String(pet.owner_id)) || {
          full_name: "Nguyễn Văn An",
          phone: "0901234567",
          email: "owner@example.com",
        };

        const records = MOCK_MEDICAL_RECORDS.filter((mr) => String(mr.pet_id) === pId);
        const appts = MOCK_APPOINTMENTS.filter(
          (a) => String(a.pet_id) === pId && a.status === "completed"
        );
        const lastRec = records[0];

        return {
          pet_id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          gender: pet.gender,
          avatar_url: pet.avatar_url,
          date_of_birth: pet.date_of_birth,
          weight_kg: pet.weight_kg,
          owner_id: pet.owner_id,
          owner_name: owner.full_name,
          owner_phone: owner.phone,
          owner_email: owner.email,
          total_records: records.length || 1,
          total_appointments: appts.length || 1,
          last_visit_date: lastRec?.record_date ? lastRec.record_date.slice(0, 10) : "2025-07-10",
        };
      });

      let result = patients;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.owner_name.toLowerCase().includes(q) ||
            (p.breed && p.breed.toLowerCase().includes(q))
        );
      }
      return mockDelay(result);
    }

    try {
      const params: Record<string, string> = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const res = await axiosClient.get<any>("/medical-records/doctor/patients", { params });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return raw.map((item: any) => ({
        ...item,
        pet_id: item.pet_id ?? item.id,
        name: item.name ?? item.pet_name,
        species: item.species ?? item.pet_species ?? "dog",
        breed: item.breed ?? item.pet_breed,
        gender: item.gender ?? item.pet_gender,
        avatar_url: item.avatar_url,
        date_of_birth: item.date_of_birth ?? item.dob,
        weight_kg: item.weight_kg ? Number(item.weight_kg) : undefined,
        owner_id: item.owner_id,
        owner_name: item.owner_name ?? "Chủ nuôi",
        owner_phone: item.owner_phone,
        owner_email: item.owner_email,
        total_records: item.total_records ? Number(item.total_records) : 0,
        total_appointments: item.total_appointments ? Number(item.total_appointments) : 0,
        last_visit_date: item.last_visit_date,
      }));
    } catch (err: any) {
      console.warn("[medicalRecordService.listPatientsByDoctor] API error, using mock fallback:", err);
      const fallbackList: DoctorPatient[] = MOCK_PETS.map((pet) => {
        const owner = MOCK_USERS.find((u) => String(u.id) === String(pet.owner_id)) || {
          full_name: "Nguyễn Văn An",
          phone: "0901234567",
          email: "owner@example.com",
        };
        return {
          pet_id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          gender: pet.gender,
          avatar_url: pet.avatar_url,
          date_of_birth: pet.date_of_birth,
          weight_kg: pet.weight_kg,
          owner_id: pet.owner_id,
          owner_name: owner.full_name,
          owner_phone: owner.phone,
          owner_email: owner.email,
          total_records: 1,
          total_appointments: 1,
          last_visit_date: "2025-07-10",
        };
      });

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        return fallbackList.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.owner_name.toLowerCase().includes(q)
        );
      }
      return fallbackList;
    }
  },

  /**
   * listByDoctor
   * Lấy toàn bộ danh sách bệnh án do bác sĩ phụ trách.
   * Kết hợp dữ liệu bệnh nhân & bệnh án từng pet, tự động fallback sang mock khi ngắt kết nối.
   */
  async listByDoctor(doctorId?: string | number): Promise<MedicalRecord[]> {
    const currentDocId = String(doctorId || "u2");

    const getMockDoctorRecords = (): MedicalRecord[] => {
      let list = MOCK_MEDICAL_RECORDS.filter(
        (r) => !r.doctor_id || String(r.doctor_id) === currentDocId
      );
      if (list.length === 0) {
        list = [...MOCK_MEDICAL_RECORDS];
      }
      return list;
    };

    if (USE_MOCK) {
      return mockDelay(getMockDoctorRecords());
    }

    try {
      // 1. Lấy danh sách bệnh nhân của bác sĩ
      const patients = await this.listPatientsByDoctor(doctorId);

      if (!patients || patients.length === 0) {
        return getMockDoctorRecords();
      }

      // 2. Tải danh sách bệnh án của từng thú cưng song song
      const results = await Promise.allSettled(
        patients.map((p) => this.listByPet(p.pet_id))
      );

      const allRecords: MedicalRecord[] = [];
      const seenIds = new Set<string>();

      results.forEach((res, idx) => {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          const patient = patients[idx];
          res.value.forEach((rec) => {
            const key = String(rec.id || rec.record_id);
            if (!seenIds.has(key)) {
              seenIds.add(key);
              allRecords.push({
                ...rec,
                id: rec.id || String(rec.record_id),
                pet_name: rec.pet_name || patient.name,
                pet_species: rec.pet_species || patient.species,
                pet_breed: rec.pet_breed || patient.breed,
                pet_avatar_url: rec.pet_avatar_url || patient.avatar_url,
                owner_name: rec.owner_name || patient.owner_name,
                owner_phone: rec.owner_phone || patient.owner_phone,
                owner_email: rec.owner_email || patient.owner_email,
              });
            }
          });
        }
      });

      if (allRecords.length === 0) {
        return getMockDoctorRecords();
      }

      // Sắp xếp ngày khám mới nhất lên đầu
      allRecords.sort((a, b) => {
        const dateA = new Date(a.record_date || a.created_at || "").getTime();
        const dateB = new Date(b.record_date || b.created_at || "").getTime();
        return dateB - dateA;
      });

      return allRecords;
    } catch (err) {
      console.warn("[medicalRecordService.listByDoctor] Failed, falling back to mock:", err);
      return mockDelay(getMockDoctorRecords());
    }
  },
};

export const medicalRecord = {
  service: medicalRecordService,
};

export default medicalRecordService;
