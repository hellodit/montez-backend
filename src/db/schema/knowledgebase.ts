import {
  bigint,
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import { TRAINING_STATUS } from '../constants'
import { agents } from './agent'


export const knowledgebases = pgTable(
  'knowledgebases',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 256 }),
    description: text('description'),
    content: text('content'),
    // Frontmatter sumber apa adanya; null untuk dokumen tanpa frontmatter atau yang YAML-nya rusak.
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    trainingStatus: varchar('training_status', { length: 20 })
      .notNull()
      .default(TRAINING_STATUS.idle),
    trainedAt: timestamp('trained_at'),
    agentId: bigint('agent_id', { mode: 'number' })
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('knowledgebases_agent_created').on(t.agentId, t.createdAt),
    // Kunci idempotensi importer knowledge (name = path relatif file sumber).
    uniqueIndex('knowledgebases_agent_name_uq').on(t.agentId, t.name),
  ],
)
