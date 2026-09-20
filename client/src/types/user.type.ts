// ============================================================
// USER entity types
// ============================================================

export type UserRole = "owner" | "doctor" | "admin";

export interface User {
  id: string;
  user_id?: string | number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role: UserRole;
  /** false khi chưa xác thực OTP; true sau khi xác thực xong */
  is_active: boolean;
  created_at: string; // ISO 8601
  updated_at: string;
  role_updated_by?: string | number | null;
  role_updated_at?: string | null;
}

// DTO khi đăng ký (owner tự đăng ký)
export interface RegisterDTO {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  password: string;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// DTO admin tạo doctor
export interface CreateDoctorDTO {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

// DTO admin tạo doctor hoặc admin trực tiếp
export interface CreateAdminUserDTO {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: "doctor" | "admin";
}

// DTO cập nhật thông tin user bởi admin
export interface UpdateAdminUserDTO {
  full_name?: string;
  phone?: string;
  address?: string;
}

export interface UserFilterParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResult {
  items: User[];
  pagination: UserPagination;
}

export interface UpdateProfileDTO {
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
  confirm_password?: string;
}


