import { z } from 'zod'

export const SentimentOutput = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  sentiment_positive_pct: z.number().nullable(),
  themes: z.array(z.string()).default([]),
  buying_signal_count: z.number().default(0),
  follow_signal_count: z.number().default(0),
  desire_signal_count: z.number().default(0),
})

export type SentimentOutput = z.infer<typeof SentimentOutput>
