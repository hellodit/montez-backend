import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Tabel Better Auth jwt plugin — menyimpan pasangan kunci JWKS.
export const jwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
