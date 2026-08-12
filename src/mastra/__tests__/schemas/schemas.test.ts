import { describe, expect, it } from 'bun:test'
import { VisionOutput } from './vision'
import { ScriptOutput } from './script'
import { SentimentOutput } from './sentiment'

const validVisual = {
  format: 'talking_head',
  camera_angle: 'closeup',
  background: 'studio',
  color_grading_style: 'natural',
  production_level: 'mid_range',
  audio_type: 'on_camera',
  creator_visible_in_video: true,
}

describe('VisionOutput', () => {
  it('parses valid vision object', () => {
    const r = VisionOutput.parse({
      timeline: [{ t: 0.5, event: 'hook', desc: 'text explodes on black' }],
      visual: validVisual,
    })
    expect(r.visual.format).toBe('talking_head')
    expect(r.timeline.length).toBe(1)
  })
  it('rejects wrong type on a core field', () => {
    expect(() =>
      VisionOutput.parse({ timeline: [], visual: { ...validVisual, format: 123 } }),
    ).toThrow()
  })
})

const validScript = {
  hook_type: 'question',
  kasta_hook: 'killer',
  hook_strength: 8,
  structure: 'story_arc',
  emotional_arc: 'curiosity_to_satisfaction',
  tone: 'educational',
  cta_type: 'comment_bait',
  why_it_works: 'Activates curiosity gap by teasing an outcome.',
  psychological_mechanism: 'curiosity_gap',
}

describe('ScriptOutput', () => {
  it('parses valid script object', () => {
    const r = ScriptOutput.parse(validScript)
    expect(r.kasta_hook).toBe('killer')
    expect(r.hook_strength).toBe(8)
  })
  it('rejects wrong type on a core field', () => {
    expect(() => ScriptOutput.parse({ ...validScript, hook_strength: 'high' })).toThrow()
  })
})

describe('SentimentOutput', () => {
  it('parses and applies defaults', () => {
    const r = SentimentOutput.parse({ sentiment: 'positive', sentiment_positive_pct: 72 })
    expect(r.buying_signal_count).toBe(0)
    expect(r.themes).toEqual([])
  })
  it('rejects invalid sentiment enum', () => {
    expect(() =>
      SentimentOutput.parse({ sentiment: 'happy', sentiment_positive_pct: null }),
    ).toThrow()
  })
})
