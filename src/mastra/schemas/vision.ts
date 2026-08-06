import { z } from 'zod'

// Port dari bedah-akun/src/analyzer/gemini-vision.js (VIDEO_PROMPT + COMBINED_SCHEMA).
// Field inti = required; sisanya nullish agar validasi tidak gagal saat model
// menghilangkan field non-esensial (kegagalan validasi memicu retry).
const s = z.string().nullish()
const n = z.number().nullish()
const i = z.number().int().nullish()
const b = z.boolean().nullish()

export const TimelineEvent = z.object({
  t: z.number(),
  event: z.string(),
  desc: z.string(),
})

export const VisualOutput = z.object({
  // Visual basics
  format: z.string(),
  camera_angle: z.string(),
  background: z.string(),
  background_desc: s,
  clothing_color: s,
  clothing_style: s,
  text_overlay: b,
  text_overlay_content: s,
  color_palette: s,
  editing_style: s,
  // Video format
  aspect_ratio: s,
  video_length_category: s,
  content_delivery_method: s,
  creator_visible_in_video: z.boolean(),
  // Thumbnail
  thumbnail_score: i,
  thumbnail_face_visible: b,
  thumbnail_face_expression: s,
  thumbnail_text_present: b,
  thumbnail_text_content: s,
  thumbnail_color_dominant: s,
  thumbnail_contrast_level: s,
  thumbnail_click_bait_level: i,
  thumbnail_composition: s,
  // Color & grading
  color_grading_style: z.string(),
  color_temperature: s,
  color_saturation: s,
  color_contrast: s,
  // Editing
  broll_type: s,
  broll_ratio: n,
  broll_quality: s,
  broll_relevance: s,
  broll_pacing_match: b,
  broll_sources: z.array(z.string()).nullish(),
  cut_frequency: s,
  cuts_per_minute: i,
  transition_types: z.array(z.string()).nullish(),
  zoom_usage: s,
  text_animation_style: s,
  sound_design_style: s,
  sound_fx_count: i,
  // Visual hook
  visual_hook_exists: b,
  visual_hook_type: s,
  mid_hook_exists: b,
  mid_hook_seconds: n,
  // Subtitle
  subtitle_present: b,
  subtitle_style: s,
  subtitle_color: s,
  subtitle_font_style: s,
  subtitle_position: s,
  // Production
  production_level: z.string(),
  lighting_setup: s,
  camera_stability: s,
  location_type: s,
  location_aesthetic: s,
  // Delivery
  speaking_pace: s,
  words_per_minute: i,
  delivery_energy: s,
  facial_expression: s,
  facial_expression_change_points: z.array(z.number()).nullish(),
  voice_tone: s,
  voice_pitch_variation: s,
  hand_gesture_style: s,
  hand_gesture_frequency: s,
  speech_pattern: s,
  filler_word_count: i,
  pause_usage: s,
  artikulasi: s,
  // Audio
  audio_type: z.string(),
  music_genre: s,
  is_trending_audio: b,
  music_bpm: i,
  music_energy_level: s,
  music_scene_vibe: s,
  audio_visual_sync: b,
  // Brand
  visual_brand_style: s,
  animation_style: s,
  emoji_usage: s,
  emoji_count: i,
})

export const VisionOutput = z.object({
  timeline: z.array(TimelineEvent).default([]),
  visual: VisualOutput,
})

export type VisionOutput = z.infer<typeof VisionOutput>
