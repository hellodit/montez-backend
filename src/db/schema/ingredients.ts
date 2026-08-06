import {
  bigint,
  bigserial,
  pgTable,
  text,
  integer,
  real,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { posts } from './posts'

// Kolom inti typed + `details` jsonb. Kolom `embedding` vector ditunda ke fase RAG (YAGNI).
export const ingredients = pgTable(
  'ingredients',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    // inti — analisis
    kastaHook: text('kasta_hook'),
    hookType: text('hook_type'),
    hookStrength: integer('hook_strength'),
    hookEfficiency: real('hook_efficiency'),
    psychologicalMechanism: text('psychological_mechanism'),
    emotionalArc: text('emotional_arc'),
    structure: text('structure'),
    tone: text('tone'),
    ctaType: text('cta_type'),
    format: text('format'),
    productionLevel: text('production_level'),
    contentPillar: text('content_pillar'),
    sentiment: text('sentiment'),
    videoLengthCategory: text('video_length_category'),
    postingHour: integer('posting_hour'),
    postingDay: text('posting_day'),
    // skor — diisi score.worker
    viewsLogZscore: real('views_log_zscore'),
    visibilityScore: real('visibility_score'),
    engagementScore: real('engagement_score'),
    performanceTier: text('performance_tier'),
    viralityMultiplier: real('virality_multiplier'),
    retentionPct: real('retention_pct'),
    whyItWorks: text('why_it_works'),
    transcriptRaw: text('transcript_raw'),
    details: jsonb('details').$type<Record<string, unknown>>().default({}),
    analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('ingredients_post').on(t.postId),
    index('ingredients_user_tier').on(t.userId, t.performanceTier),
    index('ingredients_user_kasta').on(t.userId, t.kastaHook),
  ],
)
