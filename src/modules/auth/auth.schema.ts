import { z } from 'zod'

const password = z
  .string({ error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')

export const registerSchema = z.object({
  name: z.string({ error: 'Name is required.' }).min(1, 'Name is required.').max(100),
  email: z.email('Invalid email format.'),
  password,
})

export const loginSchema = z.object({
  email: z.email('Invalid email format.'),
  password: z.string({ error: 'Password is required.' }).min(1, 'Password is required.'),
})

export const loginGoogleSchema = z.object({
  idToken: z.string({ error: 'idToken is required.' }).min(1, 'idToken is required.'),
})

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email format.'),
})

export const resetPasswordSchema = z.object({
  token: z.string({ error: 'Token is required.' }).min(1, 'Token is required.'),
  newPassword: password,
})
