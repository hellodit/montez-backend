import { bigint, bigserial, pgTable, text, integer, real, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { audits } from './audits'

export const patterns = pgTable('patterns', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  auditId: bigint('audit_id', { mode: 'number' }).references(() => audits.id),
  patternName: text('pattern_name'),
  ingredients: jsonb('ingredients').notNull(),
  sampleSize: integer('sample_size'),
  avgEngagementRate: real('avg_engagement_rate'),
  confidence: real('confidence'),
  platform: text('platform'),
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
})
