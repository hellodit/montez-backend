import { z } from 'zod'

const Chapter = z.object({
  position: z.number().int().positive(),
  chapterTitle: z.string(),
  startMinute: z.number().nonnegative(),
  endMinute: z.number().positive(),
  content: z.string(),
})

export const ScriptLongvidOutput = z.object({
  title: z.string(),
  durationTarget: z.enum(['5-8', '8-12', '12-16', '16-20']),
  outputMode: z.enum(['bullet_only', 'bullet_prod', 'full_script', 'full_prod']),
  chapters: z.array(Chapter),
  cta: z.string().nullable(),
  caption: z.string().nullable(),
  hashtags: z.array(z.string()).nullable(),
  youtubeChapters: z.array(z.object({ timestamp: z.string(), title: z.string() })).nullable(),
  videoDescription: z.string().nullable(),
  thumbnailHeadlines: z.array(z.string()).nullable(),
  seoTitleOptions: z.array(z.string()).nullable(),
  youtubeTags: z.array(z.string()).nullable(),
  contentRecommendations: z.array(z.string()).nullable(),
  assumptions: z.array(z.string()).nullable(),
})

export type ScriptLongvidOutput = z.infer<typeof ScriptLongvidOutput>
