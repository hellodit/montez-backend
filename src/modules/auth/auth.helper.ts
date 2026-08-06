import { APIError } from 'better-auth/api'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { failedResponse } from '../../lib/response'
import { auth } from './auth'
import type { AuthUser } from './auth.types'

// Lampirkan JWT ke response auth: tukar session token (header set-auth-token) → JWT.
export async function withJwt(headers: Headers, user: AuthUser) {
  const sessionToken = headers.get('set-auth-token')
  if (!sessionToken) throw new Error('Session was not established after authentication.')
  const { token } = await auth.api.getToken({
    headers: new Headers({ authorization: `Bearer ${sessionToken}` }),
  })
  return { user, token, sessionToken }
}

// Map error Better Auth (APIError) → response gagal; error lain bubble up.
export function mapAuthError(c: Context, e: unknown) {
  if (e instanceof APIError) {
    const status = (e.statusCode ?? 400) as ContentfulStatusCode
    return failedResponse(c, e.body?.message ?? e.message, status)
  }
  throw e
}
