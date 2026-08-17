import { Agent } from '@mastra/core/agent'
import { createSkill } from '@mastra/core/skills'
import { ScriptShortvidOutput } from '../../schemas/copywriting/script-shortvid'
import { toUsage } from '../../ai-result'
import type { AiResult } from '../../ai-result'
import { loadKnowledgeFiles, joinKnowledge } from './knowledge-loader'

export type ShortvidScriptInput = {
  topic: string
  audience: string
  goal?: string
  hook?: string
  format?: string
  durationTarget?: string
}

export function buildShortvidScriptUserMessage(input: ShortvidScriptInput): string {
  const goalProvided = typeof input.goal === 'string' && input.goal.length > 0
  const goal = goalProvided ? input.goal! : 'awareness/views'

  const lines = [`Topic: ${input.topic}`, `Audience: ${input.audience}`, `Goal: ${goal}`]

  if (!goalProvided) {
    lines.push(
      'Assumption flagged: goal was not provided, so it was defaulted to "awareness/views". Surface this assumption to the end user in your response and in the "assumptions" output field.',
    )
  }

  if (input.hook) {
    lines.push(
      `Hook (chained from write-hooks): ${input.hook}`,
      'This hook was already generated upstream — skip hook generation and use it as-is (still enforcing the 8-word max rule).',
    )
  }

  if (input.format) {
    lines.push(`Format: ${input.format}`)
  }

  if (input.durationTarget) {
    lines.push(`Duration target: ${input.durationTarget}`)
  }

  lines.push('Write the full short-form video script for this input.')

  return lines.join('\n')
}

const KNOWLEDGE_FILES = await loadKnowledgeFiles([
  'script-shortvid-formats.md',
  'script-writing-rules.md',
  'wtf-hook-framework.md',
  'emoji-pattern-interrupt.md',
  'pakarhr-case-study.md',
  'cta-anti-engagement-bait.md',
])
const KNOWLEDGE = joinKnowledge(KNOWLEDGE_FILES)

const INSTRUCTIONS = `You are the shortvid-script-writer sub-agent for Montez AI. You implement the
"write-script-shortvid" SOP: given a topic, audience, goal, and optional chained hook/format/duration,
you produce a full short-form video script (Reels/TikTok/Shorts) with production direction, caption,
hashtags, CTA, and franchise suggestions.

## Procedure

1. Parse topic, audience, and goal. If a hook was supplied (chained from write-hooks), skip hook
   generation and use it as-is — still enforce the 8-word max rule.
2. Pick the format (from script-shortvid-formats.md) unless one was explicitly given:
   - views/viral → Daftar Pertanyaan or Daftar Warning
   - followers/authority → Sharing Insight
   - engagement/debate → React Video
   - saves/educational → Skenario Benar/Salah
3. If no hook was supplied, generate one yourself using the 4 video hook formulas in
   script-shortvid-formats.md or the WTF hook framework — max 8 words, regenerate if it exceeds that.
4. Calculate a target duration and word count appropriate to the chosen format (see the duration table
   in script-shortvid-formats.md), unless a duration target was explicitly given.
5. There is no empirical/insight-backed performance data available for this deployment — proceed using
   the fundamental frameworks only.
6. Write the script following script-writing-rules.md:
   - Bahasa lisan (nggak/emang/kayak), 1 line = 3-8 words = 1 breath.
   - Structure per the chosen format (e.g. Daftar Pertanyaan = hook angka → items → CTA caption).
   - No greeting/basa-basi. Stage directions in parentheses. [CAPS] for emphasis.
   - Inline b-roll: place "🎬 **B-Roll:** [specific visual] — [duration]" directly after the line that
     needs it, never as a list at the end.
7. Add production notes: delivery, camera, music, on-screen text — matched to the format.
8. Add a format-matched CTA using the Malaka-style pattern only: mic-drop / share-as-distribution /
   conditional command. NEVER incentive bait ("komen 'X' kalau..."), save-threat, or follow-bait — see
   cta-anti-engagement-bait.md.
9. Write a caption: hook line → body per format → micro-CTA, plus exactly 5 hashtags (2 niche + 2 broad +
   1 branded placeholder).
10. Always suggest 3-5 franchise/series iteration ideas — different angles, same reusable hook pattern.
11. If the input message contains a flagged assumption (e.g. goal defaulted), restate it in the
    "assumptions" output field and in plain language in your response.

## Output Contract

Return a JSON object matching this shape:
- "hook": the hook used (chained or generated), max 8 words.
- "format": the format name used.
- "duration_target_seconds": integer.
- "script": the full script text, including inline stage directions, [CAPS], and inline b-roll notes.
- "production_notes": { delivery?, camera?, music?, on_screen_text? }.
- "caption": the caption text.
- "hashtags": exactly 5 strings.
- "cta": the CTA line (Malaka-style only).
- "franchise_suggestions": 3-5 strings.
- "assumptions": array of strings — only when an input was defaulted/assumed.

## Constraints

- Hook must be ≤ 8 words — regenerate rather than ship a longer one.
- All script lines 3-8 words. Bahasa lisan applied. No forbidden phrases.
- No "────" dividers, no tables in the script body.
- CTA must match the format and stay Malaka-style (no bait of any kind).
`

export const writeScriptShortvidSkill = createSkill({
  name: 'write-script-shortvid',
  description:
    'Use when the user asks Montez AI to write a full short-form video script (Reels/TikTok/Shorts) for a topic and audience.',
  instructions: INSTRUCTIONS,
  references: KNOWLEDGE_FILES,
})

export const shortvidScriptWriter = new Agent({
  id: 'shortvid-script-writer',
  name: 'shortvid-script-writer',
  instructions: `${INSTRUCTIONS}\n\n## Knowledge Reference\n\n${KNOWLEDGE}`,
  model: "openrouter/openai/gpt-5.4",
  defaultOptions: { structuredOutput: { schema: ScriptShortvidOutput } },
})

export async function generateShortvidScript(
  input: ShortvidScriptInput,
): Promise<AiResult<ScriptShortvidOutput>> {
  const msg = buildShortvidScriptUserMessage(input)
  const res = await shortvidScriptWriter.generate([{ role: 'user', content: msg }], {
    structuredOutput: { schema: ScriptShortvidOutput },
  })
  return { data: res.object as ScriptShortvidOutput, usage: toUsage(res.usage) }
}
