import { eq } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

// Satu-satunya sumber filter tenant. Semua query tabel data WAJIB memakai ini.
export const ownedBy = (table: { userId: PgColumn }, userId: string) =>
  eq(table.userId, userId)
