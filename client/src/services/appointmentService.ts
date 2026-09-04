/**
 * appointmentService.ts
 * Đặt lịch hẹn: owner tạo (không chọn doctor), admin gán doctor sau.
 * Status: confirmed | completed | cancelled ONLY.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  Appointment,
  CreateAppointmentDTO,
  AssignDoctorDTO,
  UpdateAppointmentStatusDTO,
} from "@/types/appointment.type";
import { MOCK_APPOINTMENTS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const appointmentService = {
  /** Lấy tất cả lịch hẹn của owner hiện tại */
  async getMyAppointments(): Promise<Appointment[]> {
    if (USE_MOCK) return mockDelay(MOCK_APPOINTMENTS);
    const res = await axiosClient.get<Appointment[]>("/appointments");
    return res.data;
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
    if (USE_MOCK) {
      const newAppt: Appointment = {
        id: "a_" + Date.now(),
        owner_id: "u1",
        doctor_id: null,
        status: "confirmed",
        ...dto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockDelay(newAppt);
    }
    const res = await axiosClient.post<Appointment>("/appointments", dto);
    return res.data;
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

  /** Owner huỷ lịch hẹn */
  async cancelAppointment(id: string): Promise<Appointment> {
    return appointmentService.updateStatus(id, { status: "cancelled" });
  },
};
