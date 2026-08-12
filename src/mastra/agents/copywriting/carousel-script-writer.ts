import { Agent } from '@mastra/core/agent'
import { createSkill } from '@mastra/core/skills'
import { scriptModel } from '../../model'
import { ScriptCarouselOutput } from '../../schemas/copywriting/script-carousel'
import { toUsage } from '../../ai-result'
import type { AiResult } from '../../ai-result'
import { loadKnowledgeFiles, joinKnowledge } from './knowledge-loader'

export type CarouselScriptInput = {
  topic: string
  audience: string
  format: 'edukasi' | 'jualan' | 'storytelling' | 'data-stat' | 'listicle'
  platform: 'instagram' | 'linkedin' | 'both'
  dataDepth: 'general' | 'trending'
  hook?: string
  slideCount?: number
  material?: string
  deepResearch?: boolean
}

function defaultSlideCount(platform: CarouselScriptInput['platform']): number {
  return platform === 'linkedin' ? 8 : 10
}

export function buildCarouselScriptUserMessage(input: CarouselScriptInput): string {
  const slideCountProvided = typeof input.slideCount === 'number'
  const slideCount = slideCountProvided ? input.slideCount! : defaultSlideCount(input.platform)

  const lines = [
    `Topic: ${input.topic}`,
    `Audience: ${input.audience}`,
    `Format: ${input.format}`,
    `Platform: ${input.platform}`,
    `Data depth: ${input.dataDepth}`,
    `Slide count: ${slideCount}`,
  ]

  if (!slideCountProvided) {
    lines.push(
      `Assumption flagged: slide_count was not provided, so it was defaulted to ${slideCount} (platform default for ${input.platform}). Surface this assumption to the end user in your response and in the "assumptions" output field.`,
    )
  }

  if (input.hook) {
    lines.push(
      `Hook (chained from write-hooks): ${input.hook}`,
      'This hook was already generated upstream — skip hook generation and compress it to the 6-word cover max if needed.',
    )
  }

  if (input.material) {
    lines.push(`Material provided: ${input.material}`)
  }

  if (input.dataDepth === 'trending') {
    lines.push(
      `Deep research flag: ${input.deepResearch ? 'yes' : 'no'} — this tool does not perform live web research; if deep research is requested, note in "assumptions" that only existing knowledge/insight references were used, not live/current data.`,
    )
  }

  lines.push('Generate the full carousel production sheet for this input.')

  return lines.join('\n')
}

const KNOWLEDGE_FILES = await loadKnowledgeFiles([
  'carousel-formats.md',
  'carousel-swipe-psychology.md',
  'wtf-hook-framework.md',
  'hook-neuroscience.md',
  'sales-copy-formulas.md',
  'storytelling-framework.md',
  '8-human-basic-instinct.md',
  'simplifikasi-kata.md',
  'copy-sharpening-techniques.md',
  'hashtag-seo-formula.md',
  'cta-anti-engagement-bait.md',
])
const KNOWLEDGE = joinKnowledge(KNOWLEDGE_FILES)

const INSTRUCTIONS = `You are the carousel-script-writer sub-agent for Montez AI. You implement the
"write-script-carousel" SOP: given a topic, audience, format, platform, and data depth (plus optional
chained hook/slide_count/material), you produce a copy-paste-ready carousel production sheet for a
VA/designer. This is a single-shot version of the SOP — there is no multi-turn interview or approval
gate; treat all inputs as already collected up front.

## Procedure

1. If a hook was supplied (chained from write-hooks), skip hook generation — compress it to the 6-word
   cover max if needed. Otherwise generate a cover hook yourself via the WTF hook framework.
2. Load the framework matching the format:
   - edukasi / listicle → hook-fundamental concepts via wtf-hook-framework.md
   - jualan → sales-copy-formulas.md (PAS/BAB)
   - storytelling → storytelling-framework.md
   - data-stat → note there is no empirical/insight data available for this deployment; proceed with
     general knowledge only and flag that in "assumptions"
3. Generate the cover slide: cover hook formula per format, MAX 6 words, power word first or last.
   Compress the chained hook if it's 7+ words.
4. If platform is instagram or both: generate a standalone Slide 2 (second hook) — one of Why This
   Matters / What You'll Learn / Proof Point — that does not assume the reader saw slide 1.
5. Generate body slides per the format structure and the emotional beat map (carousel-swipe-psychology.md):
   every non-CTA slide must have a cliffhanger, open loop, question, or pivot word. Add a pattern
   interrupt (visual/content rhythm shift) around slide 5-6. Simplify each headline
   (simplifikasi-kata.md). Escalate the "dopamine hit" per slide.
6. Generate a progressive CTA across 3 layers: slide 1 = swipe prompt, slide 5-6 = micro-CTA
   (save/share), final slide(s) = main CTA matched to the format.
7. Final-slide CTA MUST be Malaka-style only: mic-drop / share-as-distribution / conditional command.
   NEVER incentive bait ("comment 'X' if...") on any slide — see cta-anti-engagement-bait.md.
8. Generate the caption (SEO-rich first line, body per format strategy, micro-CTA) and exactly 5
   hashtags (2 niche + 2 broad + 1 branded placeholder) via hashtag-seo-formula.md.
9. Always suggest 3-5 franchise/content-recommendation ideas with different angles.
10. If the input message contains a flagged assumption (e.g. slide_count defaulted, or trending data
    depth without live research), restate it in the "assumptions" output field and in plain language.

## Output Contract

Return a JSON object matching this shape:
- "format", "platform", "slideCount", "dataDepth": echo the input.
- "slides": array of { position, role: cover|second_hook|body|cta, headline, subtitle?, body?,
  imageKeyword?, imageSource?, imageStyle?, swipeText?, ctaType?, ctaText? } — one entry per slide,
  positions 1..slideCount, zero ambiguity (a VA/designer must be able to copy-paste with no guessing).
- "caption": the caption text.
- "hashtags": exactly 5 strings.
- "franchiseSuggestions": 3-5 strings.
- "assumptions": array of strings — only when an input was defaulted/assumed, or trending data depth
  was requested without live research capability.

## Constraints

- Cover ≤ 6 words. Slide 2 (IG) must stand alone. Pattern interrupt at slide 5-6.
- slideCount must stay within 5-20 (sweet spot 5-10 IG, 6-9 LinkedIn) — if the caller passes an
  out-of-range value, clamp to the nearest bound and flag that in "assumptions".
- Every non-CTA slide needs a cliffhanger/open loop/question/pivot word.
- Final CTA is Malaka-style only, no bait anywhere.
`

export const writeScriptCarouselSkill = createSkill({
  name: 'write-script-carousel',
  description:
    'Use when the user asks Montez AI to write a full carousel production sheet (slide-by-slide script) for a topic, audience, and platform.',
  instructions: INSTRUCTIONS,
  references: KNOWLEDGE_FILES,
})

export const carouselScriptWriter = new Agent({
  id: 'carousel-script-writer',
  name: 'carousel-script-writer',
  instructions: `${INSTRUCTIONS}\n\n## Knowledge Reference\n\n${KNOWLEDGE}`,
  model: scriptModel,
  defaultOptions: { structuredOutput: { schema: ScriptCarouselOutput } },
})

export async function generateCarouselScript(
  input: CarouselScriptInput,
): Promise<AiResult<ScriptCarouselOutput>> {
  const msg = buildCarouselScriptUserMessage(input)
  const res = await carouselScriptWriter.generate([{ role: 'user', content: msg }], {
    structuredOutput: { schema: ScriptCarouselOutput },
  })
  return { data: res.object as ScriptCarouselOutput, usage: toUsage(res.usage) }
}
