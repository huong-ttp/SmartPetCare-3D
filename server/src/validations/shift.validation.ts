import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD");
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ phải có định dạng HH:mm");
const shiftType = z.enum(["morning", "afternoon"]);

export const shiftRangeQuerySchema = z.object({
  startDate: dateStr,
  endDate: dateStr,
  doctor_id: z.coerce.number().int().positive().optional(),
}).refine((v) => v.endDate >= v.startDate, {
  message: "endDate phải sau hoặc bằng startDate",
  path: ["endDate"],
}).refine(
  (v) => (new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / 86_400_000 <= 92,
  { message: "Khoảng thời gian tối đa 92 ngày", path: ["endDate"] }
);

export const createShiftSchema = z.object({
  doctor_id: z.coerce.number().int().positive(),
  dates: z.array(dateStr).min(1, "Chọn ít nhất 1 ngày").max(62),
  shift_types: z.array(shiftType).min(1, "Chọn ít nhất 1 ca"),
  start_time: timeStr.optional(),
  end_time: timeStr.optional(),
  room: z.string().trim().max(255).nullable().optional(),
  max_patients: z.coerce.number().int().min(0).max(100).optional(),
  is_off: z.boolean().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export const updateShiftSchema = z.object({
  start_time: timeStr.optional(),
  end_time: timeStr.optional(),
  room: z.string().trim().max(255).nullable().optional(),
  max_patients: z.coerce.number().int().min(0).max(100).optional(),
  is_off: z.boolean().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});
