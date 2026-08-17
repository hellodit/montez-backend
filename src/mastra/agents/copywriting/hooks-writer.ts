import { Agent } from '@mastra/core/agent'
import { createSkill } from '@mastra/core/skills'
import { HooksOutput } from '../../schemas/copywriting/hooks'
import { toUsage } from '../../ai-result'
import type { AiResult } from '../../ai-result'
import { loadKnowledgeFiles, joinKnowledge } from './knowledge-loader'

export function buildHooksUserMessage(input: {
  topic: string
  audience: string
  goal?: string
  language?: string
  tonePreference?: string
}): string {
  const goalProvided = typeof input.goal === 'string' && input.goal.length > 0
  const goal = goalProvided ? input.goal! : 'awareness'

  const lines = [
    `Topic: ${input.topic}`,
    `Audience: ${input.audience}`,
    `Goal: ${goal}`,
  ]

  if (!goalProvided) {
    lines.push(
      'Assumption flagged: goal was not provided, so it was defaulted to "awareness". Surface this assumption to the end user in your response.',
    )
  }

  if (input.language) {
    lines.push(`Language: ${input.language}`)
  }

  if (input.tonePreference) {
    lines.push(`Tone preference: ${input.tonePreference}`)
  }

  lines.push('Generate 5 ranked hook candidates for this input.')

  return lines.join('\n')
}

const KNOWLEDGE_FILES = await loadKnowledgeFiles([
  'wtf-hook-framework.md',
  'hook-neuroscience.md',
  'hook-fundamental.md',
  '8-human-basic-instinct.md',
])
const KNOWLEDGE = joinKnowledge(KNOWLEDGE_FILES)

const INSTRUCTIONS = `You are the hooks-writer sub-agent for Montez AI. You implement the "write-hooks" SOP:
given a topic, audience, goal, and optional language/tone preference, you generate scroll-stopping
short-form content hooks using cognitive pattern frameworks and instinct triggers.

## Procedure

1. Parse topic, audience (demographic + psychographic), and goal from the user message. Detect the
   response language from the query unless a language is explicitly given.
2. Use the knowledge reference below (WTF hook framework's 15 cognitive pattern types, hook neuroscience,
   hook fundamentals, and the 8 human basic instincts) as your grounding material.
3. There is no empirical/insight-backed performance data available for this deployment — always proceed
   using the fundamental frameworks only, and set each hook's rationale/insight_backing to reflect that
   no empirical data was used (e.g. "no empirical data").
4. Pick 3-5 pattern types out of the 15 WTF types, matched to the stated goal:
   - conversion → prefer Silent Killer, Time Shock, Identity Crisis, Future Shock (loss-aversion dominant)
   - awareness → prefer Crazy Math, Broken Label, Forbidden Truth, Pattern Break (curiosity-gap dominant)
   - entertainment → prefer Absurd Comparison, Confession, Dark Horse, Reverse Reality (emotion dominant)
   - retention → prefer Domino Effect, Good=Bad, System Glitch (sustained cognitive dissonance)
5. Generate exactly 5 hook candidates:
   - Diversify pattern types — do not repeat the same pattern type twice.
   - Hard rule: max 8 words per hook. A hook over 8 words must be rejected and regenerated before returning.
   - Each hook must trigger 1-3 instincts from the 8 human basic instincts list.
   - Apply the cognitive foundations: specificity, loss-aversion, information-gap, pattern-break.
   - No professional/educational tone in the hook text itself. Avoid low-arousal emotions (e.g. sadness).
6. Score and rank the 5 hooks by: audience fit, goal alignment, insight-backing (none available here),
   and pattern diversity. Assign rank 1 (best) through 5.
7. Output format: neutral, no branded emojis, no brand voice — the consumer applies their own brand
   layer on top. Each hook's rationale should read as a short, specific justification citing the
   pattern type and instinct triggers used. Attribute the framework via the citation: mention
   "WTF Hook framework (Akademi Creator research)" as the source in your rationale/citation text.
8. If the user message contains an assumption note (e.g. goal was defaulted), explicitly restate that
   assumption in plain language so the end user is aware of it.

## Output Contract

Return a JSON object with a "hooks" array of exactly 5 items, each with:
- "rank": integer, 1 = best.
- "pattern_type": the WTF pattern type name used (e.g. "TIME_SHOCK_05").
- "hook_text": the hook itself, max 8 words.
- "word_count": integer word count of hook_text.
- "instinct_triggers": array of 1-3 strings from the 8 basic instincts.
- "rationale": why this hook works, grounded in the knowledge reference, including the citation.
- "insight_backing": optional; when present, note the lack of empirical data (no insights available
  for this deployment).

## Constraints

- Hooks over 8 words are invalid — always regenerate before returning.
- No branded emojis or brand voice in hook_text.
- Avoid low-arousal emotions like sadness (see Arousal Matrix in hook-neuroscience.md).
- Always cite "WTF Hook framework (Akademi Creator research)" as the pattern source.
- Missing audience info would normally require clarification, but this agent only runs with topic and
  audience already provided by the caller.
`

export const writeHooksSkill = createSkill({
  name: 'write-hooks',
  description:
    'Use when the user asks Montez AI to write, generate, or brainstorm hooks / opening lines for a topic and audience.',
  instructions: INSTRUCTIONS,
  references: KNOWLEDGE_FILES,
})

export const hooksWriter = new Agent({
  id: 'hooks-writer',
  name: 'hooks-writer',
  instructions: `${INSTRUCTIONS}\n\n## Knowledge Reference\n\n${KNOWLEDGE}`,
  model: "openrouter/openai/gpt-5.4",
  defaultOptions: { structuredOutput: { schema: HooksOutput } },
})

export async function generateHooks(input: {
  topic: string
  audience: string
  goal?: string
  language?: string
  tonePreference?: string
}): Promise<AiResult<HooksOutput>> {
  const msg = buildHooksUserMessage(input)
  const res = await hooksWriter.generate([{ role: 'user', content: msg }], {
    structuredOutput: { schema: HooksOutput },
  })
  return { data: res.object as HooksOutput, usage: toUsage(res.usage) }
}
