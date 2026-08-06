import { env } from "@montez-tstack/env/server";
import type { agents } from "@montez-tstack/db/schema";
import { buildAgent, buildRagContextMessage } from "../agent-factory";
import { retrieveContext } from "../rag/retrieve";
import { buildToolsForAgent } from "../tools";
import type { ChatMessage } from "../types";

type AgentRow = typeof agents.$inferSelect;

/** Token usage satu generasi (dinormalisasi dari usage AI SDK v7). */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/** Hasil auto-reply: teks balasan + akuntansi token + nama model yang dipakai. */
export type ReplyResult = {
  text: string;
  usage: TokenUsage;
  model: string;
};

const GENERATE_TIMEOUT_MS = 60_000;

/**
 * Orkestrasi AI murni auto-reply: dari agent + history + query pemicu → teks
 * balasan. Sejajar dengan embedding-service (mastra service) — semua kerja berat
 * LLM/RAG tinggal di sini, chat.service hanya menyusun input & memanggil.
 *
 * RAG WAJIB difilter agentId (isolasi tenant); dijamin di retrieveContext.
 * `agent.promptInjection` = guard: bingkai konteks sebagai DATA tepercaya-rendah.
 */
export async function generateReply(params: {
  agent: AgentRow;
  history: ChatMessage[];
  query: string;
}): Promise<ReplyResult> {
  const { agent, history, query } = params;

  // RAG + tool dirakit paralel (query DB independen). Tool dipasang saat
  // konstruksi agent. Toolset dinamis MCP dihapus bersama modul `mcp`.
  const [chunks, toolset] = await Promise.all([
    retrieveContext(agent.id, query),
    buildToolsForAgent(agent.id),
  ]);
  const ragContext = buildRagContextMessage(chunks, agent.promptInjection);

  // Susun daftar pesan untuk LLM. Kalau ada konteks RAG, taruh paling depan
  // sebagai system message, baru diikuti riwayat percakapan.
  const messages: ChatMessage[] = [];
  if (ragContext !== null) {
    messages.push(ragContext);
  }
  for (const message of history) {
    messages.push(message);
  }

  const agentInstance = buildAgent(agent, toolset);

  // Mastra generate() menerima union role-literal (CoreSystemMessage | ...),
  // bukan ChatMessage — petakan tiap pesan ke bentuk konkret per role.
  const llmMessages = messages.map((m) =>
    m.role === "user"
      ? { role: "user" as const, content: m.content }
      : m.role === "assistant"
        ? { role: "assistant" as const, content: m.content }
        : { role: "system" as const, content: m.content },
  );

  const result = await agentInstance.generate(llmMessages, {
    abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });

  // result.text bisa kosong/undefined kalau LLM tidak menghasilkan apa pun.
  const reply = result.text ? result.text.trim() : "";
  if (reply === "") {
    throw new Error(`Empty LLM reply for agent ${agent.id}.`);
  }

  // AI SDK v7 usage: input/output/total (tiap field bisa undefined). Normalisasi
  // ke prompt/completion/total; field yang absen → 0 (baris tetap tercatat).
  const usage: TokenUsage = {
    promptTokens: result.usage?.inputTokens ?? 0,
    completionTokens: result.usage?.outputTokens ?? 0,
    totalTokens: result.usage?.totalTokens ?? 0,
  };

  return { text: reply, usage, model: env.OPENROUTER_MODEL };
}
