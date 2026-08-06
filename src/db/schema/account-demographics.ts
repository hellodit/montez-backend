import { bigint, bigserial, pgTable, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { socialAccounts } from './accounts'

export const accountDemographics = pgTable(
  'account_demographics',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    accountId: bigint('account_id', { mode: 'number' })
      .notNull()
      .references(() => socialAccounts.id),
    metric: text('metric').notNull(), // follower_demographics | engaged_audience_demographics
    breakdown: text('breakdown').notNull(), // age | gender | city | country
    timeframe: text('timeframe'),
    data: jsonb('data').$type<Record<string, number>>().notNull(),
    total: integer('total'),
    snapshotDate: text('snapshot_date'),
    scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  },
  (t) => [index('account_demographics_user_account').on(t.userId, t.accountId)],
)
