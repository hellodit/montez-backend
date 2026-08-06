import {
  bigint,
  bigserial,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { agents } from "./agent";
import { WEBHOOK_EVENT } from "../constants";
import type { WebhookEvent } from "../constants";

/**
 * agent_webhooks — webhook keluar per agent (satu agent boleh punya banyak).
 * Saat AI agent membalas, worker webhook-delivery mengirim POST payload ke `url`
 * tiap webhook yang subscribe. Satu URL bisa subscribe banyak event via `events`.
 *
 * Auth ke penerima: tak ada field khusus — kredensial (mis. Authorization)
 * ditaruh langsung di `headers` (pola sama dengan tools/mcp).
 */
export const agentWebhooks = pgTable(
  "agent_webhooks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    agentId: bigint("agent_id", { mode: "number" })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),

    // URL tujuan delivery. Divalidasi diawali http(s):// di Zod (webhooks.schema).
    url: text("url").notNull(),

    // Header statis tiap request, termasuk kredensial — tak ada kolom auth khusus.
    headers: jsonb("headers")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),

    // Event yang di-subscribe. Default bot.reply (satu-satunya event saat ini).
    events: jsonb("events")
      .$type<WebhookEvent[]>()
      .notNull()
      .default([WEBHOOK_EVENT.botReply]),

    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Banyak webhook per agent → index biasa untuk lookup/fan-out saat delivery.
    index("agent_webhooks_agent_id_idx").on(table.agentId),
  ],
);
