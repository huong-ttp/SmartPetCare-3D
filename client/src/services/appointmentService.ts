/**
 * appointmentService.ts
 * Đặt lịch hẹn: owner tạo (không chọn doctor), admin gán doctor sau.
 * Status: confirmed | completed | cancelled ONLY.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  Appointment,
  CreateAppointmentDTO,
  AvailableSlot,
  AppointmentFilterDTO,
  AssignDoctorDTO,
  UpdateAppointmentStatusDTO,
} from "@/types/appointment.type";
import { MOCK_APPOINTMENTS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

const DEFAULT_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30"
];

function normalizeAppointment(raw: any): Appointment {
  if (!raw) return raw;
  const id = String(raw.id ?? raw.appointment_id ?? "");
  return {
    ...raw,
    id,
    appointment_id: raw.appointment_id ?? id,
    pet_id: String(raw.pet_id ?? ""),
    service_id: raw.service_id ? String(raw.service_id) : null,
    doctor_id: raw.doctor_id ? String(raw.doctor_id) : null,
    status: raw.status ?? "confirmed",
    appointment_date: raw.appointment_date ? String(raw.appointment_date).split("T")[0] : undefined,
    start_time: raw.start_time ? String(raw.start_time).slice(0, 5) : undefined,
    end_time: raw.end_time ? String(raw.end_time).slice(0, 5) : undefined,
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? new Date().toISOString(),
  };
}

export const appointmentService = {
  /** Lấy tất cả lịch hẹn của owner hiện tại (hỗ trợ filter status, from, to) */
  async getMyAppointments(filter?: AppointmentFilterDTO): Promise<Appointment[]> {
    if (USE_MOCK) {
      let list = MOCK_APPOINTMENTS.map(normalizeAppointment);
      if (filter?.status && filter.status !== "all") {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter?.from) {
        list = list.filter((a) => (a.appointment_date || a.scheduled_at || "") >= filter.from!);
      }
      if (filter?.to) {
        list = list.filter((a) => (a.appointment_date || a.scheduled_at || "") <= filter.to!);
      }
      return mockDelay(list);
    }

    try {
      const params: any = {};
      if (filter?.status && filter.status !== "all") params.status = filter.status;
      if (filter?.from) params.from = filter.from;
      if (filter?.to) params.to = filter.to;

      const res = await axiosClient.get<any>("/appointments", { params });
      const raw = res.data;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data)) list = raw.data;
      else if (Array.isArray(raw?.items)) list = raw.items;
      return list.map(normalizeAppointment);
    } catch (err) {
      console.warn("[appointmentService.getMyAppointments] fallback to mock:", err);
      return mockDelay(MOCK_APPOINTMENTS.map(normalizeAppointment));
    }
  },

  /** Alias: appointment.service.list({ owner: me }) */
  async list(filter?: AppointmentFilterDTO): Promise<Appointment[]> {
    return appointmentService.getMyAppointments(filter);
  },

  /** Lấy chi tiết lịch hẹn theo ID */
  async getById(id: string | number): Promise<Appointment> {
    const cleanId = String(id);
    if (USE_MOCK) {
      const found = MOCK_APPOINTMENTS.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (!found) throw new Error("Lịch hẹn không tồn tại.");
      return mockDelay(normalizeAppointment(found));
    }

    const res = await axiosClient.get<any>(`/appointments/${cleanId}`);
    const raw = res.data?.data ?? res.data;
    if (!raw) throw new Error("Lịch hẹn không tồn tại.");
    return normalizeAppointment(raw);
  },

  /** Alias: getAppointmentById */
  async getAppointmentById(id: string | number): Promise<Appointment> {
    return appointmentService.getById(id);
  },

  /** Lấy danh sách khung giờ khả dụng theo ngày và pet */
  async getAvailableSlots(petId: string | number, date: string): Promise<AvailableSlot[]> {
    if (USE_MOCK) {
      const bookedTimes = MOCK_APPOINTMENTS
        .filter((a) => String(a.pet_id) === String(petId) && a.status !== "cancelled")
        .map((a) => {
          if (a.scheduled_at) {
            const time = new Date(a.scheduled_at).toTimeString().slice(0, 5);
            return time;
          }
          return "";
        });

      return mockDelay(
        DEFAULT_SLOTS.map((slot) => ({
          time: slot,
          available: !bookedTimes.includes(slot),
        }))
      );
    }

    try {
      const res = await axiosClient.get<any>("/appointments/available-slots", {
        params: {
          pet_id: Number(petId) || petId,
          date,
        },
      });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        return data;
      }
      return DEFAULT_SLOTS.map((slot) => ({ time: slot, available: true }));
    } catch (err) {
      console.warn("[appointmentService.getAvailableSlots] failed, returning default slots:", err);
      return DEFAULT_SLOTS.map((slot) => ({ time: slot, available: true }));
    }
  },

  /** Lấy tất cả lịch hẹn (admin/doctor view) */
  async getAllAppointments(): Promise<Appointment[]> {
    if (USE_MOCK) return mockDelay(MOCK_APPOINTMENTS);
    const res = await axiosClient.get<Appointment[]>("/admin/appointments");
    return res.data;
  },

  /** Lịch hẹn của doctor hiện tại */
  async getDoctorAppointments(): Promise<Appointment[]> {
    if (USE_MOCK) return mockDelay(MOCK_APPOINTMENTS.filter((a) => a.doctor_id === "u2"));
    const res = await axiosClient.get<Appointment[]>("/doctor/appointments");
    return res.data;
  },

  /** Owner tạo lịch — doctor_id = null (admin gán sau) */
  async createAppointment(dto: CreateAppointmentDTO): Promise<Appointment> {
    const payload = {
      pet_id: Number(dto.pet_id) || dto.pet_id,
      service_id: dto.service_id ? (Number(dto.service_id) || dto.service_id) : null,
      appointment_date: dto.appointment_date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      reason: dto.reason?.trim() || null,
      notes: dto.notes?.trim() || null,
    };

    if (USE_MOCK) {
      const newAppt: Appointment = {
        id: "a_" + Date.now(),
        owner_id: "u1",
        doctor_id: null,
        status: "confirmed",
        pet_id: String(payload.pet_id),
        service_id: payload.service_id ? String(payload.service_id) : null,
        appointment_date: payload.appointment_date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        reason: payload.reason ?? undefined,
        notes: payload.notes ?? undefined,
        scheduled_at: `${payload.appointment_date}T${payload.start_time}:00Z`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_APPOINTMENTS.push(newAppt);
      return mockDelay(newAppt);
    }

    const res = await axiosClient.post<any>("/appointments", payload);
    const raw = res.data?.data ?? res.data;
    return normalizeAppointment(raw);
  },

  /** Alias: appointment.service.create(...) */
  async create(dto: CreateAppointmentDTO): Promise<Appointment> {
    return appointmentService.createAppointment(dto);
  },

  /** Admin gán bác sĩ cho lịch hẹn */
  async assignDoctor(id: string, dto: AssignDoctorDTO): Promise<Appointment> {
    if (USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find((a) => a.id === id);
      if (!appt) throw new Error("Lịch hẹn không tồn tại.");
      return mockDelay({ ...appt, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<Appointment>(`/admin/appointments/${id}/assign`, dto);
    return res.data;
  },

  /** Cập nhật trạng thái lịch hẹn (chỉ admin/doctor) */
  async updateStatus(id: string, dto: UpdateAppointmentStatusDTO): Promise<Appointment> {
    if (USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find((a) => a.id === id);
      if (!appt) throw new Error("Lịch hẹn không tồn tại.");
      return mockDelay({ ...appt, ...dto, updated_at: new Date().toISOString() });
    }
    const res = await axiosClient.patch<Appointment>(`/appointments/${id}/status`, dto);
    return res.data;
  },

  /** Owner huỷ lịch hẹn (gọi PUT /appointments/:id/cancel) */
  async cancel(id: string | number, cancel_reason?: string): Promise<Appointment> {
    const cleanId = String(id);
    const reasonText = cancel_reason?.trim() || "Chủ nuôi yêu cầu hủy lịch hẹn";

    if (USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (!appt) throw new Error("Lịch hẹn không tồn tại.");
      appt.status = "cancelled";
      appt.cancel_reason = reasonText;
      appt.updated_at = new Date().toISOString();
      return mockDelay(normalizeAppointment(appt));
    }

    try {
      const res = await axiosClient.put<any>(`/appointments/${cleanId}/cancel`, {
        cancel_reason: reasonText,
      });
      const raw = res.data?.data ?? res.data;
      return normalizeAppointment(raw);
    } catch (err: any) {
      // Fallback: nếu route PUT /cancel lỗi hoặc server dùng PATCH /status
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const patchRes = await axiosClient.patch<any>(`/appointments/${cleanId}/status`, {
          status: "cancelled",
        });
        const raw = patchRes.data?.data ?? patchRes.data;
        return normalizeAppointment(raw);
      }
      throw err;
    }
  },

  /** Alias: cancelAppointment */
  async cancelAppointment(id: string | number, cancel_reason?: string): Promise<Appointment> {
    return appointmentService.cancel(id, cancel_reason);
  },
};

/**
 * Thỏa mãn cả cú pháp: appointment.service.create(...)
 */
export const appointment = {
  service: appointmentService,
};

export default appointmentService;

