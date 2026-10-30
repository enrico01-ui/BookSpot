import { z } from "zod";
import { UserRole } from "../../generated/prisma/enums.js";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: z.enum(["CUSTOMER", "OWNER"]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;


export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;