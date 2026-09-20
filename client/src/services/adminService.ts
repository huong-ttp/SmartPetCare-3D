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
import { MOCK_USERS, MOCK_PETS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

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
};

export const admin = {
  service: adminService,
};

export default adminService;
