import { describe, expect, it } from 'bun:test'
import { ScriptShortvidOutput } from '../../../schemas/copywriting/script-shortvid'

const valid = {
  hook: 'Kamu kena scam ini tanpa sadar',
  format: 'Daftar Warning',
  duration_target_seconds: 30,
  script: '(tunjuk kamera) 3 tanda kamu kena scam skincare...',
  production_notes: {
    delivery: 'energetic, direct to camera',
    camera: 'handheld closeup',
    music: 'trending upbeat',
    on_screen_text: 'big bold captions per point',
  },
  caption: 'Hook line.\n\nMicro-CTA.',
  hashtags: ['#niche1', '#niche2', '#broad1', '#broad2', '#brand'],
  cta: 'Share ini ke temen yang masih pakai skincare abal-abal.',
  franchise_suggestions: ['Warning versi haircare', 'Warning versi makeup', 'Warning versi diet'],
}

describe('ScriptShortvidOutput', () => {
  it('parses a valid full object', () => {
    const r = ScriptShortvidOutput.parse(valid)
    expect(r.format).toBe('Daftar Warning')
    expect(r.hashtags).toHaveLength(5)
    expect(r.franchise_suggestions.length).toBeGreaterThanOrEqual(3)
  })

  it('parses without the optional assumptions field', () => {
    const r = ScriptShortvidOutput.parse(valid)
    expect(r.assumptions).toBeUndefined()
  })

  it('rejects a missing script', () => {
    const { script, ...rest } = valid
    expect(() => ScriptShortvidOutput.parse(rest)).toThrow()
  })

  it('rejects fewer than 3 franchise suggestions', () => {
    expect(() =>
      ScriptShortvidOutput.parse({ ...valid, franchise_suggestions: ['only one'] }),
    ).toThrow()
  })
})
