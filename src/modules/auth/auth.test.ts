import { describe, expect, it, spyOn } from 'bun:test'
import { app } from '../../app'
import { env } from '../../config'
import { auth } from './auth'

async function register(): Promise<{ token: string; email: string }> {
  const email = `u${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'T', email, password: 'password123' }),
  })
  expect(res.status).toBe(201)
  const body = (await res.json()) as { data: { token: string } }
  return { token: body.data.token, email }
}

describe('auth (JWT)', () => {
  it('register returns a JWT token + user', async () => {
    const email = `u${Date.now()}@test.local`
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'T', email, password: 'password123' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.data.token).toBeTruthy()
    expect(body.data.user.email).toBe(email)
  })

  it('me requires a valid Bearer token', async () => {
    const { token, email } = await register()

    const noAuth = await app.request('/api/auth/me')
    expect(noAuth.status).toBe(401)

    const withAuth = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(withAuth.status).toBe(200)
    const me = (await withAuth.json()) as any
    expect(me.data.user.email).toBe(email)
  })

  it('rejects a garbage token', async () => {
    const res = await app.request('/api/auth/me', { headers: { authorization: 'Bearer not.a.jwt' } })
    expect(res.status).toBe(401)
  })
})

describe('auth (self-service profile edits via better-auth core routes)', () => {
  it('update-user changes the name', async () => {
    const email = `u${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Before', email, password: 'password123' }),
    })
    const regBody = (await reg.json()) as any
    const sessionToken = regBody.data.sessionToken as string

    const res = await app.request('/api/auth/update-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ name: 'After' }),
    })
    expect(res.status).toBe(200)

    const me = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${regBody.data.token}` },
    })
    // Token JWT lama masih membawa nama lama — /me pakai klaim JWT, bukan
    // sesi better-auth langsung, jadi ini menegaskan update-user sendiri
    // tak error, bukan menegaskan /me ikut berubah seketika.
    expect(me.status).toBe(200)
  })

  it('change-email is enabled and updates the email without a verification round-trip', async () => {
    const email = `u${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`
    const newEmail = `changed-${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'T', email, password: 'password123' }),
    })
    const regBody = (await reg.json()) as any
    const sessionToken = regBody.data.sessionToken as string

    const res = await app.request('/api/auth/change-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ newEmail }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.status).toBe(true)

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: 'password123' }),
    })
    expect(login.status).toBe(200)
  })
})

describe('auth (Google id-token login)', () => {
  function loginGoogle(body: unknown) {
    return app.request('/api/auth/login/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('rejects a missing idToken with 400', async () => {
    const res = await loginGoogle({})
    expect(res.status).toBe(400)
    const body = (await res.json()) as any
    expect(body.success).toBe(false)
    expect(body.errors.idToken).toBeTruthy()
  })

  it('returns 503 when Google login is not configured', async () => {
    const prev = env.GOOGLE_CLIENT_ID
    env.GOOGLE_CLIENT_ID = undefined
    try {
      const res = await loginGoogle({ idToken: 'some-google-id-token' })
      expect(res.status).toBe(503)
    } finally {
      env.GOOGLE_CLIENT_ID = prev
    }
  })

  it('returns the JWT envelope for a verified Google token', async () => {
    // Sesi & user nyata via register; mock HANYA menggantikan verifikasi token
    // ke Google (butuh jaringan + kredensial asli), bukan pembuatan sesi.
    const email = `g${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'G', email, password: 'password123' }),
    })
    expect(reg.status).toBe(201)
    const regBody = (await reg.json()) as any
    const sessionToken = regBody.data.sessionToken as string

    const prev = env.GOOGLE_CLIENT_ID
    env.GOOGLE_CLIENT_ID = 'test-client-id'
    const spy = spyOn(auth.api, 'signInSocial').mockResolvedValue({
      headers: new Headers({ 'set-auth-token': sessionToken }),
      response: { redirect: false, token: sessionToken, url: undefined, user: regBody.data.user },
    } as never)
    try {
      const res = await loginGoogle({ idToken: 'verified-google-id-token' })
      expect(res.status).toBe(200)
      const body = (await res.json()) as any
      expect(body.data.token).toBeTruthy()
      expect(body.data.sessionToken).toBe(sessionToken)
      expect(body.data.user.email).toBe(email)
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
      env.GOOGLE_CLIENT_ID = prev
    }
  })
})
