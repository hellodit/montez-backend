import {
  bigint,
  bigserial,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core'
import { EMBEDDING_DIMENSIONS } from '../constants'
import { agents } from './agent'
import { knowledgebases } from './knowledgebase'


export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    knowledgebaseId: bigint('knowledgebase_id', { mode: 'number' })
      .notNull()
      .references(() => knowledgebases.id, { onDelete: 'cascade' }),
    agentId: bigint('agent_id', { mode: 'number' })
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    originalContent: text('original_content').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    heading: text('heading'), // path heading mis. "Instalasi > Docker"; null = preamble
    tokenCount: integer('token_count'), // estimasi token teks ter-embed
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('knowledge_chunks_embedding_hnsw').using('hnsw', t.embedding.op('vector_cosine_ops')),
    index('knowledge_chunks_agent_id_idx').on(t.agentId),
    uniqueIndex('knowledge_chunks_kb_chunk_uq').on(t.knowledgebaseId, t.chunkIndex),
  ],
)
