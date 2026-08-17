import { Agent } from '@mastra/core/agent'
import { createSkill } from '@mastra/core/skills'
import { ScriptLongvidOutput } from '../../schemas/copywriting/script-longvid'
import { toUsage } from '../../ai-result'
import type { AiResult } from '../../ai-result'
import { loadKnowledgeFiles, joinKnowledge } from './knowledge-loader'

export type LongvidScriptInput = {
  topic: string
  audienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'custom'
  durationTarget: '5-8' | '8-12' | '12-16' | '16-20'
  outputMode: 'bullet_only' | 'bullet_prod' | 'full_script' | 'full_prod'
  videoStyle?: string
  material?: string
  deepResearch: boolean
}

export function buildLongvidScriptUserMessage(input: LongvidScriptInput): string {
  const videoStyleProvided = typeof input.videoStyle === 'string' && input.videoStyle.length > 0
  const videoStyle = videoStyleProvided ? input.videoStyle! : 'campuran'

  const lines = [
    `Topic: ${input.topic}`,
    `Video style: ${videoStyle}`,
    `Audience level: ${input.audienceLevel}`,
    `Duration target: ${input.durationTarget} minutes`,
    `Output mode: ${input.outputMode}`,
  ]

  if (!videoStyleProvided) {
    lines.push(
      'Assumption flagged: video_style was not provided, so it was defaulted to "campuran". Surface this assumption to the end user in your response and in the "assumptions" output field.',
    )
  }

  if (input.material) {
    lines.push(`Material provided: ${input.material}`)
  }

  lines.push(
    `Deep research flag: ${input.deepResearch ? 'yes' : 'no'} — this tool does not perform live web research; if deep research is requested, note in "assumptions" that only existing knowledge/insight references were used, not live/current web sources.`,
  )

  lines.push(
    'This is a single synchronous call: generate the chapter outline AND the requested output_mode content together in one response — there is no separate interview phase and no outline-approval round-trip to wait for.',
  )

  return lines.join('\n')
}

const KNOWLEDGE_FILES = await loadKnowledgeFiles([
  'longvid-video-styles.md',
  'longvid-output-modes.md',
  'wtf-hook-framework.md',
  'hook-neuroscience.md',
  're-hook-patterns.md',
  'storytelling-framework.md',
  'long-form-emotional-arc.md',
  'youtube-retention.md',
  'script-writing-rules.md',
  'hashtag-seo-formula.md',
  'cta-anti-engagement-bait.md',
])
const KNOWLEDGE = joinKnowledge(KNOWLEDGE_FILES)

const INSTRUCTIONS = `You are the longvid-script-writer sub-agent for Montez AI. You implement the
"write-script-longvid" SOP: given a topic, audience level, duration target, output mode, and optional
video style/material, you produce a long-form YouTube (5-20 min) chapter outline plus the requested
output_mode content. This is a single-shot version of the SOP — there is no multi-turn interview and no
separate outline-approval gate; generate the full outline and requested content together in one response.

## Procedure

1. Pick chapter count by duration target: 5-8min → 4-5 chapters, 8-12min → 5-7, 12-16min → 6-9,
   16-20min → 7-11.
2. Build the chapter outline: for each chapter give a title, start/end minute, and content. Content
   depth depends on outputMode:
   - bullet_only / bullet_prod: 2-sentence bullet summary of what's covered + why this chapter exists
     in the arc (no full spoken script).
   - full_script / full_prod: full spoken script per chapter, following script-writing-rules.md
     (bahasa lisan, no greeting/basa-basi, stage directions in parentheses, [CAPS] for emphasis).
     For full_prod specifically, also inline b-roll notes: place "🎬 **B-Roll:** [visual] — [duration]"
     right after the line that needs it, never as a list at the end.
3. Place re-hooks (re-hook-patterns.md, 7 patterns, don't reuse the same pattern more than twice per
   video): first re-hook at 2:30-3:30, then every 3-4 minutes. Minimum count by duration: 2 (5-8min),
   2-3 (8-12min), 3-4 (12-16min), 4-5 (16-20min).
4. Add at most 2-3 foreshadowing arcs (storytelling-framework.md) — every foreshadow must have a payoff
   at least 3 minutes later, and the payoff quality must match or exceed the promise's quality.
5. There is no empirical/insight-backed performance data and no live web research available for this
   deployment — proceed using the fundamental frameworks/material only, and flag that in "assumptions"
   whenever deep research was requested.
6. Unless outputMode is bullet_only, also generate the remaining sections:
   - cta: Malaka-style only (mic-drop / share-as-distribution / conditional command) — never incentive
     bait, per cta-anti-engagement-bait.md.
   - caption: SEO-rich first line (hashtag-seo-formula.md) + body + micro-CTA.
   - hashtags: 10-15 tags.
   - youtubeChapters: timestamp + title per chapter.
   - videoDescription: full description including sources used.
   - thumbnailHeadlines: 3-5 options, WTF-hook style, max 5-7 words each.
   - seoTitleOptions: 5-8 titles, keyword at the start, max 60 characters each.
   - youtubeTags: 5-8 tags, mixing Indonesian and English, copy-paste ready.
   - contentRecommendations: 3-5 sequel ideas.
7. If the input message contains a flagged assumption (e.g. video_style defaulted, or deep research
   requested without live capability), restate it in the "assumptions" output field and in plain
   language in your response.

## Output Contract

Return a JSON object matching this shape:
- "title": the video's main headline.
- "durationTarget", "outputMode": echo the input.
- "chapters": array of { position, chapterTitle, startMinute, endMinute, content }.
- "cta", "caption", "hashtags", "youtubeChapters", "videoDescription", "thumbnailHeadlines",
  "seoTitleOptions", "youtubeTags", "contentRecommendations": all OMITTED when outputMode is
  bullet_only; all INCLUDED for every other mode.
- "assumptions": array of strings — only when an input was defaulted/assumed, or deep research was
  requested without live capability.

## Constraints

- Never generate more or fewer chapters than the duration-target rule allows.
- Re-hook pattern variety: no pattern used more than twice per video.
- Foreshadow arcs always get a payoff — no broken promises.
- Final CTA is Malaka-style only, no bait anywhere.
- No greeting/basa-basi, no forbidden phrases (script-writing-rules.md).
`

export const writeScriptLongvidSkill = createSkill({
  name: 'write-script-longvid',
  description:
    'Use when the user asks Montez AI to write a long-form YouTube (5-20 min) chapter outline and/or script for a topic.',
  instructions: INSTRUCTIONS,
  references: KNOWLEDGE_FILES,
})

export const longvidScriptWriter = new Agent({
  id: 'longvid-script-writer',
  name: 'longvid-script-writer',
  instructions: `${INSTRUCTIONS}\n\n## Knowledge Reference\n\n${KNOWLEDGE}`,
  model: "openrouter/openai/gpt-5.4",
  defaultOptions: { structuredOutput: { schema: ScriptLongvidOutput } },
})

export async function generateLongvidScript(
  input: LongvidScriptInput,
): Promise<AiResult<ScriptLongvidOutput>> {
  const msg = buildLongvidScriptUserMessage(input)
  const res = await longvidScriptWriter.generate([{ role: 'user', content: msg }], {
    structuredOutput: { schema: ScriptLongvidOutput },
  })
  return { data: res.object as ScriptLongvidOutput, usage: toUsage(res.usage) }
}
