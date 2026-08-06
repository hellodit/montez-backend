import {
    bigint,
    bigserial,
    index,
    integer,
    pgTable,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
import {agents} from "./agent";
import {chatConversations} from "./chat-conversations";


export const tokenUsages = pgTable(
    "token_usages",
    {
        id: bigserial("id", {mode: "number"}).primaryKey(),
        chatConversationId: bigint("conversation_id", {mode: "number"}).references(() => chatConversations.id, {
            onDelete: "cascade",
        }),
        agentId: bigint("agent_id", {mode: "number"}).references(() => agents.id, {
            onDelete: "set null",
        }),
        type: varchar("type", {length: 16}).notNull().default("chat"),
        promptTokens: integer("prompt_tokens").notNull().default(0),
        completionTokens: integer("completion_tokens").notNull().default(0),
        totalTokens: integer("total_tokens").notNull().default(0),
        model: varchar("model", {length: 256}),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("token_usages_conversation_created_idx").on(table.chatConversationId, table.createdAt),
        index("token_usages_created_idx").on(table.createdAt),
        index("token_usages_agent_id_idx").on(table.agentId),
    ],
);
