import { z } from "zod";
import {requiredText, optionalText, nullableText, idParam} from "../../lib/zod-helper.js";

const statusEnum = z.enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "SUSPENDED", "REJECTED"]);

export const venueIdParamSchema = z.object({
  id: idParam,
});

const venueBaseSchema = z.object({
  name: z.string().trim().min(3, "Nama venue minimal 3 karakter").max(100),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter"),
  city: z.string().trim().min(2, "Nama kota tidak valid"),
  latitude: z
    .number()
    .min(-90, "Latitude tidak valid")
    .max(90, "Latitude tidak valid")
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, "Longitude tidak valid")
    .max(180, "Longitude tidak valid")
    .optional()
    .nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const createVenueSchema = venueBaseSchema;

export const updateVenueSchema = venueBaseSchema.partial();

export const getVenuesSchema = z.object({
  ownerId: z.coerce.number().int().positive().optional(),
  status: statusEnum.optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

// 6. Admin Actions Schema
export const rejectVenueSchema = z.object({
  reason: z.string().trim().min(5, "Alasan penolakan minimal 5 karakter"),
});

// Types Export
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type GetVenuesInput = z.infer<typeof getVenuesSchema>;
export type RejectVenueInput = z.infer<typeof rejectVenueSchema>;
export type VenueIdParam = z.infer<typeof venueIdParamSchema>;
