import { describe, expect, it } from 'bun:test'
import { buildShortvidScriptUserMessage } from '../../../agents/copywriting/shortvid-script-writer'

describe('buildShortvidScriptUserMessage', () => {
  it('includes the key inputs', () => {
    const msg = buildShortvidScriptUserMessage({
      topic: 'skincare scam warning',
      audience: 'wanita 20-30 tahun',
      goal: 'views/viral',
    })
    expect(msg).toContain('skincare scam warning')
    expect(msg).toContain('wanita 20-30 tahun')
    expect(msg).toContain('views/viral')
  })

  it('flags an assumption when goal is missing, defaulting to awareness/views', () => {
    const msg = buildShortvidScriptUserMessage({
      topic: 'x',
      audience: 'y',
    })
    expect(msg).toContain('awareness/views')
    expect(msg.toLowerCase()).toContain('assumption')
  })

  it('passes through an optional chained hook and skips hook generation', () => {
    const msg = buildShortvidScriptUserMessage({
      topic: 'x',
      audience: 'y',
      goal: 'views/viral',
      hook: 'Kamu kena scam ini tanpa sadar',
    })
    expect(msg).toContain('Kamu kena scam ini tanpa sadar')
    expect(msg.toLowerCase()).toContain('skip hook generation')
  })

  it('passes through an optional format and duration_target', () => {
    const msg = buildShortvidScriptUserMessage({
      topic: 'x',
      audience: 'y',
      goal: 'views/viral',
      format: 'Daftar Warning',
      durationTarget: '30-45s',
    })
    expect(msg).toContain('Daftar Warning')
    expect(msg).toContain('30-45s')
  })
})
