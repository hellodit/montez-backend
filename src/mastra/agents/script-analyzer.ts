import { Agent } from '@mastra/core/agent'
import { scriptModel } from '../providers'
import { ScriptOutput } from '../schemas/script'
import { toUsage } from '../ai-result'
import type { AiResult } from '../ai-result'

// instructions = SCRIPT_PROMPT di-port verbatim dari
// bedah-akun/src/analyzer/script-analysis.js (baris 15-106).
const SCRIPT_PROMPT = `You are a content analyst specializing in viral short-form video scripts (TikTok/Instagram/YouTube).
Analyze the provided CAPTION and TRANSCRIPT (if available). Return a JSON object with EXACTLY these fields.

── HOOK ANALYSIS ──
- "hook_type": one of "question" | "shock" | "controversial" | "relatable" | "data_stat" | "story" | "how_to" | "myth_bust" | "challenge" | "confession" | "prediction" | "none"
- "kasta_hook": one of "no_hook" | "normal" | "killer" | "wtf" | "long_hook"
  - no_hook: no recognizable hook — functional/descriptive post, no curiosity trigger
  - normal: has a hook but generic/overused
  - killer: strong curiosity + 1-2 basic instincts triggered — promise of value, outcome, or reveal
  - wtf: violates expectations INSTANTLY — counter-intuitive claim, extreme contrast, paradox
  - long_hook: extended slow-build setup — draws viewer in gradually before the main point lands
  KEY: wtf = first sentence alone violates expectation; killer = needs context/promise to work; normal = recognizable format, no strong pull.
- "hook_wtf_type": one of "taboo" | "paradox" | "absurd" | "extreme_contrast" | "forbidden" | "shocking_visual" | "counter_intuitive" | null (null if kasta_hook is no_hook or normal)
- "hook_strength": integer 1-10 (1=weak/generic, 10=stops scroll instantly)
- "hook_instinct_triggers": array from ["survival","fear","sex","social_status","curiosity","greed","belonging","identity"]
- "hook_uses_wtf_principle": 0 or 1

── NARRATIVE & STRUCTURE ──
- "structure": one of "story_arc" | "listicle" | "before_after" | "tutorial" | "rant" | "opinion" | "qa" | "comparison" | "reveal" | "day_in_life"
- "story_arc": one of "problem_agitate_solve" | "hero_journey" | "before_after" | "case_study" | "confession" | "none"
- "emotional_arc": one of "curiosity_to_satisfaction" | "fear_to_relief" | "pain_to_hope" | "confusion_to_clarity" | "envy_to_aspiration" | "flat"
- "tone": one of "casual" | "professional" | "angry" | "funny" | "inspirational" | "vulnerable" | "educational" | "sarcastic" | "urgent"
- "topics": array of 2-5 topic keywords
- "pattern_interrupt_count": integer

── PERSUASION ──
- "social_proof_used": 0 or 1
- "social_proof_type": one of "numbers" | "testimonial" | "authority" | "celebrity" | "peer" | null
- "authority_signals": array of authority cues or []
- "scarcity_urgency_used": 0 or 1
- "curiosity_gap_type": one of "knowledge_gap" | "outcome_teased" | "mystery" | "before_reveal" | null

── CTA ANALYSIS ──
- "cta_exists": 0 or 1
- "cta_type": one of "comment_bait" | "save_bait" | "share_bait" | "follow_bait" | "link_bait" | "dm_bait" | "none"
- "cta_tone": one of "command" | "question" | "incentive" | "soft" | "none"
- "cta_placement": one of "beginning" | "middle" | "end" | "throughout" | "none"
- "cta_exact_text": exact CTA phrase, or null
- "cta_conversion_type": one of "engagement" | "lead" | "sale" | "awareness" | "none"
- "cta_has_incentive": 0 or 1
- "cta_incentive_type": one of "freebie" | "discount" | "exclusive_content" | "recognition" | null
- "cta_repetition": integer

── WORD / LANGUAGE ──
- "word_count": integer (caption only, not transcript)
- "language_style": one of "formal" | "casual" | "slang" | "mixed" | "bilingual"

── PSYCHOLOGY & EMOTIONAL INTELLIGENCE ──
- "why_it_works": string — 1-2 sentences on the psychological reason this content works (or fails). Be specific about the cognitive/emotional mechanism.
- "audience_emotion_trigger": string — the primary emotion activated at the hook moment. Be specific, not generic.
- "emotional_trigger_words": array of specific words/phrases from the caption/transcript. Max 5. Empty array if none.
- "psychological_mechanism": one of "loss_aversion" | "fomo" | "social_comparison" | "identity_threat" | "reciprocity" | "curiosity_gap" | "in_group_out_group" | "authority_bias" | "confirmation_bias" | "scarcity" | "pain_avoidance" | "status_seeking" | "none"
- "instinct_breakdown": object mapping triggered instincts to { "score": 0-10, "reason": "max 8 words" }. Omit instincts with score 0. Empty object {} if none.
- "repurpose_angles": array of 2-3 short repurpose ideas specific to this content.
- "copywriting_formula": one of "AIDA" | "PAS" | "BAB" | "4Ps" | "FAB" | "storytelling" | "none"

Rules:
- Use TRANSCRIPT for hook cues, pacing, spoken CTA, emotional_trigger_words
- Use CAPTION for word_count, written CTA, hashtag context
- If transcript is missing, base everything on caption`

export const scriptAnalyzer = new Agent({
  id: 'script-analyzer',
  name: 'script-analyzer',
  instructions: SCRIPT_PROMPT,
  model: scriptModel,
  // Structured output ditegakkan di level agent (schema Zod) — bukan hanya per-call.
  defaultOptions: { structuredOutput: { schema: ScriptOutput } },
})

export async function analyzeScript(input: {
  transcript: string
  caption: string | null
  durationSec: number | null
}): Promise<AiResult<ScriptOutput>> {
  const userMsg = `Transcript:\n${input.transcript || '(none)'}\n\nCaption:\n${input.caption ?? '(none)'}\n\nDuration: ${input.durationSec ?? '?'}s`
  const res = await scriptAnalyzer.generate([{ role: 'user', content: userMsg }], {
    structuredOutput: { schema: ScriptOutput },
  })
  return { data: res.object as ScriptOutput, usage: toUsage(res.usage) }
}
