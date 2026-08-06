import {
  bigint,
  bigserial,
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { audits } from './audits'
import { socialAccounts } from './accounts'

export const posts = pgTable(
  'posts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    auditId: bigint('audit_id', { mode: 'number' })
      .notNull()
      .references(() => audits.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    accountId: bigint('account_id', { mode: 'number' }).references(() => socialAccounts.id),
    platform: text('platform').notNull(),
    platformId: text('platform_id').notNull(),
    caption: text('caption'),
    hashtags: text('hashtags').array(),
    durationSec: integer('duration_sec'),
    postedAt: timestamp('posted_at'),
    mediaObjectKey: text('media_object_key'),
    coverObjectKey: text('cover_object_key'),
    soundName: text('sound_name'),
    isSponsored: boolean('is_sponsored').default(false),
    scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('posts_user_platform_platform_id').on(t.userId, t.platform, t.platformId),
    index('posts_audit').on(t.auditId),
  ],
)
