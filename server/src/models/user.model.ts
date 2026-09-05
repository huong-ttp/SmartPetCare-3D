export interface User {
  user_id: number;

  full_name: string;

  email: string;

  password_hash: string;

  phone?: string;

  address?: string;

  avatar_url?: string;

  role: "owner" | "doctor" | "admin";

  is_active: boolean;

  created_at: Date;

  updated_at: Date;
}