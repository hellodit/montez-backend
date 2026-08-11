import {z} from 'zod'

// Fail-fast saat var wajib hilang; var untuk fitur belum aktif dibuat optional.
// Storage = Cloudflare R2 (S3-compatible). Infra lokal memakai laradock (PG 5432,
// Redis 6379 dengan password) — default di bawah menunjuk ke sana.
const EnvSchema = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z
        .string()
        .default('postgres://default:secret@localhost:5432/montez_audit'),
    REDIS_URL: z.string().default('redis://:secret_redis@localhost:6379'),

    R2_ENDPOINT: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET: z.string().default('audit-media'),
    R2_PUBLIC_URL: z.string().optional(),

    BETTER_AUTH_SECRET: z.string().default('dev-secret-change-me'),
    BETTER_AUTH_URL: z.string().default('http://localhost:3000'),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Instagram connect (owner-access) — "Instagram API with Instagram Login",
    // bukan Facebook Login for Business. Kosong = endpoint connect membalas 503.
    META_APP_ID: z.string().optional(),
    META_APP_SECRET: z.string().optional(),
    META_REDIRECT_URI: z.string().optional(),
    META_OAUTH_SUCCESS_REDIRECT: z.string().optional(),

    // Rate limit POST /audits per user (mencegah abuse biaya AI).
    AUDIT_RATE_LIMIT: z.coerce.number().default(10),
    AUDIT_RATE_WINDOW_SEC: z.coerce.number().default(3600),
    TIKHUB_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
    OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'),
    OPENROUTER_SITE_URL: z.string().optional(),
    OPENROUTER_APP_NAME: z.string().default('montez-agent'),
    TRANSCRIBE_BASE_URL: z.string().default('https://api.openai.com/v1'),
    TRANSCRIBE_API_KEY: z.string().optional(),
    TRANSCRIBE_MODEL: z.string().default('whisper-1'),
    AI_EMBED_MODEL: z.string().default('baai/bge-m3'),
    AI_EMBED_MAX_PARALLEL: z.coerce.number().int().positive().default(1),
    AI_EMBED_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),
    TOOL_FETCH_TIMEOUT_MS: z.coerce.number().default(10_000),
    WEBHOOK_DELIVERY_TIMEOUT_MS: z.coerce.number().default(15_000),
    MASTRA_DATABASE_URL: z.url(),

    // Midtrans (Snap) — top-up/upgrade plan. Kosong = POST /api/billing/checkout
    // membalas 503, sama seperti pola Instagram/Google di atas.
    MIDTRANS_SERVER_KEY: z.string().optional(),
    MIDTRANS_CLIENT_KEY: z.string().optional(),
    MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false),
})

export const env = EnvSchema.parse(process.env)
