import { test, expect, beforeAll, afterAll, describe } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from "@montez-tstack/db"
import { user, audits } from "@montez-tstack/db/schema"
import { getRecentAudits, getAuditReportForUser } from './audit-tools.service'

/**
 * Integration test: SATU-SATUNYA test di paket ini yang menulis ke database.
 * Opt-in lewat TEST_DATABASE_URL supaya `bun run test` (turbo) tak pernah
 * menyuntik baris ke database aplikasi.
 *
 *   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/montez_test bun test
 *
 * Database itu harus sudah punya tabel `user` & `audits` (skema di packages/db).
 * beforeAll/afterAll sengaja di DALAM describe — di top level ia tetap jalan
 * meski seluruh test di-skip.
 */
const U1 = 'tool-user-1'
const U2 = 'tool-user-2'

describe.skipIf(!process.env.TEST_DATABASE_URL)('audit tools (butuh TEST_DATABASE_URL)', () => {
  let auditId = 0

  beforeAll(async () => {
    for (const id of [U1, U2]) {
      await db.insert(user).values({ id, name: id, email: `${id}@t.local`, emailVerified: false }).onConflictDoNothing()
    }
    const [row] = await db.insert(audits).values({
      userId: U1, type: 'post', platform: 'instagram', targetUrl: 'https://x/reel/1',
      status: 'done', report: { score: 88 },
    }).returning({ id: audits.id })
    auditId = row!.id
  })

  afterAll(async () => {
    await db.delete(audits).where(eq(audits.userId, U1))
    await db.delete(user).where(eq(user.id, U1))
    await db.delete(user).where(eq(user.id, U2))
  })

  test('getRecentAudits only returns caller-owned audits', async () => {
    expect((await getRecentAudits(U1, 10)).length).toBe(1)
    expect((await getRecentAudits(U2, 10)).length).toBe(0)
  })

  test('getAuditReportForUser respects ownership', async () => {
    const mine = await getAuditReportForUser(U1, auditId)
    expect(mine?.report).toEqual({ score: 88 })
    expect(await getAuditReportForUser(U2, auditId)).toBeNull()
  })
})
