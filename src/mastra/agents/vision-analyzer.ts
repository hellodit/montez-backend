import { Agent } from '@mastra/core/agent'
import { visionModel } from '../providers'
import { VisionOutput } from '../schemas/vision'
import { toUsage } from '../ai-result'
import type { AiResult } from '../ai-result'

// instructions = VIDEO_PROMPT + arahan timeline (COMBINED_PROMPT) di-port verbatim dari
// bedah-akun/src/analyzer/gemini-vision.js. Struktur field ditegakkan lewat schema Zod.
const INSTRUCTIONS = `Watch this TikTok/Reels video fully — visual, audio, delivery, and editing — then extract a timeline and a full visual/audio analysis.

TIMELINE: Minimum 5 events, timestamps accurate to ±0.5s, descriptions specific not generic.
Event types: hook, key_point, mid_hook, broll_start, broll_end, expression_shift, text_overlay, cta, music_drop, pause, story_beat.

VISUAL: Analyze visual style, camera, editing, delivery, audio, and production. Use "n/a" for clothing fields if no person visible.

Field guidance:
- format: talking_head | broll_voiceover | mixed | split_screen | text_only | carousel | sketch
- camera_angle: closeup | medium | wide | pov | overhead
- background: studio | outdoor | home | office | car | other
- color_palette: warm | cool | neutral | vibrant | muted | dark | bright
- editing_style: minimal | moderate | heavy | jumpcut | cinematic
- aspect_ratio: 9:16 | 16:9 | 1:1 | 4:5 | other
- video_length_category: short_under_15s | short_15_30s | short_30_60s | medium_1_3min | medium_3_5min | long_over_5min
- content_delivery_method: talking_head | voiceover_broll | text_only | reporter_style | mixed
- color_grading_style: warm_film | cold_clean | desaturated | teal_orange | high_contrast | natural | dark_moody | bright_airy
- broll_type: none | product_shot | lifestyle | screen_recording | stock | mixed
- cut_frequency: slow | medium | fast | very_fast
- production_level: lo_fi_bedroom | mid_range | hi_fi | cinematic
- speaking_pace: slow | moderate | fast
- delivery_energy: low | medium | high
- voice_tone: authoritative | excited | conversational | urgent | calm | humorous
- audio_type: on_camera | voiceover | music_only | silent
- music_energy_level: none | slow | medium | fast | extra_fast
- visual_brand_style: intimidating | warm | luxury | raw | playful | professional | minimalist

Fill every field you can observe. Use null only when a field genuinely does not apply.`

export const visionAnalyzer = new Agent({
  id: 'vision-analyzer',
  name: 'vision-analyzer',
  instructions: INSTRUCTIONS,
  model: visionModel,
  // Structured output ditegakkan di level agent (schema Zod) — bukan hanya per-call.
  defaultOptions: { structuredOutput: { schema: VisionOutput } },
})

export async function analyzeVision(
  fileUri: string,
  mimeType: string,
): Promise<AiResult<VisionOutput>> {
  const res = await visionAnalyzer.generate(
    [
      {
        role: 'user',
        content: [
          { type: 'file', data: fileUri, mimeType },
          { type: 'text', text: 'Analyze this video now.' },
        ],
      },
    ],
    { structuredOutput: { schema: VisionOutput } },
  )
  // res.object mengikuti tipe input schema (timeline opsional via .default);
  // runtime sudah tervalidasi Zod, jadi cast ke output type aman.
  return { data: res.object as VisionOutput, usage: toUsage(res.usage) }
}
