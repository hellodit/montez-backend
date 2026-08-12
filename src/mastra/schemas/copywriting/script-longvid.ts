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
  cta: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  youtubeChapters: z.array(z.object({ timestamp: z.string(), title: z.string() })).optional(),
  videoDescription: z.string().optional(),
  thumbnailHeadlines: z.array(z.string()).optional(),
  seoTitleOptions: z.array(z.string()).optional(),
  youtubeTags: z.array(z.string()).optional(),
  contentRecommendations: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
})

export type ScriptLongvidOutput = z.infer<typeof ScriptLongvidOutput>
