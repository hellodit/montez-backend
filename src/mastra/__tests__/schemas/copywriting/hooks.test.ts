import { describe, expect, it } from 'bun:test'
import { HooksOutput } from '../../../schemas/copywriting/hooks'

describe('HooksOutput', () => {
  it('parses a valid object', () => {
    const r = HooksOutput.parse({
      hooks: [
        {
          rank: 1,
          pattern_type: 'TIME_SHOCK_05',
          hook_text: 'You have 5 seconds before this fails',
          word_count: 8,
          instinct_triggers: ['pride', 'fear'],
          rationale: 'Creates urgency via loss-aversion framing.',
          insight_backing: 'no empirical data',
        },
      ],
    })
    expect(r.hooks[0]!.rank).toBe(1)
    expect(r.hooks[0]!.instinct_triggers).toEqual(['pride', 'fear'])
  })

  it('parses a valid object without the optional insight_backing field', () => {
    const r = HooksOutput.parse({
      hooks: [
        {
          rank: 2,
          pattern_type: 'CRAZY_MATH_02',
          hook_text: '99% of people get this wrong',
          word_count: 6,
          instinct_triggers: ['curiosity'],
          rationale: 'Numeric specificity triggers curiosity gap.',
        },
      ],
    })
    expect(r.hooks[0]!.insight_backing).toBeUndefined()
  })

  it('rejects an object with a non-string hook_text', () => {
    expect(() =>
      HooksOutput.parse({
        hooks: [
          {
            rank: 1,
            pattern_type: 'TIME_SHOCK_05',
            hook_text: 12345,
            word_count: 8,
            instinct_triggers: ['pride'],
            rationale: 'x',
          },
        ],
      }),
    ).toThrow()
  })

  it('rejects an object with a wrong-typed word_count', () => {
    expect(() =>
      HooksOutput.parse({
        hooks: [
          {
            rank: 1,
            pattern_type: 'TIME_SHOCK_05',
            hook_text: 'Some short hook here',
            word_count: 'eight',
            instinct_triggers: ['pride'],
            rationale: 'x',
          },
        ],
      }),
    ).toThrow()
  })
})
