import { describe, expect, it } from 'bun:test'
import { ScriptLongvidOutput } from '../../../schemas/copywriting/script-longvid'

const bulletOnly = {
  title: 'Kenapa Skincare Kamu Gagal',
  durationTarget: '8-12',
  outputMode: 'bullet_only',
  chapters: [
    {
      position: 1,
      chapterTitle: 'Intro — masalah utama',
      startMinute: 0,
      endMinute: 1.5,
      content: '- Hook: kamu udah salah dari step 1\n- Kenapa chapter ini ada: bangun tension awal',
    },
    {
      position: 2,
      chapterTitle: 'Mitos yang harus dibongkar',
      startMinute: 1.5,
      endMinute: 4,
      content: '- 3 mitos populer\n- Data pendukung tiap mitos',
    },
  ],
}

const fullProd = {
  ...bulletOnly,
  outputMode: 'full_prod',
  cta: 'Share ke temen yang masih percaya mitos ini.',
  caption: 'Hook line SEO-rich.\n\nBody.\n\nMicro-CTA.',
  hashtags: Array.from({ length: 12 }, (_, i) => `#tag${i + 1}`),
  youtubeChapters: [
    { timestamp: '0:00', title: 'Intro' },
    { timestamp: '1:30', title: 'Mitos yang harus dibongkar' },
  ],
  videoDescription: 'Full description dengan sources.',
  thumbnailHeadlines: [
    'Kamu Salah dari Step 1',
    'Mitos Skincare Ini Bahaya',
    'Stop Pakai Ini Sekarang',
  ],
  seoTitleOptions: [
    'Kenapa Skincare Kamu Gagal (Ini Alasannya)',
    'Mitos Skincare yang Bikin Kulit Rusak',
  ],
  youtubeTags: ['skincare', 'skincare routine', 'skincare tips indonesia'],
  contentRecommendations: ['Sequel: rutin pagi', 'Sequel: produk overrated', 'Sequel: budget skincare'],
}

describe('ScriptLongvidOutput', () => {
  it('parses a minimal bullet_only object', () => {
    const r = ScriptLongvidOutput.parse(bulletOnly)
    expect(r.outputMode).toBe('bullet_only')
    expect(r.chapters).toHaveLength(2)
    expect(r.cta).toBeUndefined()
  })

  it('parses a full full_prod object with all 11 sections', () => {
    const r = ScriptLongvidOutput.parse(fullProd)
    expect(r.outputMode).toBe('full_prod')
    expect(r.hashtags?.length).toBeGreaterThanOrEqual(10)
    expect(r.thumbnailHeadlines?.length).toBeGreaterThanOrEqual(3)
    expect(r.contentRecommendations?.length).toBeGreaterThanOrEqual(3)
  })

  it('rejects an invalid outputMode', () => {
    expect(() => ScriptLongvidOutput.parse({ ...bulletOnly, outputMode: 'video_only' })).toThrow()
  })

  it('rejects a missing chapters array', () => {
    const { chapters, ...rest } = bulletOnly
    expect(() => ScriptLongvidOutput.parse(rest)).toThrow()
  })
})
