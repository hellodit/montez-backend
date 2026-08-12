import { z } from 'zod'

export const HooksOutput = z.object({
  hooks: z.array(
    z.object({
      rank: z.number().int().positive(),
      pattern_type: z.string(),
      hook_text: z.string(),
      word_count: z.number().int().nonnegative(),
      instinct_triggers: z.array(z.string()),
      rationale: z.string(),
      insight_backing: z.string().optional(),
    }),
  ),
})

export type HooksOutput = z.infer<typeof HooksOutput>
