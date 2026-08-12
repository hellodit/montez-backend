import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { generateCopy } from '../../agents/copywriting/copy-writer'

export const writeCopyTool = createTool({
  id: 'write-copy',
  description:
    'Write caption, carousel, ebook, ad, or bio copy for a topic/audience/goal using the HEIA/PAS/BAB frameworks.',
  inputSchema: z.object({
    topic: z.string(),
    audience: z.string(),
    goal: z.string().optional(),
    contentType: z.enum(['caption', 'carousel', 'ebook', 'ad', 'bio']),
    frameworkPreference: z.enum(['HEIA', 'PAS', 'BAB']).optional(),
  }),
  execute: async (input) => {
    const res = await generateCopy(input)
    return res.data
  },
})
