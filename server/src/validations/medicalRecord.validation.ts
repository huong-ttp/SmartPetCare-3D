import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  pet_id: z.number(),

  appointment_id: z.number().nullable().optional(),

  doctor_id: z.number().nullable().optional(),

  diagnosis: z.string().min(1),

  treatment: z.string().optional(),

  prescription: z.string().optional(),

  weight_at_visit: z.number().optional(),

  record_date: z.string(),

  notes: z.string().optional(),
});