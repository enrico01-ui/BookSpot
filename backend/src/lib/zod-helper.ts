import { z } from "zod";

export const idParam = z.coerce.number().int().positive(); // params URL selalu string

export const requiredText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

// Create: "" dianggap tidak diisi.
export const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => v || undefined).optional();

// Update: "" atau null berarti "hapus isinya".
export const nullableText = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === "" ? null : v)).nullable();

export function isUnique<T>(items: T[], key: (item: T) => string | number): boolean {
  return new Set(items.map(key)).size === items.length;
}