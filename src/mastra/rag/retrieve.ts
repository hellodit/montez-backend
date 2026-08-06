import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@montez-tstack/db";
import { knowledgeChunks } from "@montez-tstack/db/schema";
import { embedText } from "./embed";

/**
 * Retrieval RAG (dipanggil saat chat): embed query → cari chunk termirip via
 * cosine (index HNSW) → top-K.
 *
 * ISOLASI TENANT (CLAUDE.md §9, WAJIB): SELALU difilter `agentId` (kolom
 * didenormalisasi di knowledge_chunks). Jangan panggil tanpa agentId yang sudah
 * diverifikasi milik user di service.
 */

export type RetrievedChunk = {
  content: string; // teks asli chunk yang dibaca LLM/manusia
  heading: string | null; // path heading untuk sitasi
  similarity: number; // 0..1 (1 = identik) = 1 - cosineDistance
};

export type RetrieveOptions = {
  topK?: number;
  /** Ambang minimal similarity (0..1); chunk di bawahnya dibuang. 0 = tanpa ambang. */
  minSimilarity?: number;
};

const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_SIMILARITY = 0;

/** Cari konteks relevan untuk `query` dalam knowledgebase milik `agentId`. [] bila belum di-train. */
export async function retrieveContext(
  agentId: number,
  query: string,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY;

  if (!query.trim()) return [];

  const queryVector = await embedText(query);
  const similarity = sql<number>`1 - (${cosineDistance(knowledgeChunks.embedding, queryVector)})`;

  return db
    .select({
      content: knowledgeChunks.originalContent,
      heading: knowledgeChunks.heading,
      similarity,
    })
    .from(knowledgeChunks)
    .where(
      and(
        eq(knowledgeChunks.agentId, agentId), // ← filter tenant, WAJIB
        minSimilarity > 0 ? gt(similarity, minSimilarity) : undefined,
      ),
    )
    .orderBy(desc(similarity))
    .limit(topK);
}
