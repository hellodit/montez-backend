import { test, expect } from 'bun:test'
import { auditAssistant } from '../../agents/audit-assistant'

test('auditAssistant is registered with tools', async () => {
  expect(auditAssistant.id).toBe('audit-assistant')
  // Tools terpasang (dua tool fase 1). `.tools` bukan accessor publik pada
  // @mastra/core@1.51 — resolusi (termasuk tools berbentuk fungsi) hanya
  // tersedia via `listTools()` (lihat agent.d.ts: "Gets the tools configured
  // for this agent, resolving function-based tools if necessary").
  const tools = await auditAssistant.listTools()
  const keys = Object.keys(tools)
  expect(keys).toContain('listRecentAudits')
  expect(keys).toContain('getAuditReport')
})
