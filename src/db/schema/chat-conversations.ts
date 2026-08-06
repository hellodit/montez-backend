import { bigserial, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    // Diisi saat conversation dibuat = potongan awal pesan pertama (chat.title.ts).
    // Tetap nullable karena baris lama bisa null; conversation baru selalu berjudul.
    title: text('title'),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('chat_conversations_user_last').on(t.userId, t.lastMessageAt)],
)
