import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { getRecentAudits, getAuditReportForUser } from './audit-tools.service'

// userId di-forward lewat RequestContext saat agent.stream(..., { requestContext }).
// Tool WAJIB membacanya dari sini (bukan closure) supaya isolasi tenant aman lintas user.
function requireUserId(ctx: { requestContext?: { get: (k: string) => unknown } }): string {
  const userId = ctx.requestContext?.get('userId')
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new Error('Missing userId in request context')
  }
  return userId
}

export const listRecentAudits = createTool({
  id: 'list-recent-audits',
  description:
    "List the caller's most recent content audits (id, type, platform, target, status). Use this to find which audits exist before diving into one.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(30).default(10),
  }),
  execute: async ({ limit }, ctx) => {
    const userId = requireUserId(ctx)
    return { audits: await getRecentAudits(userId, limit) }
  },
})

export const getAuditReport = createTool({
  id: 'get-audit-report',
  description:
    "Fetch the full report (scores + analyze/correlate summary) of one completed audit owned by the caller. Returns an object with null report and recommendations if the audit is not found, not owned by the caller, or not yet completed.",
  inputSchema: z.object({
    auditId: z.number().int().positive(),
  }),
  execute: async ({ auditId }, ctx) => {
    const userId = requireUserId(ctx)
    const result = await getAuditReportForUser(userId, auditId)
    return result ?? { report: null, recommendations: null }
  },
})
