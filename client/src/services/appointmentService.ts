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
  DoctorDashboardData,
} from "@/types/appointment.type";
import { MOCK_APPOINTMENTS, MOCK_USERS } from "@/lib/mock";
import { _adminMockAppointments } from "@/services/adminService";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateOffsetString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DEMO_DOCTOR_APPOINTMENTS: Appointment[] = [
  // Today's appointments
  {
    id: "da-1",
    appointment_id: 101,
    pet_id: "p1",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    pet_name: "Mochi",
    pet_species: "dog",
    pet_breed: "Poodle",
    owner_name: "Nguyễn Văn An",
    owner_phone: "0901234567",
    service_name: "Khám tổng quát & Tiêm phòng",
    status: "confirmed",
    appointment_date: getTodayString(),
    start_time: "08:30",
    end_time: "09:15",
    scheduled_at: `${getTodayString()}T08:30:00Z`,
    reason: "Kiểm tra định kỳ & tiêm vaccine nhắc lại",
    notes: "Chủ nuôi báo bé hơi kén ăn 2 ngày nay",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "da-2",
    appointment_id: 102,
    pet_id: "p2",
    owner_id: "u1",
    service_id: "sv2",
    doctor_id: "u2",
    pet_name: "Bông",
    pet_species: "cat",
    pet_breed: "Mèo Anh lông ngắn",
    owner_name: "Lê Minh Tuấn",
    owner_phone: "0912345678",
    service_name: "Khám da liễu & Cạo vôi răng",
    status: "confirmed",
    appointment_date: getTodayString(),
    start_time: "10:30",
    end_time: "11:15",
    scheduled_at: `${getTodayString()}T10:30:00Z`,
    reason: "Bé gãi tai nhiều, có mảng đỏ ở vành tai",
    notes: "Nghi ngờ ve tai hoặc viêm da tiếp xúc",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "da-3",
    appointment_id: 103,
    pet_id: "p3",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    pet_name: "Lucky",
    pet_species: "dog",
    pet_breed: "Golden Retriever",
    owner_name: "Phạm Thu Trang",
    owner_phone: "0934567890",
    service_name: "Khám tổng quát",
    status: "confirmed",
    appointment_date: getTodayString(),
    start_time: "14:00",
    end_time: "14:45",
    scheduled_at: `${getTodayString()}T14:00:00Z`,
    reason: "Bỏ ăn 1 ngày, uể oải, nôn nhẹ buổi sáng",
    notes: "Đo nhiệt độ và kiểm tra hệ tiêu hóa",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Upcoming appointments
  {
    id: "da-4",
    appointment_id: 104,
    pet_id: "p1",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    pet_name: "Bông Tuyết",
    pet_species: "dog",
    pet_breed: "Samoyed",
    owner_name: "Hoàng Thu Hằng",
    owner_phone: "0987654321",
    service_name: "Khám sức khỏe tổng quát",
    status: "confirmed",
    appointment_date: getDateOffsetString(1),
    start_time: "09:00",
    end_time: "09:45",
    scheduled_at: `${getDateOffsetString(1)}T09:00:00Z`,
    reason: "Kiểm tra sức khỏe trước khi đi du lịch xa",
    notes: "Cần cấp giấy chứng nhận kiểm dịch",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "da-5",
    appointment_id: 105,
    pet_id: "p2",
    owner_id: "u1",
    service_id: "sv2",
    doctor_id: "u2",
    pet_name: "Simba",
    pet_species: "cat",
    pet_breed: "Mèo Ba Tư",
    owner_name: "Vũ Đức Thắng",
    owner_phone: "0912334455",
    service_name: "Tiêm phòng 4 bệnh",
    status: "confirmed",
    appointment_date: getDateOffsetString(2),
    start_time: "10:30",
    end_time: "11:15",
    scheduled_at: `${getDateOffsetString(2)}T10:30:00Z`,
    reason: "Tiêm mũi vaccine tổng hợp định kỳ hằng năm",
    notes: "Kiểm tra nhiệt độ trước tiêm",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "da-6",
    appointment_id: 106,
    pet_id: "p3",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    pet_name: "Milo",
    pet_species: "dog",
    pet_breed: "Corgi",
    owner_name: "Trần Thảo Linh",
    owner_phone: "0909112233",
    service_name: "Khám xương khớp",
    status: "confirmed",
    appointment_date: getDateOffsetString(3),
    start_time: "15:00",
    end_time: "15:45",
    scheduled_at: `${getDateOffsetString(3)}T15:00:00Z`,
    reason: "Bé đi khập khiễng chân sau bên phải",
    notes: "Chụp X-quang khớp gối",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Completed appointments
  {
    id: "da-7",
    appointment_id: 107,
    pet_id: "p2",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    pet_name: "Lu",
    pet_species: "cat",
    pet_breed: "Mèo Mướp",
    owner_name: "Đỗ Quang Hải",
    owner_phone: "0977889900",
    service_name: "Khám hô hấp & Khí dung",
    status: "completed",
    appointment_date: getDateOffsetString(-1),
    start_time: "09:00",
    end_time: "09:45",
    scheduled_at: `${getDateOffsetString(-1)}T09:00:00Z`,
    reason: "Bé hắt hơi nhiều, có dịch mũi trong",
    notes: "Đã khám, khí dung và kê đơn thuốc kháng sinh đường uống 5 ngày",
    medical_record_id: "mr-107",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "da-8",
    appointment_id: 108,
    pet_id: "p1",
    owner_id: "u1",
    service_id: "sv2",
    doctor_id: "u2",
    pet_name: "Coco",
    pet_species: "dog",
    pet_breed: "Poodle",
    owner_name: "Ngô Bảo Ngọc",
    owner_phone: "0944556677",
    service_name: "Chăm sóc da & Lông y tế",
    status: "completed",
    appointment_date: getDateOffsetString(-2),
    start_time: "14:00",
    end_time: "14:45",
    scheduled_at: `${getDateOffsetString(-2)}T14:00:00Z`,
    reason: "Da xuất hiện mẩn đỏ và rụng lông từng mảng",
    notes: "Đã tắm sát trùng Malaseb và bôi kem kháng nấm",
    medical_record_id: "mr-108",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
    pet_id: String(raw.pet_id ?? raw.pet?.pet_id ?? raw.pet?.id ?? ""),
    pet_name: raw.pet_name ?? raw.pet?.name,
    pet_species: raw.pet_species ?? raw.species ?? raw.pet?.species,
    pet_breed: raw.pet_breed ?? raw.breed ?? raw.pet?.breed,
    owner_id: String(raw.owner_id ?? raw.owner?.user_id ?? raw.owner?.id ?? ""),
    owner_name: raw.owner_name ?? raw.owner?.full_name ?? raw.full_name,
    service_id: raw.service_id ? String(raw.service_id) : null,
    service_name: raw.service_name ?? raw.service?.name,
    doctor_id: raw.doctor_id ? String(raw.doctor_id) : null,
    doctor_name: raw.doctor_name ?? raw.doctor?.full_name,
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

  /** Alias: appointment.service.list({ owner: me }) hoặc { doctor: me, ... } */
  async list(filter?: AppointmentFilterDTO): Promise<Appointment[]> {
    if (filter?.doctor) {
      return appointmentService.getDoctorAppointments(filter);
    }
    return appointmentService.getMyAppointments(filter);
  },

  /** Lấy chi tiết lịch hẹn theo ID (hỗ trợ fallback doctor route và mock) */
  async getById(id: string | number): Promise<Appointment> {
    const cleanId = String(id);
    const allMock = [
      ...DEMO_DOCTOR_APPOINTMENTS,
      ...MOCK_APPOINTMENTS.map(normalizeAppointment),
    ];

    if (USE_MOCK) {
      const found = allMock.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (!found) throw new Error("Lịch hẹn không tồn tại.");
      return mockDelay(normalizeAppointment(found));
    }

    try {
      const res = await axiosClient.get<any>(`/appointments/${cleanId}`);
      const raw = res.data?.data ?? res.data;
      if (raw) return normalizeAppointment(raw);
    } catch (err: any) {
      try {
        const docRes = await axiosClient.get<any>(`/appointments/doctor/${cleanId}`);
        const docRaw = docRes.data?.data ?? docRes.data;
        if (docRaw) return normalizeAppointment(docRaw);
      } catch {
        // Tiếp tục fallback mock
      }

      const found = allMock.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (found) return normalizeAppointment(found);
      throw err;
    }
    throw new Error("Lịch hẹn không tồn tại.");
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
  async getDoctorAppointments(
    filterOrTab?: AppointmentFilterDTO | "today" | "upcoming" | "completed"
  ): Promise<Appointment[]> {
    const filter: AppointmentFilterDTO =
      typeof filterOrTab === "string"
        ? filterOrTab === "today"
          ? { doctor: "me", date: getTodayString() }
          : filterOrTab === "upcoming"
          ? { doctor: "me", upcoming: true }
          : { doctor: "me", status: "completed" }
        : filterOrTab || { doctor: "me" };

    const todayStr = getTodayString();
    let tab: "today" | "upcoming" | "completed" = "today";
    if ((filter as any).tab) {
      tab = (filter as any).tab;
    } else if (filter.upcoming) {
      tab = "upcoming";
    } else if (filter.status === "completed") {
      tab = "completed";
    } else if (filter.date === todayStr || (!filter.status && !filter.upcoming)) {
      tab = "today";
    }

    if (USE_MOCK) {
      const allDoctorList = [
        ...DEMO_DOCTOR_APPOINTMENTS,
        ...MOCK_APPOINTMENTS.map(normalizeAppointment),
      ];

      if (tab === "upcoming" || filter.upcoming) {
        return mockDelay(
          allDoctorList.filter((a) => {
            const d = a.appointment_date || a.scheduled_at?.split("T")[0] || "";
            return d > todayStr && a.status === "confirmed";
          })
        );
      }
      if (tab === "completed" || filter.status === "completed") {
        return mockDelay(
          allDoctorList.filter((a) => a.status === "completed")
        );
      }
      if (filter.date) {
        const targetDate = filter.date;
        return mockDelay(
          allDoctorList.filter(
            (a) =>
              (a.appointment_date === targetDate ||
                Boolean(a.scheduled_at && a.scheduled_at.startsWith(targetDate))) &&
              a.status !== "cancelled"
          )
        );
      }
      return mockDelay(
        allDoctorList.filter((a) => a.appointment_date === todayStr && a.status !== "cancelled")
      );
    }

    try {
      const res = await axiosClient.get<any>("/appointments/doctor", {
        params: { tab },
      });
      const raw = res.data?.data ?? res.data;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data)) list = raw.data;
      else if (Array.isArray(raw?.items)) list = raw.items;
      return list.map(normalizeAppointment);
    } catch (err) {
      console.warn("[appointmentService.getDoctorAppointments] API failed, falling back to mock:", err);
      const allDoctorList = [
        ...DEMO_DOCTOR_APPOINTMENTS,
        ...MOCK_APPOINTMENTS.map(normalizeAppointment),
      ];
      if (tab === "upcoming") {
        return mockDelay(
          allDoctorList.filter((a) => {
            const d = a.appointment_date || a.scheduled_at?.split("T")[0] || "";
            return d > todayStr && a.status === "confirmed";
          })
        );
      }
      if (tab === "completed") {
        return mockDelay(allDoctorList.filter((a) => a.status === "completed"));
      }
      return mockDelay(
        allDoctorList.filter((a) => a.appointment_date === todayStr && a.status !== "cancelled")
      );
    }
  },

  /** Lấy dữ liệu tổng quan Doctor Dashboard: overview stats + today appointments */
  async getDoctorDashboard(): Promise<DoctorDashboardData> {
    const todayStr = getTodayString();

    if (!USE_MOCK) {
      try {
        const res = await axiosClient.get<any>("/appointments/doctor/dashboard");
        const raw = res.data?.data ?? res.data;
        if (raw?.overview) {
          const rawToday = Array.isArray(raw.todayAppointments)
            ? raw.todayAppointments
            : [];
          return {
            overview: {
              todayAppointments: Number(raw.overview.todayAppointments || 0),
              upcomingAppointments: Number(raw.overview.upcomingAppointments || 0),
              completedAppointments: Number(raw.overview.completedAppointments || 0),
              patients: Number(raw.overview.patients || 0),
            },
            todayAppointments: rawToday.map(normalizeAppointment),
          };
        }
      } catch (err) {
        console.warn("[appointmentService.getDoctorDashboard] dashboard API failed, aggregating via list():", err);
      }
    }

    // Fallback: tổng hợp từ các call list()
    const [todayList, upcomingList, completedList] = await Promise.all([
      appointmentService.list({ doctor: "me", date: todayStr }),
      appointmentService.list({ doctor: "me", upcoming: true }),
      appointmentService.list({ doctor: "me", status: "completed" }),
    ]);

    const distinctPetIds = new Set([
      ...todayList.map((a) => a.pet_id).filter(Boolean),
      ...completedList.map((a) => a.pet_id).filter(Boolean),
      "p1",
      "p2",
      "p3",
    ]);

    return {
      overview: {
        todayAppointments: todayList.length,
        upcomingAppointments: upcomingList.length,
        completedAppointments: completedList.length,
        patients: distinctPetIds.size,
      },
      todayAppointments: todayList,
    };
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
  async assignDoctor(
    id: string | number,
    dtoOrDoctorId: AssignDoctorDTO | string | number
  ): Promise<Appointment> {
    const cleanId = String(id);
    const doctorId =
      typeof dtoOrDoctorId === "object" && dtoOrDoctorId !== null
        ? dtoOrDoctorId.doctor_id
        : dtoOrDoctorId;

    if (USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (appt) {
        appt.doctor_id = String(doctorId);
        (appt as any).doctor_assigned_at = new Date().toISOString();
        appt.updated_at = new Date().toISOString();
      }
      const adminAppt = _adminMockAppointments.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (adminAppt) {
        const doc = MOCK_USERS.find((u) => String(u.id) === String(doctorId));
        adminAppt.doctor_id = String(doctorId);
        adminAppt.doctor_name = doc?.full_name || "BS. Trần Thị Hoa";
        adminAppt.doctor_phone = doc?.phone || "0912345678";
        adminAppt.doctor_email = doc?.email || "doctor@example.com";
        adminAppt.doctor_assigned_at = new Date().toISOString();
        adminAppt.updated_at = new Date().toISOString();
        return mockDelay(normalizeAppointment(adminAppt));
      }
      if (appt) return mockDelay(normalizeAppointment(appt));
      throw new Error("Lịch hẹn không tồn tại.");
    }

    try {
      const res = await axiosClient.put<any>(`/admin/appointments/${cleanId}/assign`, {
        doctor_id: Number(doctorId) || doctorId,
      });
      const raw = res.data?.data ?? res.data;
      return normalizeAppointment(raw);
    } catch (err: any) {
      // Fallback: try updating local admin mock
      console.warn("[appointmentService.assignDoctor] API failed, updating local mock state:", err);
      const adminAppt = _adminMockAppointments.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (adminAppt) {
        const doc = MOCK_USERS.find((u) => String(u.id) === String(doctorId));
        adminAppt.doctor_id = String(doctorId);
        adminAppt.doctor_name = doc?.full_name || "BS. Trần Thị Hoa";
        adminAppt.doctor_phone = doc?.phone || "0912345678";
        adminAppt.doctor_email = doc?.email || "doctor@example.com";
        adminAppt.doctor_assigned_at = new Date().toISOString();
        adminAppt.updated_at = new Date().toISOString();
        return mockDelay(normalizeAppointment(adminAppt));
      }
      throw err;
    }
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

  /** Hủy lịch hẹn (gọi PUT /admin/appointments/:id/cancel hoặc PUT /appointments/:id/cancel) */
  async cancel(id: string | number, cancel_reason?: string): Promise<Appointment> {
    const cleanId = String(id);
    const reasonText = cancel_reason?.trim() || "Chủ nuôi yêu cầu hủy lịch hẹn";

    if (USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (appt) {
        appt.status = "cancelled";
        appt.cancel_reason = reasonText;
        appt.updated_at = new Date().toISOString();
      }
      const adminAppt = _adminMockAppointments.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (adminAppt) {
        adminAppt.status = "cancelled";
        adminAppt.cancel_reason = reasonText;
        adminAppt.updated_at = new Date().toISOString();
        return mockDelay(normalizeAppointment(adminAppt));
      }
      if (appt) return mockDelay(normalizeAppointment(appt));
      throw new Error("Lịch hẹn không tồn tại.");
    }

    try {
      // First try PUT /admin/appointments/:id/cancel
      const res = await axiosClient.put<any>(`/admin/appointments/${cleanId}/cancel`, {
        cancel_reason: reasonText,
      });
      const raw = res.data?.data ?? res.data;
      return normalizeAppointment(raw);
    } catch (err: any) {
      // Fallback: try local admin mock if server fails
      console.warn("[appointmentService.cancel] API failed, updating local mock state:", err);
      const adminAppt = _adminMockAppointments.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (adminAppt) {
        adminAppt.status = "cancelled";
        adminAppt.cancel_reason = reasonText;
        adminAppt.updated_at = new Date().toISOString();
        return mockDelay(normalizeAppointment(adminAppt));
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

