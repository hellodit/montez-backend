import { afterAll, beforeAll, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { app } from '../app'
import { db } from '../db/client'
import { user } from '../db/schema'
import { auth } from '../modules/auth/auth'

const PASSWORD = 'password123'
const ADMIN = `admin-mw-${Date.now()}@test.local`
const PLAIN = `plain-mw-${Date.now()}@test.local`

async function login(email: string, password = PASSWORD) {
  return app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

beforeAll(async () => {
  for (const email of [ADMIN, PLAIN]) {
    await auth.api.signUpEmail({ body: { name: 'T', email, password: PASSWORD } })
  }
  await db.update(user).set({ isAdmin: true }).where(eq(user.email, ADMIN))
})

afterAll(async () => {
  for (const email of [ADMIN, PLAIN]) await db.delete(user).where(eq(user.email, email))
})

test('admin can log in and gets a token', async () => {
  const res = await login(ADMIN)
  expect(res.status).toBe(200)
  const json = (await res.json()) as { data: { token: string } }
  expect(typeof json.data.token).toBe('string')
})

test('non-admin is rejected with 403 even with the right password', async () => {
  const res = await login(PLAIN)
  expect(res.status).toBe(403)
  const json = (await res.json()) as { success: boolean; message: string }
  expect(json.success).toBe(false)
  expect(json.message).toBe('Access is restricted to administrators.')
})

test('unknown email gets the same 403, not a credential error', async () => {
  const res = await login('nobody-at-all@test.local')
  expect(res.status).toBe(403)
})

test('admin with a wrong password still fails on credentials', async () => {
  const res = await login(ADMIN, 'wrong-password')
  expect(res.status).toBe(401)
})

test('JWT of an admin carries the isAdmin claim', async () => {
  const res = await login(ADMIN)
  const json = (await res.json()) as { data: { token: string } }
  const claims = JSON.parse(atob(json.data.token.split('.')[1]!)) as { isAdmin?: boolean }
  expect(claims.isAdmin).toBe(true)
})

test('register cannot self-grant admin', async () => {
  const email = `sneaky-${Date.now()}@test.local`
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'S', email, password: PASSWORD, isAdmin: true }),
  })
  expect(res.status).toBe(201)

  const row = await db.query.user.findFirst({
    where: { email },
    columns: { isAdmin: true },
  })
  expect(row?.isAdmin).toBe(false)

  await db.delete(user).where(eq(user.email, email))
})
