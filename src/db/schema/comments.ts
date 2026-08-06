import { bigint, bigserial, pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { posts } from './posts'

export const comments = pgTable(
  'comments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    username: text('username'),
    text: text('text').notNull(),
    likes: integer('likes').default(0),
    isBuyingSignal: boolean('is_buying_signal').default(false),
    isFollowSignal: boolean('is_follow_signal').default(false),
    isDesireSignal: boolean('is_desire_signal').default(false),
    postedAt: timestamp('posted_at'),
  },
  (t) => [index('comments_post_signals').on(t.postId, t.isBuyingSignal)],
)
