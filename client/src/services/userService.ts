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
import type { ApiResponse } from "@/types/api.type";
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
      const res = await axiosClient.get<ApiResponse<User> | User>("/users/profile");
      return (res.data as ApiResponse<User>)?.data || (res.data as User);
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
      if (dto.avatar instanceof File) {
        const formData = new FormData();
        if (dto.full_name) formData.append("full_name", dto.full_name);
        if (dto.phone) formData.append("phone", dto.phone);
        if (dto.address) formData.append("address", dto.address);
        formData.append("avatar", dto.avatar);

        const res = await axiosClient.put<ApiResponse<User> | User>("/users/profile", formData);
        return (res.data as ApiResponse<User>)?.data || (res.data as User);
      }

      const res = await axiosClient.put<ApiResponse<User> | User>("/users/profile", dto);
      return (res.data as ApiResponse<User>)?.data || (res.data as User);
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
      const res = await axiosClient.put<ApiResponse<{ message: string }> | { message: string }>("/users/change-password", {
        current_password: dto.current_password,
        new_password: dto.new_password,
      });
      return (res.data as ApiResponse<{ message: string }>)?.data || (res.data as { message: string });
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
