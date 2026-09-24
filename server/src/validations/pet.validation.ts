import { z } from "zod";

export const createPetSchema = z.object({
  body: z.object({
    name: z.string().min(1),

    species: z.string().min(1),

    breed: z.string().optional().nullable(),

    gender: z.enum([
      "Male",
      "Female",
      "Unknown",
      "male",
      "female",
      "unknown",
    ]),

    date_of_birth: z.string().optional().nullable(),

    weight_kg: z.union([z.number(), z.string()]).optional().nullable(),

    color: z.string().optional().nullable(),

    microchip_id: z.string().optional().nullable(),

    avatar_url: z.string().optional().nullable(),

    allergies: z.string().optional().nullable(),

    chronic_conditions: z.string().optional().nullable(),

    special_notes: z.string().optional().nullable(),
  }),
});

export type CreatePetInput =
  z.infer<typeof createPetSchema>["body"];

  export const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  species: z.string().min(1).max(50).optional(),

  breed: z.string().max(100).optional(),

  gender: z
    .enum(["male", "female", "unknown"])
    .optional(),

  date_of_birth: z.string().optional(),

  weight_kg: z.number().positive().optional(),

  color: z.string().max(50).optional(),

  microchip_id: z.string().max(100).optional(),

  avatar_url: z.string().optional(),

  allergies: z.string().optional(),

  chronic_conditions: z.string().optional(),

  special_notes: z.string().optional(),
});