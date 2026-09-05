import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z.string().min(3).max(100),

  email: z.string().email(),

  password: z.string().min(6),

  phone: z.string().optional(),

  address: z.string().optional(),

  avatar_url: z.string().optional(),

  role: z.enum(["owner", "doctor", "admin"]),

  is_active: z.boolean().optional()
});

export const updateUserSchema = createUserSchema.partial();

export const loginSchema = z.object({
  email: z.string().email(),

  password: z.string().min(6)
});