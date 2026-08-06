import { Agent } from '@mastra/core/agent'
import { scriptModel } from '../providers'
import { listRecentAudits, getAuditReport } from '../tools/audit/audit-tools'

const ASSISTANT_INSTRUCTIONS = `You are Montez AI's content-intelligence assistant. You help the signed-in user understand their own content audits (short-form social posts and accounts).

Guidelines:
- Answer questions about the user's audits using the provided tools. Call "listRecentAudits" to discover audits, and "getAuditReport" to read a specific completed audit's scores and summary.
- Only reason about data returned by the tools; never invent audit numbers. If a tool returns nothing, say so plainly.
- Be concise and practical. When explaining why content performed, ground it in the report's metrics.
- Never reveal internal IDs unless the user asks. Never output raw personal data.`

export const auditAssistant = new Agent({
  id: 'audit-assistant',
  name: 'audit-assistant',
  instructions: ASSISTANT_INSTRUCTIONS,
  model: scriptModel,
  tools: { listRecentAudits, getAuditReport },
})
