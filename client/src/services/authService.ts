/**
 * authService.ts
 * Xác thực: đăng ký, OTP, đăng nhập, đăng xuất.
 * Dùng mock data khi NEXT_PUBLIC_USE_MOCK=true.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  RegisterDTO,
  VerifyOtpDTO,
  LoginDTO,
  AuthResponse,
  CreateDoctorDTO,
  UpdateProfileDTO,
  User,
} from "@/types/user.type";
import { MOCK_USERS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// ─── Auth service ─────────────────────────────────────────────────────────────

export const authService = {
  /** Owner tự đăng ký — sau đó cần xác thực OTP */
  async register(dto: RegisterDTO): Promise<{ message: string }> {
    if (USE_MOCK) return mockDelay({ message: "OTP đã gửi đến email của bạn." });
    const res = await axiosClient.post<{ message: string }>("/auth/register", dto);
    return res.data;
  },

  /** Xác thực OTP để kích hoạt tài khoản (is_active: false → true) */
  async verifyOtp(dto: VerifyOtpDTO): Promise<{ message: string }> {
    if (USE_MOCK) return mockDelay({ message: "Xác thực thành công. Vui lòng đăng nhập." });
    const res = await axiosClient.post<{ message: string }>("/auth/verify-otp", dto);
    return res.data;
  },

  /** Đăng nhập — chỉ cho phép khi is_active = true */
  async login(dto: LoginDTO): Promise<AuthResponse> {
    if (USE_MOCK) {
      const user = MOCK_USERS.find((u) => u.email === dto.email && u.is_active);
      if (!user) throw new Error("Email không tồn tại hoặc tài khoản chưa được kích hoạt.");
      return mockDelay({ access_token: "mock_token_" + user.id, user });
    }
    const res = await axiosClient.post<AuthResponse>("/auth/login", dto);
    return res.data;
  },

  /** Lấy profile của user hiện tại */
  async getMe(): Promise<User> {
    if (USE_MOCK) return mockDelay(MOCK_USERS[0]);
    const res = await axiosClient.get<User>("/auth/me");
    return res.data;
  },

  /** Cập nhật profile */
  async updateProfile(dto: UpdateProfileDTO): Promise<User> {
    if (USE_MOCK) return mockDelay({ ...MOCK_USERS[0], ...dto });
    const res = await axiosClient.patch<User>("/auth/profile", dto);
    return res.data;
  },

  /** Admin tạo tài khoản doctor */
  async createDoctor(dto: CreateDoctorDTO): Promise<User> {
    if (USE_MOCK) {
      const newDoctor: User = {
        id: "u_new_" + Date.now(),
        ...dto,
        role: "doctor",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockDelay(newDoctor);
    }
    const res = await axiosClient.post<User>("/admin/doctors", dto);
    return res.data;
  },
};
