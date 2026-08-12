import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { generateCarouselScript } from '../../agents/copywriting/carousel-script-writer'

export const writeScriptCarouselTool = createTool({
  id: 'write-script-carousel',
  description:
    'Generate a copy-paste-ready carousel production sheet (IG/LinkedIn) with labeled slide elements (HEADLINE, BODY, IMAGE KEYWORD, SWIPE TEXT), cover + second hook + progressive CTA.',
  inputSchema: z.object({
    topic: z.string(),
    audience: z.string(),
    format: z.enum(['edukasi', 'jualan', 'storytelling', 'data-stat', 'listicle']),
    platform: z.enum(['instagram', 'linkedin', 'both']),
    dataDepth: z.enum(['general', 'trending']),
    hook: z.string().optional(),
    slideCount: z.number().int().optional(),
    material: z.string().optional(),
    deepResearch: z.boolean().optional(),
  }),
  execute: async (input) => {
    const res = await generateCarouselScript(input)
    return res.data
  },
})
