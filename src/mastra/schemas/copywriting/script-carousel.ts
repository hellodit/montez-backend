import { z } from 'zod'

const CarouselProductionSlide = z.object({
  position: z.number().int().positive(),
  role: z.enum(['cover', 'second_hook', 'body', 'cta']),
  headline: z.string(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  imageKeyword: z.string().optional(),
  imageSource: z.string().optional(),
  imageStyle: z.string().optional(),
  swipeText: z.string().optional(),
  ctaType: z.string().optional(),
  ctaText: z.string().optional(),
})

export const ScriptCarouselOutput = z.object({
  format: z.string(),
  platform: z.enum(['instagram', 'linkedin', 'both']),
  slideCount: z.number().int().min(5).max(20),
  dataDepth: z.enum(['general', 'trending']),
  slides: z.array(CarouselProductionSlide),
  caption: z.string(),
  hashtags: z.array(z.string()),
  franchiseSuggestions: z.array(z.string()).min(3).max(5),
  assumptions: z.array(z.string()).optional(),
})

export type ScriptCarouselOutput = z.infer<typeof ScriptCarouselOutput>
