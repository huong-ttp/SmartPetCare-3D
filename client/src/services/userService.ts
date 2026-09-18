/**
 * userService.ts
 * Quản lý thông tin tài khoản: Lấy profile, cập nhật profile, đổi mật khẩu.
 * Dùng mock data khi NEXT_PUBLIC_USE_MOCK=true.
 */

import axiosClient from "@/lib/axiosClient";
import type {
  User,
  UpdateProfileDTO,
  ChangePasswordDTO,
} from "@/types/user.type";
import { MOCK_USERS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const userService = {
  /**
   * Lấy thông tin cá nhân của người dùng hiện tại
   */
  async getProfile(): Promise<User> {
    if (USE_MOCK) {
      return mockDelay(MOCK_USERS[0]);
    }

    try {
      const res = await axiosClient.get<any>("/users/profile");
      return res.data?.data || res.data;
    } catch (err) {
      console.error("[userService.getProfile] Error:", err);
      throw err;
    }
  },

  /**
   * Cập nhật thông tin profile (họ tên, sđt, địa chỉ, avatar)
   * API: user.service.updateProfile(...)
   */
  async updateProfile(dto: UpdateProfileDTO): Promise<User> {
    if (USE_MOCK) {
      const updated = { ...MOCK_USERS[0], ...dto, updated_at: new Date().toISOString() };
      Object.assign(MOCK_USERS[0], updated);
      return mockDelay(updated);
    }

    try {
      const res = await axiosClient.put<any>("/users/profile", dto);
      return res.data?.data || res.data;
    } catch (err) {
      console.error("[userService.updateProfile] Error:", err);
      throw err;
    }
  },

  /**
   * Thay đổi mật khẩu người dùng
   * API: user.service.changePassword(...)
   */
  async changePassword(dto: ChangePasswordDTO): Promise<{ message: string }> {
    if (USE_MOCK) {
      if (dto.current_password !== "password123") {
        throw new Error("Mật khẩu hiện tại không chính xác.");
      }
      return mockDelay({ message: "Đổi mật khẩu thành công!" });
    }

    try {
      const res = await axiosClient.put<any>("/users/change-password", {
        current_password: dto.current_password,
        new_password: dto.new_password,
      });
      return res.data?.data || res.data;
    } catch (err) {
      console.error("[userService.changePassword] Error:", err);
      throw err;
    }
  },
};

// Cung cấp alias user.service theo phong cách gọi của đề bài
export const user = {
  service: userService,
};

export default userService;
