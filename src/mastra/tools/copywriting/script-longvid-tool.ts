import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { generateLongvidScript } from '../../agents/copywriting/longvid-script-writer'

export const writeScriptLongvidTool = createTool({
  id: 'write-script-longvid',
  description:
    'Generate a long-form YouTube (5-20 min) chapter outline plus script/chapters/description/tags/titles per the requested output_mode. Single-shot version — no interview or outline-approval round-trip.',
  inputSchema: z.object({
    topic: z.string(),
    audienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'custom']),
    durationTarget: z.enum(['5-8', '8-12', '12-16', '16-20']),
    outputMode: z.enum(['bullet_only', 'bullet_prod', 'full_script', 'full_prod']),
    videoStyle: z.string().optional(),
    material: z.string().optional(),
    deepResearch: z.boolean(),
  }),
  execute: async (input) => {
    const res = await generateLongvidScript(input)
    return res.data
  },
})
