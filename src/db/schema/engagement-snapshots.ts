import { bigserial, pgTable, text, bigint, real, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { posts } from './posts'
import { SNAPSHOT_TYPE } from '../constants'

export const engagementSnapshots = pgTable(
  'engagement_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    snapshotType: text('snapshot_type').notNull().default(SNAPSHOT_TYPE.t0),
    views: bigint('views', { mode: 'number' }),
    likes: bigint('likes', { mode: 'number' }),
    commentsCount: bigint('comments_count', { mode: 'number' }),
    shares: bigint('shares', { mode: 'number' }),
    saves: bigint('saves', { mode: 'number' }),
    reach: bigint('reach', { mode: 'number' }),
    impressions: bigint('impressions', { mode: 'number' }),
    watchTimeMs: bigint('watch_time_ms', { mode: 'number' }),
    // Owner-only (Meta insights, snapshotType='meta_insights').
    totalInteractions: bigint('total_interactions', { mode: 'number' }),
    avgWatchTimeMs: bigint('avg_watch_time_ms', { mode: 'number' }),
    profileVisits: bigint('profile_visits', { mode: 'number' }),
    followsFromPost: bigint('follows_from_post', { mode: 'number' }),
    engagementRate: real('engagement_rate'),
    scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  },
  (t) => [index('engagement_post').on(t.postId, t.snapshotType)],
)
