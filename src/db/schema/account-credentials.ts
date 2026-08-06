import { bigint, bigserial, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { socialAccounts } from './accounts'
import { CREDENTIAL_PROVIDER } from '../constants'

// Token Meta disimpan apa adanya (plaintext) — keputusan owner. ig business id bukan rahasia.
export const accountCredentials = pgTable(
  'account_credentials',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    accountId: bigint('account_id', { mode: 'number' })
      .notNull()
      .references(() => socialAccounts.id),
    provider: text('provider').notNull().default(CREDENTIAL_PROVIDER.meta),
    accessToken: text('access_token').notNull(),
    metaIgBusinessId: text('meta_ig_business_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('account_credentials_account').on(t.accountId)],
)
