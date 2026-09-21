/**
 * adminService.ts — Admin: quản lý user, thống kê
 */
import axiosClient from "@/lib/axiosClient";
import type {
  User,
  UserRole,
  UserFilterParams,
  UserListResult,
  CreateAdminUserDTO,
  UpdateAdminUserDTO,
} from "@/types/user.type";
import type {
  Pet,
  PetFilterParams,
  PetListResult,
  UpdatePetDTO,
} from "@/types/pet.type";
import type {
  Appointment,
  AdminAppointmentFilterParams,
  AdminAppointmentListResult,
} from "@/types/appointment.type";
import type {
  MedicalRecord,
  AdminMedicalRecordFilterParams,
  AdminMedicalRecordListResult,
} from "@/types/medical-record.type";
import type {
  PetVaccination,
  AdminVaccinationFilterParams,
  AdminVaccinationListResult,
} from "@/types/vaccination.type";
import type {
  Invoice,
  AdminInvoiceFilterParams,
  AdminInvoiceListResponse,
} from "@/types/invoice.type";
import type {
  Payment,
  AdminPaymentFilterParams,
  AdminPaymentListResult,
} from "@/types/payment.type";
import type {
  AdminNotificationItem,
  AdminNotificationFilterParams,
  AdminNotificationListResult,
  SendSystemNotificationDTO,
} from "@/types/notification.type";
import {
  MOCK_USERS,
  MOCK_PETS,
  MOCK_APPOINTMENTS,
  MOCK_MEDICAL_RECORDS,
  MOCK_PET_VACCINATIONS,
  MOCK_VACCINE_TYPES,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_NOTIFICATIONS,
} from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export let _adminMockNotifications: AdminNotificationItem[] = MOCK_NOTIFICATIONS.map((n, idx) => {
  const user = MOCK_USERS.find(
    (u) => String(u.id) === String(n.user_id) || String(u.user_id) === String(n.user_id)
  );
  return {
    notification_id: n.id ?? idx + 1,
    id: n.id ?? idx + 1,
    user_id: n.user_id,
    full_name: user?.full_name || "Nguyễn Văn An",
    user_email: user?.email || "owner@example.com",
    pet_id: n.pet_id ?? null,
    pet_name: n.pet_name ?? null,
    type: n.type,
    title: n.title,
    content: n.content || n.message || "",
    message: n.message || n.content || "",
    is_read: Boolean(n.is_read),
    scheduled_at: n.scheduled_at ?? null,
    sent_at: n.created_at,
    created_at: n.created_at,
  };
});

export let _adminMockAppointments: Appointment[] = [
  {
    id: "a1",
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
    owner_email: "owner@example.com",
    doctor_name: "BS. Trần Thị Hoa",
    doctor_email: "doctor@example.com",
    doctor_phone: "0912345678",
    service_name: "Khám tổng quát & Tiêm phòng",
    status: "confirmed",
    appointment_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "09:45",
    reason: "Kiểm tra sức khỏe định kỳ và tiêm nhắc lại vaccine",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a2",
    appointment_id: 102,
    pet_id: "p2",
    owner_id: "u1",
    service_id: "sv2",
    doctor_id: null,
    pet_name: "Bông",
    pet_species: "cat",
    pet_breed: "Mèo Anh lông ngắn",
    owner_name: "Nguyễn Văn An",
    owner_phone: "0901234567",
    owner_email: "owner@example.com",
    service_name: "Khám da liễu & Cạo vôi răng",
    status: "confirmed",
    appointment_date: new Date().toISOString().split("T")[0],
    start_time: "10:30",
    end_time: "11:15",
    reason: "Bé gãi tai nhiều, có mảng đỏ ở vành tai",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a3",
    appointment_id: 103,
    pet_id: "p3",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: null,
    pet_name: "Lucky",
    pet_species: "dog",
    pet_breed: "Golden Retriever",
    owner_name: "Lê Minh Tuấn",
    owner_phone: "0912345678",
    owner_email: "tuan.le@example.com",
    service_name: "Khám tổng quát",
    status: "confirmed",
    appointment_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    start_time: "14:00",
    end_time: "14:45",
    reason: "Bỏ ăn 1 ngày, uể oải, nôn nhẹ buổi sáng",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a4",
    appointment_id: 104,
    pet_id: "p1",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    pet_name: "Mochi",
    pet_species: "dog",
    pet_breed: "Poodle",
    owner_name: "Nguyễn Văn An",
    owner_phone: "0901234567",
    owner_email: "owner@example.com",
    doctor_name: "BS. Trần Thị Hoa",
    doctor_phone: "0912345678",
    service_name: "Khám sức khỏe tổng quát",
    status: "completed",
    appointment_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    start_time: "08:30",
    end_time: "09:15",
    reason: "Tẩy giun định kỳ",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a5",
    appointment_id: 105,
    pet_id: "p2",
    owner_id: "u1",
    service_id: "sv2",
    doctor_id: "u2",
    pet_name: "Bông",
    pet_species: "cat",
    pet_breed: "Mèo Anh lông ngắn",
    owner_name: "Lê Minh Tuấn",
    owner_phone: "0912345678",
    owner_email: "tuan.le@example.com",
    doctor_name: "BS. Trần Thị Hoa",
    service_name: "Khám tai mũi họng",
    status: "cancelled",
    cancel_reason: "Khách hàng bận đi công tác đột xuất",
    appointment_date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
    start_time: "15:00",
    end_time: "15:45",
    reason: "Khám viêm tai",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];



let _adminMockPets: Pet[] = MOCK_PETS.map((p) => {
  const owner = MOCK_USERS.find((u) => u.id === p.owner_id);
  return {
    ...p,
    owner_name: p.owner_name || owner?.full_name || "Nguyễn Văn An",
    owner_email: p.owner_email || owner?.email || "owner@example.com",
    owner_phone: p.owner_phone || owner?.phone || "0901234567",
  };
});

function normalizePet(item: any): Pet {
  if (!item) return item;
  return {
    ...item,
    id: String(item.id ?? item.pet_id ?? ""),
    microchip_number: item.microchip_number ?? item.microchip_id ?? undefined,
    notes: item.notes ?? item.special_notes ?? undefined,
  };
}

function normalizeAppointment(item: any): Appointment {
  if (!item) return item;
  const pet = MOCK_PETS.find((p) => String(p.id) === String(item.pet_id));
  const owner = MOCK_USERS.find((u) => String(u.id) === String(item.owner_id));
  const doctor = item.doctor_id
    ? MOCK_USERS.find((u) => String(u.id) === String(item.doctor_id))
    : null;

  const rawDate = item.appointment_date || (item.scheduled_at ? item.scheduled_at.split("T")[0] : "");
  const rawStartTime = item.start_time || (item.scheduled_at ? item.scheduled_at.split("T")[1]?.slice(0, 5) : "09:00");

  return {
    ...item,
    id: String(item.id ?? item.appointment_id ?? ""),
    appointment_id: item.appointment_id ?? item.id,
    pet_name: item.pet_name || pet?.name || "Thú cưng",
    pet_species: item.pet_species || pet?.species || "dog",
    pet_breed: item.pet_breed || pet?.breed || "",
    pet_weight: item.pet_weight ?? pet?.weight_kg,
    owner_name: item.owner_name || owner?.full_name || "Chủ nuôi",
    owner_phone: item.owner_phone || owner?.phone || "",
    owner_email: item.owner_email || owner?.email || "",
    doctor_name: item.doctor_name || doctor?.full_name || undefined,
    doctor_phone: item.doctor_phone || doctor?.phone || undefined,
    doctor_email: item.doctor_email || doctor?.email || undefined,
    service_name: item.service_name || "Khám sức khỏe tổng quát",
    appointment_date: rawDate,
    start_time: rawStartTime,
    end_time: item.end_time || "10:00",
    status: item.status || "confirmed",
    reason: item.reason || undefined,
    notes: item.notes || undefined,
    cancel_reason: item.cancel_reason || undefined,
  };
}



export interface AdminOverview {
  totalUsers: number;
  totalPets: number;
  todayAppointments: number;
  completedAppointments: number;
  unpaidInvoices: number;
  revenue: {
    total: number;
    month: number;
  };
  vaccinesDue: number;
}

export interface AppointmentStatItem {
  status: string;
  total: string | number;
}

export interface RevenueStatItem {
  month: string;
  revenue: string | number;
}

export interface UserStatItem {
  month: string;
  total: string | number;
}

export interface VaccinationStatItem {
  name: string;
  total: string | number;
}

export interface AdminDashboardData {
  overview: AdminOverview;
  appointmentStatistics: AppointmentStatItem[];
  revenueStatistics: RevenueStatItem[];
  userStatistics: UserStatItem[];
  vaccinationStatistics: VaccinationStatItem[];
}

export interface AdminStats extends AdminOverview {}

export const adminService = {
  async listUsers(filters?: UserFilterParams): Promise<UserListResult> {
    if (USE_MOCK) {
      let filtered = [...MOCK_USERS];
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s)
        );
      }
      if (filters?.role && filters.role !== "all") {
        filtered = filtered.filter((u) => u.role === filters.role);
      }
      if (filters?.status && filters.status !== "all") {
        const isActive = filters.status === "active";
        filtered = filtered.filter((u) => u.is_active === isActive);
      }
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);
      return mockDelay({
        items,
        pagination: { page, limit, total, totalPages },
      });
    }

    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.role && filters.role !== "all") params.append("role", filters.role);
    if (filters?.status && filters.status !== "all") params.append("status", filters.status);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const res = await axiosClient.get<any>(`/admin/users?${params.toString()}`);
    const data = res.data?.data;
    if (data?.items) {
      return data as UserListResult;
    }
    // Fallback if data is raw array
    if (Array.isArray(data)) {
      return {
        items: data,
        pagination: {
          page: filters?.page || 1,
          limit: filters?.limit || 10,
          total: data.length,
          totalPages: 1,
        },
      };
    }
    return {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getAllUsers(): Promise<User[]> {
    if (USE_MOCK) return mockDelay(MOCK_USERS);
    const res = await axiosClient.get<any>("/admin/users");
    return res.data?.data?.items || res.data?.data || res.data;
  },

  async getDoctors(): Promise<User[]> {
    if (USE_MOCK) return mockDelay(MOCK_USERS.filter((u) => u.role === "doctor"));
    const res = await axiosClient.get<any>("/admin/doctors");
    return res.data?.data || res.data;
  },

  async createUser(data: CreateAdminUserDTO): Promise<User> {
    if (USE_MOCK) {
      const newUser: User = {
        id: String(Date.now()),
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: data.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_USERS.unshift(newUser);
      return mockDelay(newUser);
    }
    const res = await axiosClient.post<any>("/admin/users", data);
    return res.data?.data || res.data;
  },

  async updateUserRole(id: string | number, role: UserRole): Promise<User> {
    if (USE_MOCK) {
      const u = MOCK_USERS.find((u) => u.id === String(id) || u.user_id === Number(id));
      if (!u) throw new Error("Người dùng không tồn tại.");
      u.role = role;
      u.updated_at = new Date().toISOString();
      return mockDelay({ ...u });
    }
    const res = await axiosClient.put<any>(`/admin/users/${id}/role`, { role });
    return res.data?.data || res.data;
  },

  async toggleUserActive(userId: string | number, isActive?: boolean): Promise<User> {
    if (USE_MOCK) {
      const u = MOCK_USERS.find((u) => u.id === String(userId) || u.user_id === Number(userId));
      if (!u) throw new Error("Người dùng không tồn tại.");
      const nextActive = isActive !== undefined ? isActive : !u.is_active;
      u.is_active = nextActive;
      u.updated_at = new Date().toISOString();
      return mockDelay({ ...u });
    }
    const res = await axiosClient.patch<any>(`/admin/users/${userId}/toggle-active`);
    return res.data?.data || res.data;
  },

  async updateUser(userId: string | number, data: UpdateAdminUserDTO): Promise<User> {
    if (USE_MOCK) {
      const u = MOCK_USERS.find((u) => u.id === String(userId) || u.user_id === Number(userId));
      if (!u) throw new Error("Người dùng không tồn tại.");
      if (data.full_name !== undefined) u.full_name = data.full_name;
      if (data.phone !== undefined) u.phone = data.phone;
      if (data.address !== undefined) u.address = data.address;
      u.updated_at = new Date().toISOString();
      return mockDelay({ ...u });
    }
    const res = await axiosClient.put<any>(`/admin/users/${userId}`, data);
    return res.data?.data || res.data;
  },

  async getStats(): Promise<AdminDashboardData> {
    const mockData: AdminDashboardData = {
      overview: {
        totalUsers: 156,
        totalPets: 284,
        todayAppointments: 18,
        completedAppointments: 64,
        unpaidInvoices: 7,
        revenue: {
          total: 125000000,
          month: 38450000,
        },
        vaccinesDue: 14,
      },
      appointmentStatistics: [
        { status: "completed", total: 64 },
        { status: "confirmed", total: 28 },
        { status: "pending", total: 12 },
        { status: "cancelled", total: 6 },
      ],
      revenueStatistics: [
        { month: "2026-05", revenue: 24500000 },
        { month: "2026-06", revenue: 31000000 },
        { month: "2026-07", revenue: 29800000 },
        { month: "2026-08", revenue: 35200000 },
        { month: "2026-09", revenue: 38450000 },
      ],
      userStatistics: [
        { month: "2026-05", total: 18 },
        { month: "2026-06", total: 24 },
        { month: "2026-07", total: 32 },
        { month: "2026-08", total: 39 },
        { month: "2026-09", total: 43 },
      ],
      vaccinationStatistics: [
        { name: "Dại (Rabies)", total: 48 },
        { name: "Care & Parvo 5 bệnh", total: 42 },
        { name: "Cúm mèo (FVRCP)", total: 35 },
        { name: "Bạch cầu (FeLV)", total: 21 },
        { name: "Leptospirosis", total: 18 },
      ],
    };

    if (USE_MOCK) {
      return mockDelay(mockData);
    }

    try {
      const res = await axiosClient.get<any>("/admin/dashboard");
      const data = res.data?.data || res.data;
      if (data?.overview) {
        return data as AdminDashboardData;
      }
      return mockData;
    } catch (err) {
      console.warn("Failed to fetch from /admin/dashboard, trying /admin/stats fallback:", err);
      try {
        const fallbackRes = await axiosClient.get<any>("/admin/stats");
        const fallbackData = fallbackRes.data?.data || fallbackRes.data;
        if (fallbackData?.overview) {
          return fallbackData as AdminDashboardData;
        }
      } catch (fallbackErr) {
        console.error("All stats endpoints failed, throwing error:", fallbackErr);
      }
      throw err;
    }
  },

  // ─── PET MANAGEMENT ───────────────────────────────────────────
  async listPets(filters?: PetFilterParams): Promise<PetListResult> {
    if (USE_MOCK) {
      let filtered = [..._adminMockPets];
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name?.toLowerCase().includes(s) ||
            p.owner_name?.toLowerCase().includes(s) ||
            p.breed?.toLowerCase().includes(s)
        );
      }
      if (filters?.species && filters.species !== "all") {
        filtered = filtered.filter((p) => p.species === filters.species);
      }
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);
      return mockDelay({
        items,
        pagination: { page, limit, total, totalPages },
      });
    }

    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.species && filters.species !== "all") params.append("species", filters.species);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const res = await axiosClient.get<any>(`/admin/pets?${params.toString()}`);
    const data = res.data?.data;
    if (data?.items) {
      return {
        items: data.items.map(normalizePet),
        pagination: data.pagination,
      };
    }
    if (Array.isArray(data)) {
      return {
        items: data.map(normalizePet),
        pagination: {
          page: filters?.page || 1,
          limit: filters?.limit || 10,
          total: data.length,
          totalPages: 1,
        },
      };
    }
    return {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getPetById(id: string | number): Promise<Pet> {
    const cleanId = String(id ?? "").trim();
    if (USE_MOCK) {
      const p = _adminMockPets.find((item) => String(item.id) === cleanId);
      if (!p) throw new Error("Thú cưng không tồn tại.");
      return mockDelay({ ...p });
    }
    const res = await axiosClient.get<any>(`/admin/pets/${cleanId}`);
    const raw = res.data?.data ?? res.data;
    return normalizePet(raw);
  },

  async updatePet(id: string | number, dto: UpdatePetDTO): Promise<Pet> {
    const cleanId = String(id ?? "").trim();
    if (USE_MOCK) {
      const idx = _adminMockPets.findIndex((item) => String(item.id) === cleanId);
      if (idx === -1) throw new Error("Thú cưng không tồn tại.");
      const updated = {
        ..._adminMockPets[idx],
        ...dto,
        updated_at: new Date().toISOString(),
      };
      if (dto.owner_id) {
        const owner = MOCK_USERS.find((u) => u.id === dto.owner_id);
        if (owner) {
          updated.owner_name = owner.full_name;
          updated.owner_email = owner.email;
          updated.owner_phone = owner.phone;
        }
      }
      _adminMockPets = _adminMockPets.map((item) =>
        String(item.id) === cleanId ? updated : item
      );
      return mockDelay(updated);
    }
    const payload = {
      ...dto,
      microchip_id: (dto as any).microchip_id ?? dto.microchip_number,
      special_notes: (dto as any).special_notes ?? dto.notes,
    };
    const res = await axiosClient.put<any>(`/admin/pets/${cleanId}`, payload);
    const raw = res.data?.data ?? res.data;
    return normalizePet(raw);
  },

  async deletePet(id: string | number): Promise<{ message?: string }> {
    const cleanId = String(id ?? "").trim();
    if (USE_MOCK) {
      _adminMockPets = _adminMockPets.filter((item) => String(item.id) !== cleanId);
      return mockDelay({ message: "Pet deleted successfully" });
    }
    const res = await axiosClient.delete<any>(`/admin/pets/${cleanId}`);
    return res.data;
  },

  async listAppointments(filters?: AdminAppointmentFilterParams): Promise<AdminAppointmentListResult> {
    const filterMock = () => {
      let filtered = _adminMockAppointments.map(normalizeAppointment);

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.pet_name?.toLowerCase().includes(s) ||
            a.owner_name?.toLowerCase().includes(s) ||
            a.doctor_name?.toLowerCase().includes(s) ||
            a.service_name?.toLowerCase().includes(s)
        );
      }

      if (filters?.status && filters.status !== "all") {
        filtered = filtered.filter((a) => a.status === filters.status);
      }

      if (filters?.unassigned) {
        filtered = filtered.filter((a) => !a.doctor_id);
      }

      if (filters?.dateFrom) {
        filtered = filtered.filter((a) => (a.appointment_date || "") >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        filtered = filtered.filter((a) => (a.appointment_date || "") <= filters.dateTo!);
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return {
        items,
        pagination: { page, limit, total, totalPages },
      };
    };

    if (USE_MOCK) {
      return mockDelay(filterMock());
    }

    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.status && filters.status !== "all") params.append("status", filters.status);
      if (filters?.unassigned) params.append("unassigned", "true");
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const res = await axiosClient.get<any>(`/admin/appointments?${params.toString()}`);
      const data = res.data?.data;
      if (data?.items) {
        return {
          items: data.items.map(normalizeAppointment),
          pagination: data.pagination,
        };
      }
      if (Array.isArray(data)) {
        return {
          items: data.map(normalizeAppointment),
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.length,
            totalPages: 1,
          },
        };
      }
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.warn("[adminService.listAppointments] API call failed, falling back to mock data:", err);
      return mockDelay(filterMock());
    }
  },

  async getAppointmentById(id: string | number): Promise<Appointment> {
    const cleanId = String(id ?? "").trim();
    if (USE_MOCK) {
      const found = _adminMockAppointments.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (!found) throw new Error("Lịch hẹn không tồn tại.");
      return mockDelay(normalizeAppointment(found));
    }

    try {
      const res = await axiosClient.get<any>(`/admin/appointments/${cleanId}`);
      const raw = res.data?.data ?? res.data;
      return normalizeAppointment(raw);
    } catch (err) {
      console.warn("[adminService.getAppointmentById] API failed, falling back to mock:", err);
      const found = _adminMockAppointments.find(
        (a) => String(a.id) === cleanId || String(a.appointment_id) === cleanId
      );
      if (found) return mockDelay(normalizeAppointment(found));
      throw err;
    }
  },

  async listDoctors(params?: { is_active?: boolean }): Promise<User[]> {
    const getMockDocs = () => {
      let docs = MOCK_USERS.filter((u) => u.role === "doctor");
      if (params?.is_active !== undefined) {
        docs = docs.filter((u) => u.is_active === params.is_active);
      }
      return docs;
    };

    if (USE_MOCK) {
      return mockDelay(getMockDocs());
    }

    try {
      const res = await axiosClient.get<any>("/admin/doctors");
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        return data.map((d: any) => ({
          ...d,
          id: String(d.id ?? d.user_id ?? ""),
          role: "doctor" as UserRole,
          is_active: d.is_active ?? true,
        }));
      }
      return [];
    } catch (err) {
      console.warn("[adminService.listDoctors] API failed, falling back to mock:", err);
      return mockDelay(getMockDocs());
    }
  },

  async listMedicalRecords(
    filters?: AdminMedicalRecordFilterParams
  ): Promise<AdminMedicalRecordListResult> {
    const filterMock = (): AdminMedicalRecordListResult => {
      let list = [...MOCK_MEDICAL_RECORDS];

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter((r) => {
          const petMatch = r.pet_name?.toLowerCase().includes(q);
          const docMatch = r.doctor_name?.toLowerCase().includes(q);
          const ownerMatch = r.owner_name?.toLowerCase().includes(q);
          const diagMatch = r.diagnosis?.toLowerCase().includes(q);
          return petMatch || docMatch || ownerMatch || diagMatch;
        });
      }

      if (filters?.doctorId) {
        const dId = String(filters.doctorId);
        list = list.filter((r) => String(r.doctor_id) === dId);
      }

      if (filters?.dateFrom) {
        list = list.filter((r) => {
          const recDate = (r.record_date || r.created_at || "").slice(0, 10);
          return recDate >= filters.dateFrom!;
        });
      }

      if (filters?.dateTo) {
        list = list.filter((r) => {
          const recDate = (r.record_date || r.created_at || "").slice(0, 10);
          return recDate <= filters.dateTo!;
        });
      }

      // Sort by record_date descending
      list.sort((a, b) => {
        const dateA = new Date(a.record_date || a.created_at || "").getTime();
        const dateB = new Date(b.record_date || b.created_at || "").getTime();
        return dateB - dateA;
      });

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const paginatedItems = list.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    };

    if (USE_MOCK) {
      return mockDelay(filterMock());
    }

    try {
      const params: Record<string, any> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.doctorId) params.doctorId = filters.doctorId;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;

      const res = await axiosClient.get<any>("/admin/medical-records", { params });
      const data = res.data?.data ?? res.data;

      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map((item: any) => ({
            ...item,
            id: String(item.record_id ?? item.id ?? ""),
            record_id: Number(item.record_id ?? item.id),
          })),
          pagination: data.pagination ?? {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.items.length,
            totalPages: 1,
          },
        };
      }

      if (Array.isArray(data)) {
        return {
          items: data.map((item: any) => ({
            ...item,
            id: String(item.record_id ?? item.id ?? ""),
            record_id: Number(item.record_id ?? item.id),
          })),
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.length,
            totalPages: 1,
          },
        };
      }

      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.warn("[adminService.listMedicalRecords] API failed, falling back to mock:", err);
      return mockDelay(filterMock());
    }
  },

  async listVaccinations(
    filters?: AdminVaccinationFilterParams
  ): Promise<AdminVaccinationListResult> {
    const filterMock = (): AdminVaccinationListResult => {
      let list = [...MOCK_PET_VACCINATIONS].map((item) => {
        // Hydrate relations if missing
        const pet = MOCK_PETS.find((p) => String(p.id) === String(item.pet_id));
        const owner = MOCK_USERS.find(
          (u) => String(u.id) === String(pet?.owner_id || item.owner_id)
        );
        const doctor = MOCK_USERS.find(
          (u) => String(u.id) === String(item.administered_by || item.doctor_id)
        );
        const vt = MOCK_VACCINE_TYPES.find(
          (v) => String(v.id) === String(item.vaccine_type_id)
        );

        return {
          ...item,
          id: String(item.vaccination_id ?? item.id ?? ""),
          vaccination_id: Number(item.vaccination_id ?? item.id),
          pet_name: item.pet_name || pet?.name || "Bé thú cưng",
          pet_species: item.pet_species || pet?.species || "dog",
          pet_breed: item.pet_breed || pet?.breed || "",
          owner_id: item.owner_id || owner?.id || "",
          owner_name: item.owner_name || owner?.full_name || "Chủ nuôi",
          owner_phone: item.owner_phone || owner?.phone || "",
          owner_email: item.owner_email || owner?.email || "",
          doctor_id: item.doctor_id || doctor?.id || "",
          doctor_name: item.doctor_name || doctor?.full_name || "Bác sĩ phụ trách",
          vaccine_name: item.vaccine_name || vt?.name || "Vắc xin",
          vaccine_type: item.vaccine_type || vt?.name || "Vắc xin",
          recommended_interval_days:
            item.recommended_interval_days || vt?.recommended_interval_days || 365,
        };
      });

      // Filter search
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter((r) => {
          const petMatch = r.pet_name?.toLowerCase().includes(q);
          const ownerMatch = r.owner_name?.toLowerCase().includes(q);
          const docMatch = r.doctor_name?.toLowerCase().includes(q);
          const batchMatch = (r.batch_number || r.lot_number)?.toLowerCase().includes(q);
          const vacMatch = r.vaccine_name?.toLowerCase().includes(q);
          return petMatch || ownerMatch || docMatch || batchMatch || vacMatch;
        });
      }

      // Filter vaccine type
      if (filters?.vaccineType && filters.vaccineType !== "all") {
        const vtId = String(filters.vaccineType);
        list = list.filter((r) => String(r.vaccine_type_id) === vtId);
      }

      // Filter due status
      if (filters?.dueStatus && filters.dueStatus !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        list = list.filter((r) => {
          if (!r.next_due_date) return false;
          const due = new Date(r.next_due_date);
          due.setHours(0, 0, 0, 0);
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (filters.dueStatus === "overdue") {
            return diffDays < 0;
          }
          if (filters.dueStatus === "due_soon" || filters.dueStatus === "upcoming") {
            return diffDays >= 0 && diffDays <= 30;
          }
          if (filters.dueStatus === "valid") {
            return diffDays > 30;
          }
          return true;
        });
      }

      // Sort by next_due_date ascending
      list.sort((a, b) => {
        const dateA = new Date(a.next_due_date || a.date_administered || "").getTime();
        const dateB = new Date(b.next_due_date || b.date_administered || "").getTime();
        return dateA - dateB;
      });

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const paginatedItems = list.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    };

    if (USE_MOCK) {
      return mockDelay(filterMock());
    }

    try {
      const params: Record<string, any> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.vaccineType && filters.vaccineType !== "all") {
        params.vaccineType = filters.vaccineType;
      }
      if (filters?.dueStatus && filters.dueStatus !== "all") {
        // Support backend values: "upcoming", "overdue", "valid"
        params.dueStatus =
          filters.dueStatus === "due_soon" ? "upcoming" : filters.dueStatus;
      }
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;

      const res = await axiosClient.get<any>("/admin/vaccinations", { params });
      const data = res.data?.data ?? res.data;

      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map((item: any) => ({
            ...item,
            id: String(item.vaccination_id ?? item.id ?? ""),
            vaccination_id: Number(item.vaccination_id ?? item.id),
            vaccine_name: item.vaccine_name || item.vaccine_type || "Vắc xin",
            batch_number: item.batch_number || item.lot_number || "",
          })),
          pagination: data.pagination ?? {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.items.length,
            totalPages: 1,
          },
        };
      }

      if (Array.isArray(data)) {
        return {
          items: data.map((item: any) => ({
            ...item,
            id: String(item.vaccination_id ?? item.id ?? ""),
            vaccination_id: Number(item.vaccination_id ?? item.id),
            vaccine_name: item.vaccine_name || item.vaccine_type || "Vắc xin",
            batch_number: item.batch_number || item.lot_number || "",
          })),
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.length,
            totalPages: 1,
          },
        };
      }

      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.warn("[adminService.listVaccinations] API failed, falling back to mock:", err);
      return mockDelay(filterMock());
    }
  },

  /** Quản lý danh sách hóa đơn Admin */
  async listInvoices(
    filters?: AdminInvoiceFilterParams
  ): Promise<AdminInvoiceListResponse> {
    const normalizeAdminInvoice = (raw: any): Invoice => {
      const cleanId = String(raw.invoice_id ?? raw.id ?? "");
      return {
        ...raw,
        id: cleanId,
        invoice_id: raw.invoice_id ?? raw.id,
        appointment_id: String(raw.appointment_id ?? ""),
        owner_id: String(raw.owner_id ?? raw.user_id ?? ""),
        owner_name: raw.owner_name || "Khách hàng",
        owner_phone: raw.owner_phone,
        owner_email: raw.owner_email,
        pet_id: raw.pet_id,
        pet_name: raw.pet_name || "Thú cưng",
        pet_species: raw.pet_species,
        pet_breed: raw.pet_breed,
        status: raw.status || "unpaid",
        total_amount: Number(raw.total_amount || 0),
        issued_date: raw.issued_date || raw.issued_at || raw.created_at,
        cancel_reason: raw.cancel_reason,
        items: Array.isArray(raw.items) ? raw.items : [],
        payments: Array.isArray(raw.payments) ? raw.payments : [],
        created_at: raw.created_at || raw.issued_date || new Date().toISOString(),
      };
    };

    const filterMock = (): AdminInvoiceListResponse => {
      let filtered = MOCK_INVOICES.map((inv: any) => {
        const user = MOCK_USERS.find((u) => String(u.id) === String(inv.owner_id));
        const appt = MOCK_APPOINTMENTS.find((a) => String(a.id) === String(inv.appointment_id));
        const pet = appt ? MOCK_PETS.find((p) => String(p.id) === String(appt.pet_id)) : undefined;
        return normalizeAdminInvoice({
          ...inv,
          owner_name: inv.owner_name || user?.full_name || "Khách hàng",
          owner_phone: inv.owner_phone || user?.phone,
          owner_email: inv.owner_email || user?.email,
          pet_id: inv.pet_id || pet?.id,
          pet_name: inv.pet_name || pet?.name || "Bé cưng",
          pet_species: inv.pet_species || pet?.species || "Chó",
          pet_breed: inv.pet_breed || pet?.breed,
        });
      });

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            (i.owner_name && i.owner_name.toLowerCase().includes(q)) ||
            (i.pet_name && i.pet_name.toLowerCase().includes(q)) ||
            String(i.invoice_id ?? i.id).includes(q)
        );
      }

      if (filters?.status && filters.status !== "all") {
        filtered = filtered.filter((i) => i.status === filters.status);
      }

      if (filters?.fromDate) {
        const from = new Date(filters.fromDate).getTime();
        filtered = filtered.filter((i) => new Date(i.issued_date || i.created_at).getTime() >= from);
      }

      if (filters?.toDate) {
        const to = new Date(filters.toDate).getTime() + 86400000;
        filtered = filtered.filter((i) => new Date(i.issued_date || i.created_at).getTime() <= to);
      }

      const total = filtered.length;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return {
        items,
        pagination: { page, limit, total, totalPages },
      };
    };

    if (USE_MOCK) {
      return mockDelay(filterMock());
    }

    try {
      const res = await axiosClient.get<any>("/admin/invoices", {
        params: {
          search: filters?.search || undefined,
          status: filters?.status !== "all" ? filters?.status : undefined,
          fromDate: filters?.fromDate || undefined,
          toDate: filters?.toDate || undefined,
          page: filters?.page || 1,
          limit: filters?.limit || 10,
        },
      });

      const data = res.data?.data ?? res.data;
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map(normalizeAdminInvoice),
          pagination: data.pagination ?? {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.items.length,
            totalPages: 1,
          },
        };
      }

      if (Array.isArray(data)) {
        return {
          items: data.map(normalizeAdminInvoice),
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: data.length,
            totalPages: 1,
          },
        };
      }

      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.warn("[adminService.listInvoices] API failed, falling back to mock:", err);
      return mockDelay(filterMock());
    }
  },

  /** Lấy chi tiết hóa đơn theo ID dành cho Admin */
  async getInvoiceById(id: string | number): Promise<Invoice> {
    const cleanId = String(id);
    const normalizeAdminInvoice = (raw: any): Invoice => ({
      ...raw,
      id: String(raw.invoice_id ?? raw.id ?? ""),
      invoice_id: raw.invoice_id ?? raw.id,
      appointment_id: String(raw.appointment_id ?? ""),
      owner_id: String(raw.owner_id ?? raw.user_id ?? ""),
      owner_name: raw.owner_name || "Khách hàng",
      owner_phone: raw.owner_phone,
      owner_email: raw.owner_email,
      pet_id: raw.pet_id,
      pet_name: raw.pet_name || "Thú cưng",
      pet_species: raw.pet_species,
      pet_breed: raw.pet_breed,
      status: raw.status || "unpaid",
      total_amount: Number(raw.total_amount || 0),
      issued_date: raw.issued_date || raw.issued_at || raw.created_at,
      cancel_reason: raw.cancel_reason,
      items: Array.isArray(raw.items) ? raw.items : [],
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      created_at: raw.created_at || raw.issued_date || new Date().toISOString(),
    });

    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === cleanId || String(i.invoice_id) === cleanId
      );
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      return mockDelay(normalizeAdminInvoice(inv));
    }

    try {
      const res = await axiosClient.get<any>(`/admin/invoices/${cleanId}`);
      const raw = res.data?.data ?? res.data;
      if (!raw) throw new Error("Hóa đơn không tồn tại.");
      return normalizeAdminInvoice(raw);
    } catch (err) {
      console.warn("[adminService.getInvoiceById] API failed, trying fallback:", err);
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === cleanId || String(i.invoice_id) === cleanId
      );
      if (inv) return mockDelay(normalizeAdminInvoice(inv));
      throw err;
    }
  },

  /** Hủy hóa đơn với lý do (Admin action) */
  async cancelInvoice(id: string | number, reason: string): Promise<Invoice> {
    const cleanId = String(id);
    const normalizeAdminInvoice = (raw: any): Invoice => ({
      ...raw,
      id: String(raw.invoice_id ?? raw.id ?? ""),
      invoice_id: raw.invoice_id ?? raw.id,
      status: raw.status || "cancelled",
      cancel_reason: raw.cancel_reason || reason,
    });

    if (USE_MOCK) {
      const inv = MOCK_INVOICES.find(
        (i) => String(i.id) === cleanId || String(i.invoice_id) === cleanId
      );
      if (!inv) throw new Error("Hóa đơn không tồn tại.");
      if (inv.status === "paid") throw new Error("Không thể hủy hóa đơn đã thanh toán.");
      inv.status = "cancelled";
      inv.cancel_reason = reason;
      return mockDelay(normalizeAdminInvoice(inv));
    }

    const res = await axiosClient.put<any>(`/admin/invoices/${cleanId}/cancel`, { reason });
    const raw = res.data?.data ?? res.data;
    return normalizeAdminInvoice(raw);
  },

  /** Danh sách thanh toán dành cho Admin */
  async listPayments(params?: AdminPaymentFilterParams): Promise<AdminPaymentListResult> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    const normalizeAdminPayment = (raw: any): Payment => ({
      ...raw,
      id: String(raw.payment_id ?? raw.id ?? ""),
      payment_id: raw.payment_id ?? raw.id,
      invoice_id: String(raw.invoice_id ?? ""),
      owner_id: String(raw.owner_id ?? raw.user_id ?? ""),
      owner_name: raw.owner_name || "Khách hàng",
      pet_id: raw.pet_id,
      pet_name: raw.pet_name,
      amount: Number(raw.amount || 0),
      payment_method: raw.payment_method || "cash",
      status: raw.status || "pending",
      transaction_ref: raw.transaction_ref,
      reject_reason: raw.reject_reason,
      payment_date: raw.payment_date || raw.created_at,
      paid_at: raw.paid_at,
      created_at: raw.created_at || raw.payment_date || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    });

    const filterMock = (): AdminPaymentListResult => {
      let list = [...MOCK_PAYMENTS];
      if (params?.status) {
        list = list.filter((p) => p.status === params.status);
      }
      if (params?.method) {
        list = list.filter((p) => p.payment_method === params.method);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.owner_name?.toLowerCase().includes(q) ||
            p.pet_name?.toLowerCase().includes(q) ||
            String(p.invoice_id).toLowerCase().includes(q) ||
            p.transaction_ref?.toLowerCase().includes(q)
        );
      }
      list.sort((a, b) => {
        const da = new Date(a.payment_date || a.created_at).getTime();
        const db = new Date(b.payment_date || b.created_at).getTime();
        return db - da;
      });
      const total = list.length;
      const start = (page - 1) * limit;
      const items = list.slice(start, start + limit).map(normalizeAdminPayment);
      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    };

    if (USE_MOCK) {
      return mockDelay(filterMock());
    }

    try {
      const res = await axiosClient.get<any>("/admin/payments", { params });
      const rawData = res.data?.data;
      if (rawData?.items && Array.isArray(rawData.items)) {
        return {
          items: rawData.items.map(normalizeAdminPayment),
          pagination: rawData.pagination ?? {
            page,
            limit,
            total: rawData.items.length,
            totalPages: Math.ceil(rawData.items.length / limit) || 1,
          },
        };
      }
      if (Array.isArray(rawData)) {
        return {
          items: rawData.map(normalizeAdminPayment),
          pagination: {
            page,
            limit,
            total: rawData.length,
            totalPages: Math.ceil(rawData.length / limit) || 1,
          },
        };
      }
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.warn("[adminService.listPayments] API failed, falling back to mock:", err);
      return mockDelay(filterMock());
    }
  },

  /** Danh sách toàn bộ thông báo trong hệ thống cho Admin */
  async listNotifications(
    params?: AdminNotificationFilterParams
  ): Promise<AdminNotificationListResult> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    const normalizeAdminNotification = (raw: any): AdminNotificationItem => {
      const id = raw.notification_id ?? raw.id ?? `notif_${Date.now()}`;
      const user = MOCK_USERS.find(
        (u) =>
          String(u.id) === String(raw.user_id) ||
          String(u.user_id) === String(raw.user_id)
      );
      return {
        ...raw,
        notification_id: id,
        id,
        user_id: raw.user_id,
        full_name: raw.full_name || user?.full_name || "Người dùng",
        user_email: raw.user_email || user?.email || "",
        pet_id: raw.pet_id ?? null,
        pet_name: raw.pet_name ?? null,
        type: raw.type || "system",
        title: raw.title || "Thông báo",
        content: raw.content || raw.message || "",
        message: raw.message || raw.content || "",
        is_read: Boolean(raw.is_read),
        scheduled_at: raw.scheduled_at ?? null,
        sent_at: raw.sent_at ?? raw.created_at ?? null,
        created_at: raw.created_at || new Date().toISOString(),
      };
    };

    const filterMock = (): AdminNotificationListResult => {
      let list = [..._adminMockNotifications];
      if (params?.type && params.type !== "all") {
        list = list.filter((n) => n.type === params.type);
      }
      if (params?.userId && params.userId !== "all") {
        list = list.filter((n) => String(n.user_id) === String(params.userId));
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (n) =>
            n.full_name?.toLowerCase().includes(q) ||
            n.user_email?.toLowerCase().includes(q) ||
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            (n.pet_name && n.pet_name.toLowerCase().includes(q))
        );
      }
      if (params?.fromDate) {
        const fromTime = new Date(params.fromDate).getTime();
        list = list.filter((n) => new Date(n.created_at).getTime() >= fromTime);
      }
      if (params?.toDate) {
        const toDateStr = params.toDate.includes("T")
          ? params.toDate
          : `${params.toDate}T23:59:59.999Z`;
        const toTime = new Date(toDateStr).getTime();
        list = list.filter((n) => new Date(n.created_at).getTime() <= toTime);
      }
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const total = list.length;
      const start = (page - 1) * limit;
      const items = list
        .slice(start, start + limit)
        .map(normalizeAdminNotification);
      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    };

    if (USE_MOCK) {
      return mockDelay(filterMock());
    }

    try {
      const res = await axiosClient.get<any>("/admin/notifications", {
        params,
      });
      const rawData = res.data?.data;
      if (rawData?.items && Array.isArray(rawData.items)) {
        return {
          items: rawData.items.map(normalizeAdminNotification),
          pagination: rawData.pagination ?? {
            page,
            limit,
            total: rawData.items.length,
            totalPages: Math.ceil(rawData.items.length / limit) || 1,
          },
        };
      }
      if (Array.isArray(rawData)) {
        return {
          items: rawData.map(normalizeAdminNotification),
          pagination: {
            page,
            limit,
            total: rawData.length,
            totalPages: Math.ceil(rawData.length / limit) || 1,
          },
        };
      }
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.warn(
        "[adminService.listNotifications] API failed, falling back to mock:",
        err
      );
      return mockDelay(filterMock());
    }
  },

  /** Gửi thông báo hệ thống (Admin action) */
  async sendSystemNotification(
    data: SendSystemNotificationDTO
  ): Promise<{
    success: boolean;
    data?: { recipients: number };
    message?: string;
  }> {
    const handleMockSend = () => {
      let targetUsers = [...MOCK_USERS].filter((u) => u.is_active !== false);
      if (data.target === "role" && data.role) {
        targetUsers = targetUsers.filter((u) => u.role === data.role);
      } else if (data.target === "user" && data.user_id) {
        targetUsers = targetUsers.filter(
          (u) =>
            String(u.id) === String(data.user_id) ||
            String(u.user_id) === String(data.user_id)
        );
      }

      const now = new Date().toISOString();
      const createdItems: AdminNotificationItem[] = targetUsers.map(
        (u, idx) => ({
          id: `sys_${Date.now()}_${idx}`,
          notification_id: Date.now() + idx,
          user_id: u.id || u.user_id || `u_${idx}`,
          full_name: u.full_name,
          user_email: u.email,
          pet_id: null,
          pet_name: null,
          type: "system",
          title: data.title,
          content: data.content,
          message: data.content,
          is_read: false,
          sent_at: now,
          created_at: now,
        })
      );

      _adminMockNotifications.unshift(...createdItems);

      return {
        success: true,
        message: "Thông báo hệ thống đã được gửi thành công!",
        data: { recipients: targetUsers.length },
      };
    };

    if (USE_MOCK) {
      return mockDelay(handleMockSend());
    }

    try {
      const res = await axiosClient.post<any>(
        "/admin/notifications/system",
        data
      );
      return {
        success: true,
        message:
          res.data?.message || "Thông báo hệ thống đã được gửi thành công!",
        data: res.data?.data,
      };
    } catch (err) {
      console.warn(
        "[adminService.sendSystemNotification] API failed, falling back to mock:",
        err
      );
      return mockDelay(handleMockSend());
    }
  },
};

export const admin = {
  service: adminService,
};

export default adminService;
