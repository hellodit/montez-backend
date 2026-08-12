import { describe, expect, it } from 'bun:test'
import { ScriptCarouselOutput } from '../../../schemas/copywriting/script-carousel'

const valid = {
  format: 'edukasi',
  platform: 'instagram',
  slideCount: 10,
  dataDepth: 'general',
  slides: [
    {
      position: 1,
      role: 'cover',
      headline: 'Skincare rutin ini salah',
      subtitle: 'Nomor 3 paling sering',
      imageKeyword: 'skincare routine flatlay',
      imageSource: 'Pexels',
      imageStyle: 'minimal',
      swipeText: 'Cek dulu sebelum lanjut >',
    },
    {
      position: 10,
      role: 'cta',
      headline: 'Mau tau rutin yang bener?',
      body: 'Share ke temen yang masih salah pakai.',
      ctaType: 'Share',
      ctaText: 'Share carousel ini',
    },
  ],
  caption: 'Hook line SEO-rich.\n\nBody.\n\nMicro-CTA.',
  hashtags: ['#niche1', '#niche2', '#broad1', '#broad2', '#brand'],
  franchiseSuggestions: ['Angle haircare', 'Angle makeup', 'Angle diet'],
}

describe('ScriptCarouselOutput', () => {
  it('parses a valid full object', () => {
    const r = ScriptCarouselOutput.parse(valid)
    expect(r.platform).toBe('instagram')
    expect(r.slides).toHaveLength(2)
    expect(r.hashtags).toHaveLength(5)
  })

  it('rejects an invalid platform', () => {
    expect(() => ScriptCarouselOutput.parse({ ...valid, platform: 'facebook' })).toThrow()
  })

  it('rejects an invalid slide role', () => {
    expect(() =>
      ScriptCarouselOutput.parse({
        ...valid,
        slides: [{ ...valid.slides[0], role: 'unknown' }],
      }),
    ).toThrow()
  })

  it('rejects fewer than 3 franchise suggestions', () => {
    expect(() =>
      ScriptCarouselOutput.parse({ ...valid, franchiseSuggestions: ['only one'] }),
    ).toThrow()
  })
})
