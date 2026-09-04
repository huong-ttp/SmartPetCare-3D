/**
 * adminService.ts — Admin: quản lý user, thống kê
 */
import axiosClient from "@/lib/axiosClient";
import type { User } from "@/types/user.type";
import { MOCK_USERS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export interface AdminStats {
  totalUsers: number;
  totalPets: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  totalRevenue: number;
}

export const adminService = {
  async getAllUsers(): Promise<User[]> {
    if (USE_MOCK) return mockDelay(MOCK_USERS);
    const res = await axiosClient.get<User[]>("/admin/users");
    return res.data;
  },

  async getDoctors(): Promise<User[]> {
    if (USE_MOCK) return mockDelay(MOCK_USERS.filter((u) => u.role === "doctor"));
    const res = await axiosClient.get<User[]>("/admin/doctors");
    return res.data;
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<User> {
    if (USE_MOCK) {
      const u = MOCK_USERS.find((u) => u.id === userId);
      if (!u) throw new Error("Người dùng không tồn tại.");
      return mockDelay({ ...u, is_active: isActive });
    }
    const res = await axiosClient.patch<User>(`/admin/users/${userId}/active`, { is_active: isActive });
    return res.data;
  },

  async getStats(): Promise<AdminStats> {
    if (USE_MOCK) {
      return mockDelay({
        totalUsers: 150,
        totalPets: 230,
        totalAppointments: 540,
        appointmentsThisMonth: 42,
        totalRevenue: 32_500_000,
      });
    }
    const res = await axiosClient.get<AdminStats>("/admin/stats");
    return res.data;
  },
};
