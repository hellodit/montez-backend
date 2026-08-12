import { describe, expect, it } from 'bun:test'
import { buildLongvidScriptUserMessage } from '../../../agents/copywriting/longvid-script-writer'

describe('buildLongvidScriptUserMessage', () => {
  it('includes the key required inputs', () => {
    const msg = buildLongvidScriptUserMessage({
      topic: 'kenapa skincare kamu gagal',
      audienceLevel: 'beginner',
      durationTarget: '8-12',
      deepResearch: false,
      outputMode: 'full_prod',
    })
    expect(msg).toContain('kenapa skincare kamu gagal')
    expect(msg).toContain('beginner')
    expect(msg).toContain('8-12')
    expect(msg).toContain('full_prod')
  })

  it('defaults videoStyle to campuran and flags the assumption', () => {
    const msg = buildLongvidScriptUserMessage({
      topic: 'x',
      audienceLevel: 'intermediate',
      durationTarget: '8-12',
      deepResearch: false,
      outputMode: 'full_prod',
    })
    expect(msg).toContain('campuran')
    expect(msg.toLowerCase()).toContain('assumption')
  })

  it('notes deepResearch as a flag rather than performing live research', () => {
    const msg = buildLongvidScriptUserMessage({
      topic: 'x',
      audienceLevel: 'intermediate',
      durationTarget: '8-12',
      deepResearch: true,
      outputMode: 'full_prod',
    })
    expect(msg.toLowerCase()).toContain('deep research')
  })

  it('is a single synchronous call — no interview/approval round-trip note', () => {
    const msg = buildLongvidScriptUserMessage({
      topic: 'x',
      audienceLevel: 'intermediate',
      durationTarget: '8-12',
      deepResearch: false,
      outputMode: 'bullet_only',
    })
    expect(msg.toLowerCase()).toContain('single')
  })
})
