import { z } from "zod";

export const createAppointmentSchema = z.object({
  pet_id: z
    .union([z.number().int().positive("pet_id phải là số nguyên dương"), z.string().transform((v) => Number(v))])
    .refine((v) => !isNaN(v) && v > 0, "pet_id không hợp lệ"),

  service_id: z
    .union([z.number().int().positive(), z.string().transform((v) => (v === "" ? undefined : Number(v)))])
    .optional()
    .nullable(),

  appointment_date: z
    .string()
    .min(1, "Ngày hẹn không được để trống")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày hẹn phải là YYYY-MM-DD"),

  start_time: z
    .string()
    .min(1, "Giờ bắt đầu không được để trống")
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Định dạng giờ phải là HH:MM hoặc HH:MM:SS"),

  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Định dạng giờ phải là HH:MM hoặc HH:MM:SS")
    .optional()
    .nullable(),

  reason: z.string().max(500, "Lý do khám tối đa 500 ký tự").optional().nullable(),

  notes: z.string().max(1000, "Ghi chú tối đa 1000 ký tự").optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  cancel_reason: z
    .string()
    .min(2, "Lý do hủy hẹn phải có ít nhất 2 ký tự")
    .max(500, "Lý do hủy hẹn tối đa 500 ký tự"),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const availableSlotsQuerySchema = z.object({
  pet_id: z
    .union([z.number().int().positive(), z.string().transform((v) => Number(v))])
    .refine((v) => !isNaN(v) && v > 0, "pet_id không hợp lệ"),

  date: z
    .string()
    .min(1, "Ngày kiểm tra slot không được để trống")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày phải là YYYY-MM-DD"),
});

export type AvailableSlotsQueryInput = z.infer<typeof availableSlotsQuerySchema>;

export const assignDoctorSchema = z.object({
  doctor_id: z
    .union([z.number().int().positive("doctor_id phải là số nguyên dương"), z.string().transform((v) => Number(v))])
    .refine((v) => !isNaN(v) && v > 0, "doctor_id không hợp lệ"),
});

export type AssignDoctorInput = z.infer<typeof assignDoctorSchema>;
