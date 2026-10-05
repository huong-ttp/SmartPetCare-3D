import { z } from "zod";

/**
 * Với multipart/form-data, các ô input bỏ trống được gửi lên dưới dạng "".
 * Chuyển "" thành undefined để các field optional hoạt động đúng.
 */
const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const registerSchema = z
  .object({
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

    phone: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .regex(/^0\d{9}$/, "Số điện thoại không hợp lệ")
        .optional()
    ),

    address: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().max(255).optional()
    ),

    // Thông tin thú cưng (tùy chọn) — dùng kèm ảnh `petAvatar` khi đăng ký
    pet_name: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(100, "Tên thú cưng tối đa 100 ký tự").optional()
    ),

    pet_species: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(50, "Loài tối đa 50 ký tự").optional()
    ),

    pet_breed: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().max(100, "Giống tối đa 100 ký tự").optional()
    ),

    pet_gender: z.preprocess(
      (value: unknown) => {
        const normalized = emptyStringToUndefined(value);
        return typeof normalized === "string"
          ? normalized.trim().toLowerCase()
          : normalized;
      },
      z
        .enum(["male", "female", "unknown"], {
          message: "Giới tính thú cưng phải là male, female hoặc unknown",
        })
        .optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.pet_name && !data.pet_species) {
      ctx.addIssue({
        code: "custom",
        path: ["pet_species"],
        message: "Vui lòng nhập loài thú cưng",
      });
    }

    if (data.pet_species && !data.pet_name) {
      ctx.addIssue({
        code: "custom",
        path: ["pet_name"],
        message: "Vui lòng nhập tên thú cưng",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ"),

  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token là bắt buộc"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ"),

  otp: z
    .string()
    .length(6, "OTP phải gồm 6 số"),

  new_password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(50),
});