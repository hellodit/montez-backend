import { z } from "zod";

/**
 * Create user oleh admin. Password DIKIRIM di sini (berbeda dari update) karena
 * pembuatan akun didelegasikan ke Better Auth `signUpEmail` (hash + record
 * `account` yang benar) — bukan insert mentah. Flag admin-only (`isAdmin`,
 * `emailVerified`) diterapkan lewat update susulan oleh service, karena
 * signUpEmail sengaja menolaknya (`input: false` di auth.ts).
 */
export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().email("Invalid email format.").max(256),
  password: z
    .string({ error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
  emailVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

/**
 * Field yang boleh diubah admin — dibatasi ke kolom yang benar-benar ada di tabel
 * `user`. Password SENGAJA tak ada: perubahan password tetap lewat flow Better
 * Auth reset (lihat auth module).
 */
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(256),
    email: z.string().trim().email().max(256),
    image: z.string().trim().url().max(2048),
    emailVerified: z.boolean(),
    isAdmin: z.boolean(),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided for update.",
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(256).optional(),
});

// ID user = text (diisi Better Auth, bukan serial) → jangan di-coerce ke number.
export const userIdParamSchema = z.object({
  id: z.string({ error: "User ID is required." }).trim().min(1).max(64),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
