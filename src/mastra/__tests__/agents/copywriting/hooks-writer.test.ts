import { describe, expect, it } from 'bun:test'
import { buildHooksUserMessage } from '../../../agents/copywriting/hooks-writer'

describe('buildHooksUserMessage', () => {
  it('includes the topic and audience verbatim', () => {
    const msg = buildHooksUserMessage({
      topic: 'morning routine productivity',
      audience: 'Gen Z office workers, ambitious but burned out',
      goal: 'conversion',
    })
    expect(msg).toContain('morning routine productivity')
    expect(msg).toContain('Gen Z office workers, ambitious but burned out')
    expect(msg).toContain('conversion')
  })

  it('flags an explicit assumption note when goal is omitted, defaulting to awareness', () => {
    const msg = buildHooksUserMessage({
      topic: 'skincare for oily skin',
      audience: 'women 18-25, budget-conscious',
    })
    expect(msg).toContain('awareness')
    expect(msg.toLowerCase()).toMatch(/assum|default/)
  })

  it('does not add an assumption note when goal is explicitly provided', () => {
    const msg = buildHooksUserMessage({
      topic: 'skincare for oily skin',
      audience: 'women 18-25, budget-conscious',
      goal: 'retention',
    })
    expect(msg.toLowerCase()).not.toMatch(/assum|default/)
  })

  it('includes optional language and tonePreference when provided', () => {
    const msg = buildHooksUserMessage({
      topic: 'topic x',
      audience: 'audience y',
      goal: 'entertainment',
      language: 'Indonesian',
      tonePreference: 'casual, playful',
    })
    expect(msg).toContain('Indonesian')
    expect(msg).toContain('casual, playful')
  })
})
