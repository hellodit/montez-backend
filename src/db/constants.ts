/**
 * Kontrak level-kolom yang dibutuhkan `schema/` — default kolom, diskriminator
 * varchar/jsonb, dan dimensi vector. Tinggal di sini (bukan di modul) supaya
 * `packages/db` tidak pernah mengimpor ke atas: `api → db`, `mastra → db`.
 *
 * File LEAF: jangan tambahkan import apa pun ke file ini.
 */

// ── chat ──────────────────────────────────────────────────────────────────────

/** Default kolom `chat_messages.role`. */
export const CHAT_ROLE = {
  user: "user",
  assistant: "assistant",
} as const;
export type ChatRole = (typeof CHAT_ROLE)[keyof typeof CHAT_ROLE];

/** Usage token satu panggilan AI; ikut tersimpan di `chat_messages.metadata`. */
export type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

// ── knowledge (RAG) ───────────────────────────────────────────────────────────

/**
 * Status pipeline training satu knowledgebase — default kolom
 * `knowledgebases.training_status`. idle → queued → processing → completed | failed.
 */
export const TRAINING_STATUS = {
  idle: "idle",
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;
export type TrainingStatus = (typeof TRAINING_STATUS)[keyof typeof TRAINING_STATUS];

/**
 * Dimensi kolom `knowledge_chunks.embedding`. WAJIB sama dengan output model
 * embedding — mengubah nilai ini berarti migrasi baru + re-embed seluruh chunk.
 */
export const EMBEDDING_DIMENSIONS = 1024;

// ── usage ─────────────────────────────────────────────────────────────────────

/** Jenis generasi token — isi kolom `token_usages.type` (`chat` = default kolom). */
export const USAGE_TYPE_CHAT = "chat";
export const USAGE_TYPE_EMBED = "embed";

// ── audits ────────────────────────────────────────────────────────────────────

/** Default kolom `audits.status`. */
export const AUDIT_STATUS = {
  queued: "queued",
  scraping: "scraping",
  analyzing: "analyzing",
  scoring: "scoring",
  correlating: "correlating",
  done: "done",
  failed: "failed",
  cancelled: "cancelled",
} as const;
export type AuditStatus = (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS];

// ── scraping ──────────────────────────────────────────────────────────────────

/** Default kolom `engagement_snapshots.snapshot_type`. */
export const SNAPSHOT_TYPE = {
  t0: "t0",
  metaInsights: "meta_insights",
} as const;
export type SnapshotType = (typeof SNAPSHOT_TYPE)[keyof typeof SNAPSHOT_TYPE];

// ── accounts ──────────────────────────────────────────────────────────────────

/** Default kolom `account_credentials.provider`. */
export const CREDENTIAL_PROVIDER = {
  meta: "meta",
} as const;
export type CredentialProvider = (typeof CREDENTIAL_PROVIDER)[keyof typeof CREDENTIAL_PROVIDER];

// ── webhooks ──────────────────────────────────────────────────────────────────

/**
 * Isi kolom `agent_webhooks.events` (jsonb array, bukan pgEnum) sekaligus
 * diskriminator payload. Tambah jenis baru = tambah key, TANPA migrasi DB.
 */
export const WEBHOOK_EVENT = { botReply: "bot.reply" } as const;
export type WebhookEvent = (typeof WEBHOOK_EVENT)[keyof typeof WEBHOOK_EVENT];
