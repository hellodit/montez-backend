import { eq } from 'drizzle-orm'
import type { MiddlewareHandler } from 'hono'
import { db } from '../db/client'
import { user } from '../db/schema'
import { currentUser } from '../lib/auth'
import { failedResponse } from '../lib/response'
import type { AuthVariables } from '../modules/auth/auth.types'

const ADMIN_ONLY = 'Access is restricted to administrators.'

/** Gerbang login: hanya `is_admin = true` boleh menukar kredensial jadi token. */
export const requireAdminLogin: MiddlewareHandler = async (c, next) => {
  // c.req.json() aman di middleware — Hono men-cache hasil parse untuk controller.
  const body = (await c.req.json().catch(() => null)) as { email?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (email === '') return next()

  const row = await db.query.user.findFirst({
    where: { email },
    columns: { isAdmin: true },
  })

  // Email tak terdaftar ditolak dgn respons yang sama — kalau tidak, 403 vs 401
  // memberi tahu email mana yang ada di sistem.
  if (!row?.isAdmin) return failedResponse(c, ADMIN_ONLY, 403)

  return next()
}

/** Guard admin untuk route ber-requireAuth; klaim dibekukan saat token dibuat. */
export const requireAdmin: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  if (currentUser(c).isAdmin !== true) return failedResponse(c, ADMIN_ONLY, 403)
  return next()
}
