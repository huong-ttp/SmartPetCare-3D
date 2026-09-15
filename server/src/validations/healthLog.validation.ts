import { z } from "zod";

export const createHealthLogSchema = z.object({
  body: z.object({
    pet_id: z.number(),

    weight_kg: z.number().positive(),

    height_cm: z.number().positive().optional(),

    log_date: z.string(),
  }),
});