import type { AuthVariables } from '../modules/auth/auth.types'
import { currentUserId } from '../lib/auth'
import { createMiddleware } from 'hono/factory'
import { redis } from '../queue/connection'
import { env } from '../config'
import { failedResponse } from '../lib/response'

// Fixed-window rate limit per user via Redis. Dipasang setelah requireAuth.
export const auditRateLimit = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const userId = currentUserId(c)
    const windowSec = env.AUDIT_RATE_WINDOW_SEC
    const windowStart = Math.floor(Date.now() / 1000 / windowSec)
    const key = `ratelimit:audits:${userId}:${windowStart}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSec)
    if (count > env.AUDIT_RATE_LIMIT) {
      return failedResponse(c, 'Rate limit exceeded. Try again later.', 429)
    }
    await next()
  },
)
