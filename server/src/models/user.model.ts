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

  is_deleted: boolean;

  deleted_at?: Date | null;

  created_at: Date;

  updated_at: Date;
}