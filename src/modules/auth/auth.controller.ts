import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { user as userTable } from '../../db/schema'
import { successResponse, failedResponse } from '../../lib/response'
import { parseBody } from '../../lib/validation'
import { currentUserId } from '../../lib/auth'
import type { AuthVariables } from './auth.types'
import { auth } from './auth'
import { withJwt, mapAuthError } from './auth.helper'
import {
  forgotPasswordSchema,
  loginGoogleSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema'
import { env } from '../../config'

function validationFailed(c: Context, errors: unknown) {
  return failedResponse(c, 'Validation failed.', 400, errors)
}

export async function register(c: Context) {
  const body = await parseBody(c, registerSchema)
  if (!body.ok) return validationFailed(c, body.errors)
  try {
    const { headers, response } = await auth.api.signUpEmail({ body: body.data, returnHeaders: true })
    return successResponse(c, await withJwt(headers, response.user), 'Registered.', 201)
  } catch (e) {
    return mapAuthError(c, e)
  }
}

export async function login(c: Context) {
  const body = await parseBody(c, loginSchema)
  if (!body.ok) return validationFailed(c, body.errors)
  try {
    const { headers, response } = await auth.api.signInEmail({ body: body.data, returnHeaders: true })
    return successResponse(c, await withJwt(headers, response.user))
  } catch (e) {
    return mapAuthError(c, e)
  }
}

// Login via Google — FE mengirim ID token dari Google Identity Services, Better Auth
// memverifikasinya ke Google (audience = GOOGLE_CLIENT_ID) lalu membuat/menautkan user.
// Response memakai envelope { user, token, sessionToken } yang sama dengan /login.
export async function loginGoogle(c: Context) {
  const body = await parseBody(c, loginGoogleSchema)
  if (!body.ok) return validationFailed(c, body.errors)
  if (!env.GOOGLE_CLIENT_ID) {
    return failedResponse(c, 'Google login is not configured.', 503)
  }
  try {
    const { headers, response } = await auth.api.signInSocial({
      body: { provider: 'google', idToken: { token: body.data.idToken } },
      returnHeaders: true,
    })
    // Union: cabang redirect (url) tidak pernah terjadi pada id-token flow.
    if (!('user' in response) || !response.user) {
      return failedResponse(c, 'Google sign-in failed.', 401)
    }
    return successResponse(c, await withJwt(headers, response.user))
  } catch (e) {
    return mapAuthError(c, e)
  }
}

// Email reset di-stub (belum ada mailer). Selalu balas generik (anti user-enumeration).
export async function forgotPassword(c: Context) {
  const body = await parseBody(c, forgotPasswordSchema)
  if (!body.ok) return validationFailed(c, body.errors)
  return successResponse(c, { sent: true })
}

export async function resetPassword(c: Context) {
  const body = await parseBody(c, resetPasswordSchema)
  if (!body.ok) return validationFailed(c, body.errors)
  try {
    await auth.api.resetPassword({ body: { newPassword: body.data.newPassword, token: body.data.token } })
    return successResponse(c, { reset: true })
  } catch (e) {
    return mapAuthError(c, e)
  }
}

export async function me(c: Context<{ Variables: AuthVariables }>) {
  const u = await db.query.user.findFirst({
    where: { id: currentUserId(c) },
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      isAdmin: true,
    },
  })
  if (!u) return failedResponse(c, 'User not found', 404)
  return successResponse(c, { user: u })
}
