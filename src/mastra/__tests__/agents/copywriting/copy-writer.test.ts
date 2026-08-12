import { describe, expect, it } from 'bun:test'
import { buildCopyUserMessage } from '../../../agents/copywriting/copy-writer'

describe('buildCopyUserMessage', () => {
  it('includes the key inputs', () => {
    const msg = buildCopyUserMessage({
      topic: 'skincare rutin malam',
      audience: 'wanita 20-30 tahun, peduli skin health',
      goal: 'conversion',
      contentType: 'caption',
    })
    expect(msg).toContain('skincare rutin malam')
    expect(msg).toContain('wanita 20-30 tahun, peduli skin health')
    expect(msg).toContain('conversion')
    expect(msg).toContain('caption')
  })

  it('flags an assumption when goal is missing, defaulting to awareness', () => {
    const msg = buildCopyUserMessage({
      topic: 'skincare rutin malam',
      audience: 'wanita 20-30 tahun',
      contentType: 'caption',
    })
    expect(msg).toContain('awareness')
    expect(msg.toLowerCase()).toContain('assumption')
  })

  it('passes through an optional framework preference', () => {
    const msg = buildCopyUserMessage({
      topic: 'x',
      audience: 'y',
      goal: 'conversion',
      contentType: 'ad',
      frameworkPreference: 'PAS',
    })
    expect(msg).toContain('PAS')
  })
})
