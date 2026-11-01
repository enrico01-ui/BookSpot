import { z } from "zod";
import {requiredText, optionalText, nullableText, idParam} from "../../lib/zod-helper.js";

const statusEnum = z.enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "SUSPENDED", "REJECTED"]);

export const venueIdParamSchema = z.object({
  id: idParam,
});

const venueBaseSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Nama venue minimal 3 karakter")
    .max(100),

  address: z.string()
    .trim()
    .min(5, "Alamat minimal 5 karakter"),

  city: z.string()
    .trim()
    .min(2, "Nama kota tidak valid"),

  latitude: z.number()
    .min(-90, "Latitude tidak valid")
    .max(90, "Latitude tidak valid")
    .nullable()
    .optional(),

  longitude: z.number()
    .min(-180, "Longitude tidak valid")
    .max(180, "Longitude tidak valid")
    .nullable()
    .optional(),

  description: z.string()
    .trim()
    .max(1000)
    .nullable()
    .optional(),
});

export const createVenueSchema = venueBaseSchema
  .strict()
  .refine(
    (data) =>
      (data.latitude == null) === (data.longitude == null),
    {
      message: "Latitude dan longitude harus diisi bersamaan",
      path: ["latitude"],
    },
  );

export const updateVenueSchema = venueBaseSchema
  .partial()
  .strict();

export const getVenuesSchema = z.object({
  ownerId: z.coerce.number().int().positive().optional(),
  name: z.string().trim().optional(),
  type: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "name", "updatedAt"])
      .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: statusEnum.optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// 6. Admin Actions Schema
export const rejectVenueSchema = z.object({
  reason: z.string()
    .trim()
    .min(5, "Alasan penolakan minimal 5 karakter")
    .max(500, "Alasan penolakan maksimal 500 karakter"),
}).strict();

export const suspendVenueSchema = z.object({
  reason: z.string()
    .trim()
    .min(5, "Alasan penangguhan minimal 5 karakter")
    .max(500, "Alasan penangguhan maksimal 500 karakter"),
}).strict();



// Types Export
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type GetVenuesInput = z.infer<typeof getVenuesSchema>;
export type RejectVenueInput = z.infer<typeof rejectVenueSchema>;
export type SuspendVenueInput = z.infer<typeof suspendVenueSchema>;
export type VenueIdParam = z.infer<typeof venueIdParamSchema>;
