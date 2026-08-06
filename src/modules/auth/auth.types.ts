import type { JWTPayload } from 'jose'

// Klaim JWT (selaras dengan definePayload di auth.ts) + klaim standar (sub/iss/aud/exp/iat).
export type AuthClaims = JWTPayload & {
  id: string
  email: string
  name: string
  // Optional: token yang diterbitkan sebelum kolom is_admin ada tak punya klaim ini.
  isAdmin?: boolean
}

// Variabel yang di-set requireAuth ke Hono context.
export type AuthVariables = {
  user: AuthClaims
}

// Bentuk minimal user Better Auth yang dipakai helper (withJwt).
export type AuthUser = { id: string; email: string; name: string }
