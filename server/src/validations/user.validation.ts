import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z.string().trim().min(2).max(100),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ"),

  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(50, "Mật khẩu tối đa 50 ký tự"),

  phone: z
    .string()
    .regex(/^0\d{9}$/, "Số điện thoại không hợp lệ")
    .optional(),

  address: z
    .string()
    .trim()
    .max(255)
    .optional(),
});

export const updateUserSchema =
  createUserSchema.partial();