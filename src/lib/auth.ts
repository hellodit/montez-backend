import type { Context } from 'hono'
import type { AuthClaims, AuthVariables } from '../modules/auth/auth.types'

// Helper akses identitas dari context (di-set requireAuth). ID user = text/uuid.
export function currentUser(c: Context<{ Variables: AuthVariables }>): AuthClaims {
  return c.get('user')
}

export function currentUserId(c: Context<{ Variables: AuthVariables }>): string {
  return String(currentUser(c).id)
}
