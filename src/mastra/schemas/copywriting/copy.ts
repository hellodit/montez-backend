import { z } from 'zod'

const CarouselSlide = z.object({
  position: z.number().int().positive(),
  headline: z.string(),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  stat_number: z.string().optional(),
  stat_unit: z.string().optional(),
  stat_label: z.string().optional(),
  source: z.string().optional(),
  quote_text: z.string().optional(),
  quote_author: z.string().optional(),
  cta_text: z.string().optional(),
  list_items: z.array(z.string()).optional(),
})

export const CopyOutput = z.object({
  content_type: z.enum(['caption', 'carousel', 'ebook', 'ad', 'bio']),
  framework: z.enum(['HEIA', 'PAS', 'BAB']),
  copy: z.string(),
  rationale: z.string(),
  hashtags: z.array(z.string()).optional(),
  seo_first_line: z.string().optional(),
  carousel: z.array(CarouselSlide).optional(),
  assumptions: z.array(z.string()).optional(),
})

export type CopyOutput = z.infer<typeof CopyOutput>
