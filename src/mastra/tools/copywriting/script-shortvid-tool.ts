import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { generateShortvidScript } from '../../agents/copywriting/shortvid-script-writer'

export const writeScriptShortvidTool = createTool({
  id: 'write-script-shortvid',
  description:
    'Write a full short-form video script (Reels/TikTok/Shorts) with production notes, caption, hashtags, CTA, and franchise suggestions.',
  inputSchema: z.object({
    topic: z.string(),
    audience: z.string(),
    goal: z.string().optional(),
    hook: z.string().optional(),
    format: z.string().optional(),
    durationTarget: z.string().optional(),
  }),
  execute: async (input) => {
    const res = await generateShortvidScript(input)
    return res.data
  },
})
