import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { generateHooks } from '../../agents/copywriting/hooks-writer'

export const writeHooksTool = createTool({
  id: 'write-hooks',
  description:
    'Generate 5 ranked scroll-stopping short-form hook candidates for a topic/audience/goal, using cognitive pattern frameworks and instinct triggers.',
  inputSchema: z.object({
    topic: z.string(),
    audience: z.string(),
    goal: z.string().optional(),
    language: z.string().optional(),
    tonePreference: z.string().optional(),
  }),
  execute: async (input) => {
    const res = await generateHooks(input)
    return res.data
  },
})
