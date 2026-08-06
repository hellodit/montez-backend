import { z } from 'zod'

export const RecommendationsOutput = z.object({
  summary: z.string(),
  recommendations: z.array(
    z.object({
      title: z.string(),
      rationale: z.string(),
      basedOnPatterns: z.array(z.string()),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
})

export type RecommendationsOutput = z.infer<typeof RecommendationsOutput>
