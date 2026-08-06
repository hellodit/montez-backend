import type { MiddlewareHandler } from 'hono'
import { jwtVerify, createLocalJWKSet, type JSONWebKeySet } from 'jose'
import { db } from '../db/client'
import { jwks as jwksTable } from '../db/schema'
import { env } from '../config'
import { failedResponse } from '../lib/response'
import type { AuthClaims, AuthVariables } from '../modules/auth/auth.types'

// Verifikasi JWT lokal dari tabel jwks (bukan remote fetch) — jalan in-process.
// Cache di-refresh bila verifikasi gagal (mis. key baru dibuat setelah cache).
let jwksCache: ReturnType<typeof createLocalJWKSet> | null = null

async function loadJwks() {
  const rows = await db.select().from(jwksTable)
  // Better Auth menyimpan JWK publik tanpa kid/alg; JWKS endpoint memakai row.id
  // sebagai kid. Rekonstruksi supaya cocok dengan header token (matching by kid).
  const keys = rows.map((r) => ({
    ...(JSON.parse(r.publicKey) as Record<string, unknown>),
    kid: r.id,
    alg: 'EdDSA',
  })) as JSONWebKeySet['keys']
  return createLocalJWKSet({ keys })
}

async function getJwks() {
  if (!jwksCache) jwksCache = await loadJwks()
  return jwksCache
}

export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null
  if (!token) return failedResponse(c, 'Unauthorized', 401)

  const opts = { issuer: env.BETTER_AUTH_URL, audience: env.BETTER_AUTH_URL }
  try {
    let payload
    try {
      ;({ payload } = await jwtVerify(token, await getJwks(), opts))
    } catch {
      jwksCache = null // key mungkin baru → refresh sekali
      ;({ payload } = await jwtVerify(token, await getJwks(), opts))
    }
    c.set('user', payload as AuthClaims)
    await next()
  } catch {
    return failedResponse(c, 'Unauthorized', 401)
  }
}
