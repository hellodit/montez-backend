import { Agent } from '@mastra/core/agent'
import { scriptModel } from '../providers'
import { RecommendationsOutput } from '../schemas/recommendations'
import { toUsage } from '../ai-result'
import type { AiResult } from '../ai-result'

const INSTRUCTIONS = `You are a content strategist. You turn quantitative content patterns (feature → performance,
with lift and confidence) and top viral examples from one creator's account into concrete, actionable
recommendations that will raise their reach.
Return a JSON object with:
- "summary": 1-2 sentences describing what drives this account's best-performing content.
- "recommendations": array of items, each with:
  - "title": a short imperative recommendation (e.g. "Lead reels with a 'wtf' hook").
  - "rationale": why it works, grounded in the given patterns/examples. Be specific.
  - "basedOnPatterns": array of the patternName strings this recommendation is based on.
  - "priority": "high" | "medium" | "low" (weight by lift × confidence).
Prioritise patterns with high lift AND high confidence. All output in English.`

export const recommendationsAnalyzer = new Agent({
  id: 'recommendations-analyzer',
  name: 'recommendations-analyzer',
  instructions: INSTRUCTIONS,
  model: scriptModel,
  defaultOptions: { structuredOutput: { schema: RecommendationsOutput } },
})

export async function analyzeRecommendations(input: {
  accountUsername: string
  patterns: Array<{
    patternName: string
    avgViews: number
    lift: number
    confidence: number
    sampleSize: number
  }>
  topExamples: Array<{ kastaHook: string | null; whyItWorks: string | null; views: number }>
}): Promise<AiResult<RecommendationsOutput>> {
  const patternLines = input.patterns
    .map(
      (p) =>
        `- ${p.patternName}: avgViews=${Math.round(p.avgViews)}, lift=${p.lift.toFixed(2)}, confidence=${p.confidence.toFixed(2)}, n=${p.sampleSize}`,
    )
    .join('\n')
  const exampleLines = input.topExamples
    .map((e) => `- hook=${e.kastaHook ?? '?'} (${e.views} views): ${e.whyItWorks ?? ''}`)
    .join('\n')
  const userMsg = `Account: @${input.accountUsername}

Discovered patterns (feature → performance):
${patternLines || '(none)'}

Top viral examples:
${exampleLines || '(none)'}

Produce recommendations.`

  const res = await recommendationsAnalyzer.generate([{ role: 'user', content: userMsg }], {
    structuredOutput: { schema: RecommendationsOutput },
  })
  return { data: res.object as RecommendationsOutput, usage: toUsage(res.usage) }
}
