import { z } from 'zod'
import { Agent } from '@mastra/core/agent'
import { scriptModel } from '../providers'
import { SentimentOutput } from '../schemas/sentiment'
import { countSignals } from "../lib/comment-signals"
import { toUsage } from '../ai-result'
import type { AiResult } from '../ai-result'

// AI mengklasifikasi sentimen agregat + tema; jumlah sinyal buying/follow/desire
// dihitung deterministik lewat keyword (port sistem lama) agar konsisten.
const SENTIMENT_INSTRUCTIONS = `You analyze the aggregate sentiment of a list of social media comments on a single post.
Return a JSON object with EXACTLY these fields:
- "sentiment": one of "positive", "neutral", "negative" — the dominant overall tone across all comments; null if it cannot be judged.
- "sentiment_positive_pct": decimal 0-100 estimating the percentage of comments that are positive; null if unknown.
- "themes": array of 2-5 recurring theme keywords across the comments (e.g. ["pricing","tutorial_request","praise"]). Empty array if none.
Judge the collective mood, not individual comments. Return ONLY the JSON object.`

const SentimentAiSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  sentiment_positive_pct: z.number().nullable(),
  themes: z.array(z.string()).default([]),
})

export const sentimentAnalyzer = new Agent({
  id: 'sentiment-analyzer',
  name: 'sentiment-analyzer',
  instructions: SENTIMENT_INSTRUCTIONS,
  model: scriptModel,
  // Structured output ditegakkan di level agent (schema Zod) — bukan hanya per-call.
  defaultOptions: { structuredOutput: { schema: SentimentAiSchema } },
})

export async function analyzeSentiment(
  comments: string[],
): Promise<AiResult<SentimentOutput> | null> {
  if (comments.length === 0) return null

  const sample = comments.slice(0, 100).map((c) => c.slice(0, 300))
  const counts = countSignals(sample)

  const res = await sentimentAnalyzer.generate(
    [
      {
        role: 'user',
        content: `Comments (${sample.length}):\n${sample.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
      },
    ],
    { structuredOutput: { schema: SentimentAiSchema } },
  )
  const ai = res.object as z.infer<typeof SentimentAiSchema>

  const data: SentimentOutput = {
    sentiment: ai.sentiment,
    sentiment_positive_pct: ai.sentiment_positive_pct,
    themes: ai.themes ?? [],
    buying_signal_count: counts.buying,
    follow_signal_count: counts.follow,
    desire_signal_count: counts.desire,
  }
  return { data, usage: toUsage(res.usage) }
}
