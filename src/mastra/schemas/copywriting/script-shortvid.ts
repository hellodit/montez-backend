import { z } from 'zod'

export const ScriptShortvidOutput = z.object({
  hook: z.string(),
  format: z.string(),
  duration_target_seconds: z.number().int().positive(),
  script: z.string(),
  production_notes: z.object({
    delivery: z.string().nullable(),
    camera: z.string().nullable(),
    music: z.string().nullable(),
    on_screen_text: z.string().nullable(),
  }),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string(),
  franchise_suggestions: z.array(z.string()).min(3).max(5),
  assumptions: z.array(z.string()).nullable(),
})

export type ScriptShortvidOutput = z.infer<typeof ScriptShortvidOutput>
