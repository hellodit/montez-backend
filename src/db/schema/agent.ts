import {sql} from 'drizzle-orm'
import {bigserial, boolean, index, pgTable, text, timestamp, uniqueIndex, varchar} from 'drizzle-orm/pg-core'
import {user} from './auth'

/**
 * agents — persona AI yang dibuat user saat runtime (dynamic agent, dirakit dari
 * row DB oleh mastra/agent-factory.ts). Milik satu user; ON DELETE CASCADE.
 *
 * `isChatable` = persona chat global: dibaca findChatableAgent() TANPA filter
 * tenant, jadi satu baris melayani semua user (lihat docs/endpoint.md).
 *
 * `userId` bertipe text karena PK tabel `user` diisi Better Auth (text/uuid) —
 * ini juga syarat helper tenant `ownedBy()` (lihat db/helpers.ts).
 */
export const agents = pgTable(
    'agents',
    {
        id: bigserial('id', {mode: 'number'}).primaryKey(),
        isChatable: boolean('is_chatable').notNull().default(false),
        name: varchar('name', {length: 256}),
        description: text('description'),
        organizationName: varchar('organization_name', {length: 256}),
        organizationDescription: text('organization_description'),
        interactionRules: text('interaction_rules'),
        // Guard prompt-injection: konteks RAG dibingkai sebagai DATA tepercaya-rendah.
        promptInjection: boolean('prompt_injection').notNull().default(true),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, {onDelete: 'cascade'}),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [
        index('agents_user_created').on(t.userId, t.createdAt),
        // findChatableAgent() ambil baris pertama; baris chatable kedua bikin knowledge
        // tak terbaca tanpa error, jadi keunikannya dipaksa di level DB.
        uniqueIndex('agents_is_chatable_uq')
            .on(t.isChatable)
            .where(sql`${t.isChatable}`),
    ],
)
