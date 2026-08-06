import { z } from 'zod'

// Port dari bedah-akun/src/analyzer/script-analysis.js (SCRIPT_PROMPT).
// Field inti (dipetakan ke kolom typed ingredients) = required; sisanya nullish.
const s = z.string().nullish()
const i = z.number().int().nullish()
const strArr = z.array(z.string()).nullish()

const InstinctScore = z.object({
  score: z.number(),
  reason: z.string(),
})

export const ScriptOutput = z.object({
  // Hook
  hook_type: z.string(),
  kasta_hook: z.string(),
  hook_wtf_type: s,
  hook_strength: z.number().int(),
  hook_instinct_triggers: strArr,
  hook_uses_wtf_principle: i,
  // Narrative & structure
  structure: z.string(),
  story_arc: s,
  emotional_arc: z.string(),
  tone: z.string(),
  topics: strArr,
  pattern_interrupt_count: i,
  // Persuasion
  social_proof_used: i,
  social_proof_type: s,
  authority_signals: strArr,
  scarcity_urgency_used: i,
  curiosity_gap_type: s,
  // CTA
  cta_exists: i,
  cta_type: z.string(),
  cta_tone: s,
  cta_placement: s,
  cta_exact_text: s,
  cta_conversion_type: s,
  cta_has_incentive: i,
  cta_incentive_type: s,
  cta_repetition: i,
  // Word / language
  word_count: i,
  language_style: s,
  // Psychology
  why_it_works: z.string(),
  audience_emotion_trigger: s,
  emotional_trigger_words: strArr,
  psychological_mechanism: z.string(),
  instinct_breakdown: z.record(z.string(), InstinctScore).nullish(),
  repurpose_angles: strArr,
  copywriting_formula: s,
})

export type ScriptOutput = z.infer<typeof ScriptOutput>
