import { Agent } from '@mastra/core/agent'
import { createSkill } from '@mastra/core/skills'
import { CopyOutput } from '../../schemas/copywriting/copy'
import { toUsage } from '../../ai-result'
import type { AiResult } from '../../ai-result'
import { loadKnowledgeFiles, joinKnowledge } from './knowledge-loader'

export type CopyWriterInput = {
  topic: string
  audience: string
  goal?: string
  contentType: 'caption' | 'carousel' | 'ebook' | 'ad' | 'bio'
  frameworkPreference?: 'HEIA' | 'PAS' | 'BAB'
}

export function buildCopyUserMessage(input: CopyWriterInput): string {
  const goalProvided = typeof input.goal === 'string' && input.goal.length > 0
  const goal = goalProvided ? input.goal! : 'awareness'

  const lines = [
    `Topic: ${input.topic}`,
    `Audience: ${input.audience}`,
    `Goal: ${goal}`,
    `Content type: ${input.contentType}`,
  ]

  if (!goalProvided) {
    lines.push(
      'Assumption flagged: goal was not provided, so it was defaulted to "awareness". Surface this assumption to the end user in your response and in the "assumptions" output field.',
    )
  }

  if (input.frameworkPreference) {
    lines.push(`Framework preference: ${input.frameworkPreference}`)
  }

  lines.push(`Write the ${input.contentType} copy for this input.`)

  return lines.join('\n')
}

const KNOWLEDGE_FILES = await loadKnowledgeFiles([
  'audience-centric.md',
  'voc-research-methods.md',
  'hook-fundamental.md',
  'wtf-hook-framework.md',
  'neuroscience-brain.md',
  '8-human-basic-instinct.md',
  'storytelling-framework.md',
  'sales-copy-formulas.md',
  'copy-sharpening-techniques.md',
  'simplifikasi-kata.md',
  'virality-framework.md',
  'behavioral-design.md',
  'neo-tribe-targeting.md',
  'hashtag-seo-formula.md',
  'cta-anti-engagement-bait.md',
])
const KNOWLEDGE = joinKnowledge(KNOWLEDGE_FILES)

const INSTRUCTIONS = `You are the copy-writer sub-agent for Montez AI. You implement the "write-copy" SOP:
given a topic, audience, goal, and a content_type (caption / carousel / ebook / ad / bio), you produce
copy using the HEIA / PAS / BAB frameworks. Brand voice and format flourishes are applied by the caller,
not you — stay neutral.

## Procedure

1. Identify the audience's tribe, internal tension, and Zero/Hero state from the knowledge reference.
2. Pick a hook kasta (normal / killer / WTF) appropriate to the goal, grounded in hook-fundamental.md and
   wtf-hook-framework.md.
3. Target the Mammal/Lizard brain (neuroscience-brain.md) — avoid pure logic (Human Brain) overload.
4. Trigger a minimum of 3 of the 8 human basic instincts.
5. Pick the framework by goal, unless frameworkPreference is explicitly given in the input — then use that:
   - Education / Authority → HEIA (storytelling-framework.md)
   - Sales / Ad → PAS (sales-copy-formulas.md)
   - Transformation / Testimonial → BAB (sales-copy-formulas.md)
6. Write the draft following the content_type's structure:
   - caption: Hook → Punchline → Empathy → Value/Insight → CTA (plain text)
   - carousel: Cover slide → 3-8 value slides → CTA slide (JSON array matching the carousel schema)
   - ebook: H3 sections with <p> paragraphs (HTML string)
   - ad: PAS structure ending in a CTA (plain text)
   - bio: short plain text bio copy
7. Simplify (simplifikasi-kata.md): remove every word whose removal doesn't change the meaning.
8. Sharpen (copy-sharpening-techniques.md): apply Power Lead, Bucket Brigade, Specificity Ladder, Rhythm.
9. Virality check (virality-framework.md STEPPS, min 3/6) and behavioral-design.md (CTA timing).
10. CTA pattern MUST be Malaka-style per cta-anti-engagement-bait.md: mic-drop / share-as-distribution /
    conditional command. NEVER incentive bait, save-threat, or follow-bait.
11. For caption/ad content_type only: produce 5 hashtags (2 niche + 2 broad + 1 branded placeholder) via
    hashtag-seo-formula.md, and a keyword-rich seo_first_line.
12. There is no empirical/insight-backed performance data available for this deployment — proceed using
    the fundamental frameworks only.
13. If the input message contains a flagged assumption (e.g. goal defaulted), restate it in the
    "assumptions" output field and in plain language in your response.

## Output Contract

Return a JSON object matching this shape:
- "content_type": one of caption / carousel / ebook / ad / bio (echo the input's content_type).
- "framework": one of HEIA / PAS / BAB (whichever you used).
- "copy": the copy itself — plain text for caption/ad/bio, HTML string for ebook, a JSON-stringified
  array of carousel slides for carousel content_type (in addition to the structured "carousel" field).
- "rationale": why this framework/approach works for this input, citing the knowledge reference.
- "hashtags": array of 5 strings — only when content_type is caption or ad.
- "seo_first_line": string — only when content_type is caption or ad.
- "carousel": array of slide objects (position, headline, subheadline?, body?, stat_number?, stat_unit?,
  stat_label?, source?, quote_text?, quote_author?, cta_text?, list_items?) — only when content_type is
  carousel.
- "assumptions": array of strings — only when an input was defaulted/assumed.

## Constraints

- Zero "**Label:** value" repetition, zero bullet hell, zero "──────" dividers.
- Max 5 lines per paragraph, 1 idea per paragraph.
- No forbidden openers: "Perkenalkan", "Di era", "Selamat pagi".
- No brand voice, no specific emoji convention, no hardcoded tribe/niche assumption.
`

export const writeCopySkill = createSkill({
  name: 'write-copy',
  description:
    'Use when the user asks Montez AI to write copy — a caption, carousel copy, ebook section, ad, or bio — for a topic and audience.',
  instructions: INSTRUCTIONS,
  references: KNOWLEDGE_FILES,
})

export const copyWriter = new Agent({
  id: 'copy-writer',
  name: 'copy-writer',
  instructions: `${INSTRUCTIONS}\n\n## Knowledge Reference\n\n${KNOWLEDGE}`,
  model: "openrouter/openai/gpt-5.4",
  defaultOptions: { structuredOutput: { schema: CopyOutput } },
})

export async function generateCopy(input: CopyWriterInput): Promise<AiResult<CopyOutput>> {
  const msg = buildCopyUserMessage(input)
  const res = await copyWriter.generate([{ role: 'user', content: msg }], {
    structuredOutput: { schema: CopyOutput },
  })
  return { data: res.object as CopyOutput, usage: toUsage(res.usage) }
}
