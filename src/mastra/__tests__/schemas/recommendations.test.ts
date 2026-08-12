import { describe, expect, it } from 'bun:test'
import { RecommendationsOutput } from '../../schemas/recommendations'

describe('RecommendationsOutput', () => {
  it('parses a valid object', () => {
    const r = RecommendationsOutput.parse({
      summary: 'This account wins with wtf hooks.',
      recommendations: [
        {
          title: 'Lead with a wtf hook',
          rationale: 'Highest lift pattern.',
          basedOnPatterns: ['kastaHook=wtf'],
          priority: 'high',
        },
      ],
    })
    expect(r.recommendations[0]!.priority).toBe('high')
  })

  it('rejects an invalid priority', () => {
    expect(() =>
      RecommendationsOutput.parse({
        summary: 's',
        recommendations: [
          { title: 't', rationale: 'r', basedOnPatterns: [], priority: 'urgent' },
        ],
      }),
    ).toThrow()
  })
})
