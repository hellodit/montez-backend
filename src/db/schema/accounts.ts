import { bigserial, pgTable, text, integer, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth'

// Akun sosial target audit — beda dari tabel auth `account`.
export const socialAccounts = pgTable(
  'social_accounts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    platform: text('platform').notNull(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    followerCount: integer('follower_count'),
    isVerified: boolean('is_verified').default(false),
    marketTag: text('market_tag'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('social_accounts_user_platform_username').on(t.userId, t.platform, t.username)],
)
