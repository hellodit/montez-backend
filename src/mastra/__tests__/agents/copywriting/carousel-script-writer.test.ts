import { describe, expect, it } from 'bun:test'
import { buildCarouselScriptUserMessage } from '../../../agents/copywriting/carousel-script-writer'

describe('buildCarouselScriptUserMessage', () => {
  it('includes the key required inputs', () => {
    const msg = buildCarouselScriptUserMessage({
      topic: 'skincare rutin malam',
      audience: 'wanita 20-30 tahun',
      format: 'edukasi',
      platform: 'instagram',
      dataDepth: 'general',
    })
    expect(msg).toContain('skincare rutin malam')
    expect(msg).toContain('wanita 20-30 tahun')
    expect(msg).toContain('edukasi')
    expect(msg).toContain('instagram')
    expect(msg).toContain('general')
  })

  it('defaults slideCount per platform and flags the assumption', () => {
    const ig = buildCarouselScriptUserMessage({
      topic: 'x',
      audience: 'y',
      format: 'edukasi',
      platform: 'instagram',
      dataDepth: 'general',
    })
    expect(ig).toContain('10')
    expect(ig.toLowerCase()).toContain('assumption')

    const li = buildCarouselScriptUserMessage({
      topic: 'x',
      audience: 'y',
      format: 'edukasi',
      platform: 'linkedin',
      dataDepth: 'general',
    })
    expect(li).toContain('8')
  })

  it('passes through an optional chained hook and skips hook generation', () => {
    const msg = buildCarouselScriptUserMessage({
      topic: 'x',
      audience: 'y',
      format: 'edukasi',
      platform: 'instagram',
      dataDepth: 'general',
      hook: 'Skincare rutin ini salah',
    })
    expect(msg).toContain('Skincare rutin ini salah')
    expect(msg.toLowerCase()).toContain('skip hook generation')
  })

  it('notes deepResearch as a flag rather than performing live research', () => {
    const msg = buildCarouselScriptUserMessage({
      topic: 'x',
      audience: 'y',
      format: 'edukasi',
      platform: 'instagram',
      dataDepth: 'trending',
      deepResearch: true,
    })
    expect(msg.toLowerCase()).toContain('deep research')
  })
})
