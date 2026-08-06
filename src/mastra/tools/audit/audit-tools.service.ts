import { desc } from 'drizzle-orm'
import { db } from "@montez-tstack/db"
import { audits } from "@montez-tstack/db/schema"
import { ownedBy } from "@montez-tstack/db/helpers"
import { AUDIT_STATUS } from "@montez-tstack/db/constants"

export async function getRecentAudits(userId: string, limit: number) {
  const rows = await db
    .select({
      id: audits.id,
      type: audits.type,
      platform: audits.platform,
      targetUrl: audits.targetUrl,
      status: audits.status,
      createdAt: audits.createdAt,
    })
    .from(audits)
    .where(ownedBy(audits, userId))
    .orderBy(desc(audits.createdAt))
    .limit(Math.min(Math.max(limit, 1), 30))
  return rows
}

export async function getAuditReportForUser(userId: string, auditId: number) {
  const row = await db.query.audits.findFirst({
    where: { RAW: (t) => ownedBy(t, userId), id: auditId },
    columns: { id: true, status: true, report: true, recommendations: true },
  })
  if (!row || row.status !== AUDIT_STATUS.done) return null
  return { report: row.report, recommendations: row.recommendations }
}
