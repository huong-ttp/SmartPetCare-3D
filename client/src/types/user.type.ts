// ============================================================
// USER entity types
// ============================================================

export type UserRole = "owner" | "doctor" | "admin";

export interface User {
  id: string;
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

export interface UpdateProfileDTO {
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}
