import { embedMany } from "ai";
import { env } from "@montez-tstack/env/server";
import { EMBEDDING_DIMENSIONS } from "@montez-tstack/db/constants";
import { getEmbeddingModel } from "../providers";

/**
 * Embedding teks untuk RAG — strategi Mastra: `embedMany` AI SDK langsung dengan
 * embedding model aktif (providers.ts), netral provider. AI SDK memecah `values`
 * jadi batch (maxEmbeddingsPerCall model) & jalan paralel; ketahanan diatur
 * operator (AI_EMBED_MAX_*), bukan hardcoded per-provider. Validasi invarian:
 * jumlah vektor == jumlah teks & dimensi == EMBEDDING_DIMENSIONS (kontrak kolom
 * vector) — gagal keras daripada simpan vektor korup.
 */
/** Hasil embedding: vektor + token usage provider (input tokens saja). */
export type EmbedResult = {
  embeddings: number[][];
  usage: { tokens: number };
};

export async function embedTexts(
  texts: string[],
  abortSignal?: AbortSignal,
): Promise<EmbedResult> {
  if (texts.length === 0) return { embeddings: [], usage: { tokens: 0 } };

  const { embeddings, usage } = await embedMany({
    model: getEmbeddingModel(),
    values: texts,
    maxParallelCalls: env.AI_EMBED_MAX_PARALLEL,
    maxRetries: env.AI_EMBED_MAX_RETRIES,
    abortSignal,
  });

  if (embeddings.length !== texts.length) {
    throw new Error(
      `Embed: vector count (${embeddings.length}) != text count (${texts.length}).`,
    );
  }
  for (const vec of embeddings) {
    if (vec.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimension ${vec.length} != EMBEDDING_DIMENSIONS ${EMBEDDING_DIMENSIONS}. Check AI_EMBED_MODEL.`,
      );
    }
  }
  // usage.tokens bisa undefined bila provider tak melaporkan → 0.
  return { embeddings, usage: { tokens: usage?.tokens ?? 0 } };
}

/** Embedding satu teks (mis. query saat retrieval). Usage token diabaikan. */
export async function embedText(
  text: string,
  abortSignal?: AbortSignal,
): Promise<number[]> {
  const { embeddings } = await embedTexts([text], abortSignal);
  const vec = embeddings[0];
  if (!vec) throw new Error("Embedder returned no vector.");
  return vec;
}
