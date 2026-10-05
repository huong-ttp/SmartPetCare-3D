import { z } from "zod";

export const createPetSchema = z.object({
  name: z.string().min(1, "Tên thú cưng không được để trống").max(100),

  species: z.string().min(1, "Loài thú cưng không được để trống").max(50),

  breed: z.string().max(100).optional().nullable(),

  gender: z
    .enum([
      "Male",
      "Female",
      "Unknown",
      "male",
      "female",
      "unknown",
    ])
    .optional()
    .default("unknown"),

  date_of_birth: z.string().optional().nullable(),

  weight_kg: z
    .union([z.number(), z.string().transform((v) => (v === "" ? undefined : Number(v)))])
    .optional()
    .nullable(),

  color: z.string().max(50).optional().nullable(),

  microchip_id: z.string().max(50).optional().nullable(),

  avatar_url: z.string().optional().nullable(),

  allergies: z.string().optional().nullable(),

  chronic_conditions: z.string().optional().nullable(),

  special_notes: z.string().optional().nullable(),

  owner_id: z
    .union([z.number(), z.string().transform((v) => Number(v))])
    .optional()
    .nullable(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  species: z.string().min(1).max(50).optional(),

  breed: z.string().max(100).optional().nullable(),

  gender: z
    .enum([
      "Male",
      "Female",
      "Unknown",
      "male",
      "female",
      "unknown",
    ])
    .optional(),

  date_of_birth: z.string().optional().nullable(),

  weight_kg: z
    .union([z.number().positive(), z.string().transform((v) => (v === "" ? undefined : Number(v)))])
    .optional()
    .nullable(),

  color: z.string().max(50).optional().nullable(),

  microchip_id: z.string().max(50).optional().nullable(),

  avatar_url: z.string().optional().nullable(),

  allergies: z.string().optional().nullable(),

  chronic_conditions: z.string().optional().nullable(),

  special_notes: z.string().optional().nullable(),
});

export type UpdatePetInput = z.infer<typeof updatePetSchema>;