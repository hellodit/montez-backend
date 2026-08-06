import { bigint, bigserial, pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { user } from './auth'
import { chatConversations } from './chat-conversations'
import { CHAT_ROLE } from '../constants'
import type { TokenUsage } from '../constants'

export type ChatMessageMetadata = {
  usage?: TokenUsage
  model?: string
  toolCalls?: { name: string }[]
}

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    conversationId: bigint('conversation_id', { mode: 'number' })
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    role: text('role').notNull().default(CHAT_ROLE.user), // CHAT_ROLE
    content: text('content').notNull(),
    metadata: jsonb('metadata')
      .$type<ChatMessageMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('chat_messages_conversation_created').on(t.conversationId, t.createdAt)],
)
