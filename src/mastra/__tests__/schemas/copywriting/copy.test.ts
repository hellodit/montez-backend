import { describe, expect, it } from 'bun:test'
import { CopyOutput } from '../../../schemas/copywriting/copy'

describe('CopyOutput', () => {
  it('parses a valid caption object', () => {
    const r = CopyOutput.parse({
      content_type: 'caption',
      framework: 'HEIA',
      copy: 'Hook line.\n\nBody copy.\n\nCTA line.',
      rationale: 'Uses a WTF hook to target the Lizard Brain; 3 instincts triggered.',
      hashtags: ['#niche1', '#niche2', '#broad1', '#broad2', '#brand'],
      seo_first_line: 'Cara scroll-stopping caption yang bikin follower nempel',
    })
    expect(r.content_type).toBe('caption')
    expect(r.framework).toBe('HEIA')
    expect(r.hashtags).toHaveLength(5)
  })

  it('parses a valid carousel object with structured slides', () => {
    const r = CopyOutput.parse({
      content_type: 'carousel',
      framework: 'PAS',
      copy: '[{"position":1,"headline":"Cover"}]',
      rationale: 'PAS matches the sales goal.',
      carousel: [
        { position: 1, headline: 'Cover slide' },
        { position: 2, headline: 'Value 1', body: 'Two sentences max.' },
      ],
    })
    expect(r.carousel?.[0]?.position).toBe(1)
  })

  it('parses without optional fields (hashtags/seo_first_line/carousel/assumptions)', () => {
    const r = CopyOutput.parse({
      content_type: 'ebook',
      framework: 'BAB',
      copy: '<h3>Section</h3><p>Body</p>',
      rationale: 'Before-after-bridge for a transformation story.',
    })
    expect(r.hashtags).toBeUndefined()
    expect(r.carousel).toBeUndefined()
  })

  it('rejects an invalid content_type', () => {
    expect(() =>
      CopyOutput.parse({
        content_type: 'video',
        framework: 'HEIA',
        copy: 'x',
        rationale: 'x',
      }),
    ).toThrow()
  })

  it('rejects an invalid framework', () => {
    expect(() =>
      CopyOutput.parse({
        content_type: 'caption',
        framework: 'AIDA',
        copy: 'x',
        rationale: 'x',
      }),
    ).toThrow()
  })

  it('rejects a missing rationale', () => {
    expect(() =>
      CopyOutput.parse({
        content_type: 'caption',
        framework: 'HEIA',
        copy: 'x',
      }),
    ).toThrow()
  })
})
