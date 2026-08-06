// Bentuk hasil panggilan AI + usage token (untuk pencatatan token cost audit).
// TokenUsage dimiliki packages/db — ia kontrak kolom `chat_messages.metadata`,
// jadi didefinisikan sekali di sana lalu di-re-export di sini.
import type { TokenUsage } from '@montez-tstack/db/constants'

export type { TokenUsage }

export type AiResult<T> = { data: T; usage: TokenUsage }

export function toUsage(u: unknown): TokenUsage {
  const x = (u ?? {}) as Record<string, unknown>
  return {
    inputTokens: typeof x.inputTokens === 'number' ? x.inputTokens : undefined,
    outputTokens: typeof x.outputTokens === 'number' ? x.outputTokens : undefined,
    totalTokens: typeof x.totalTokens === 'number' ? x.totalTokens : undefined,
  }
}
