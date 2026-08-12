import { z } from 'zod'

const CarouselSlide = z.object({
  position: z.number().int().positive(),
  headline: z.string(),
  subheadline: z.string().nullable(),
  body: z.string().nullable(),
  stat_number: z.string().nullable(),
  stat_unit: z.string().nullable(),
  stat_label: z.string().nullable(),
  source: z.string().nullable(),
  quote_text: z.string().nullable(),
  quote_author: z.string().nullable(),
  cta_text: z.string().nullable(),
  list_items: z.array(z.string()).nullable(),
})

export const CopyOutput = z.object({
  content_type: z.enum(['caption', 'carousel', 'ebook', 'ad', 'bio']),
  framework: z.enum(['HEIA', 'PAS', 'BAB']),
  copy: z.string(),
  rationale: z.string(),
  hashtags: z.array(z.string()).nullable(),
  seo_first_line: z.string().nullable(),
  carousel: z.array(CarouselSlide).nullable(),
  assumptions: z.array(z.string()).nullable(),
})

export type CopyOutput = z.infer<typeof CopyOutput>
