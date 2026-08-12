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
      carousel: null,
      assumptions: null,
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
      hashtags: null,
      seo_first_line: null,
      assumptions: null,
      carousel: [
        {
          position: 1,
          headline: 'Cover slide',
          subheadline: null,
          body: null,
          stat_number: null,
          stat_unit: null,
          stat_label: null,
          source: null,
          quote_text: null,
          quote_author: null,
          cta_text: null,
          list_items: null,
        },
        {
          position: 2,
          headline: 'Value 1',
          body: 'Two sentences max.',
          subheadline: null,
          stat_number: null,
          stat_unit: null,
          stat_label: null,
          source: null,
          quote_text: null,
          quote_author: null,
          cta_text: null,
          list_items: null,
        },
      ],
    })
    expect(r.carousel?.[0]?.position).toBe(1)
  })

  it('parses with every optional field explicitly null (hashtags/seo_first_line/carousel/assumptions)', () => {
    const r = CopyOutput.parse({
      content_type: 'ebook',
      framework: 'BAB',
      copy: '<h3>Section</h3><p>Body</p>',
      rationale: 'Before-after-bridge for a transformation story.',
      hashtags: null,
      seo_first_line: null,
      carousel: null,
      assumptions: null,
    })
    expect(r.hashtags).toBeNull()
    expect(r.carousel).toBeNull()
  })

  it('rejects a caption object missing a nullable field entirely', () => {
    expect(() =>
      CopyOutput.parse({
        content_type: 'ebook',
        framework: 'BAB',
        copy: '<h3>Section</h3><p>Body</p>',
        rationale: 'Before-after-bridge for a transformation story.',
        hashtags: null,
        seo_first_line: null,
        carousel: null,
        // assumptions omitted entirely — OpenAI strict schemas require every
        // property present (null when unused), never absent.
      }),
    ).toThrow()
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
