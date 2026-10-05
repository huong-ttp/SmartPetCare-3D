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

const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const emptyStringToNull = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const updateProfileSchema = z.object({
  full_name: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự").max(100).optional()
  ),

  phone: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .regex(/^0\d{9}$/, "Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0)")
      .optional()
      .nullable()
  ),

  address: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable()
  ),

  avatar_url: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .optional()
      .nullable()
  ),
});

export const changePasswordSchema = z.object({
  current_password: z
    .string()
    .min(8, "Mật khẩu hiện tại phải có ít nhất 8 ký tự"),

  new_password: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
});