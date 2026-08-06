import { bigint, bigserial, pgTable, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { user } from './auth'
import { socialAccounts } from './accounts'
import { AUDIT_STATUS } from '../constants'
export type AuditProgress = { stage: string; done: number; total: number; failed: number }

export const audits = pgTable(
  'audits',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    type: text('type').notNull(), // AUDIT_TYPE (post | account)
    platform: text('platform').notNull(), // PLATFORM (instagram | tiktok | youtube)
    targetUrl: text('target_url').notNull(),
    accountId: bigint('account_id', { mode: 'number' }).references(() => socialAccounts.id),
    status: text('status').notNull().default(AUDIT_STATUS.queued),
    progress: jsonb('progress')
      .$type<AuditProgress>()
      .notNull()
      .default(sql`'{"stage":"queued","done":0,"total":0,"failed":0}'::jsonb`),
    requestedLimit: integer('requested_limit'),
    error: text('error'),
    report: jsonb('report'),
    recommendations: jsonb('recommendations'),
    tokenCost: jsonb('token_cost'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    finishedAt: timestamp('finished_at'),
  },
  (t) => [index('audits_user_status').on(t.userId, t.status)],
)
