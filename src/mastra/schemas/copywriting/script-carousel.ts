import { z } from 'zod'

const CarouselProductionSlide = z.object({
  position: z.number().int().positive(),
  role: z.enum(['cover', 'second_hook', 'body', 'cta']),
  headline: z.string(),
  subtitle: z.string().nullable(),
  body: z.string().nullable(),
  imageKeyword: z.string().nullable(),
  imageSource: z.string().nullable(),
  imageStyle: z.string().nullable(),
  swipeText: z.string().nullable(),
  ctaType: z.string().nullable(),
  ctaText: z.string().nullable(),
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
  assumptions: z.array(z.string()).nullable(),
})

export type ScriptCarouselOutput = z.infer<typeof ScriptCarouselOutput>
