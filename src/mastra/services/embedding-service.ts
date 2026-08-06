import {and, eq} from "drizzle-orm";
import {env} from "@montez-tstack/env/server";
import {db} from "@montez-tstack/db";
import {knowledgeChunks, tokenUsages} from "@montez-tstack/db/schema";
import {USAGE_TYPE_EMBED} from "@montez-tstack/db/constants";
import {chunkText, estimateTokens} from "../rag/chunk";
import {embedTexts} from "../rag/embed";


/** Satu chunk yang sudah di-embed, siap dipetakan ke baris `knowledge_chunks`. */
type EmbeddedChunk = {
    chunkIndex: number;
    content: string;
    originalContent: string;
    heading: string | null;
    tokenCount: number;
    embedding: number[];
};


/** Hasil embed konten: chunk siap simpan + token usage nyata dari provider. */
type EmbeddedContent = {
    chunks: EmbeddedChunk[];
    embedTokens: number; // usage.tokens embedMany (token input embedding)
};

async function embedKnowledgebaseContent(content: string): Promise<EmbeddedContent> {
    const pieces = await chunkText(content);
    if (pieces.length === 0) {
        throw new Error("Knowledgebase content produced no chunks.");
    }

    // Embed teks heading-augmented; embedTexts menjamin count & dimensi vektor.
    const {embeddings, usage} = await embedTexts(pieces.map((p) => p.content));

    const chunks = pieces.map((p, i) => ({
        chunkIndex: p.index,
        content: p.content,
        originalContent: p.originalContent,
        heading: p.heading,
        tokenCount: estimateTokens(p.content),
        embedding: embeddings[i]!,
    }));
    return {chunks, embedTokens: usage.tokens};
}

export async function embedAndStoreKnowledgebase(params: {
    knowledgebaseId: number;
    agentId: number;
    content: string;
}): Promise<number> {
    const {knowledgebaseId, agentId, content} = params;

    const {chunks, embedTokens} = await embedKnowledgebaseContent(content);

    const rows = chunks.map((c) => ({
        knowledgebaseId,
        agentId, // denormalisasi isolasi tenant (CLAUDE.md §9)
        chunkIndex: c.chunkIndex,
        originalContent: c.originalContent, // teks asli untuk tampilan/konteks LLM
        content: c.content, // teks yang di-embed (heading-augmented)
        embedding: c.embedding,
        heading: c.heading,
        tokenCount: c.tokenCount,
    }));

    await db.transaction(async (tx) => {
        await tx
            .delete(knowledgeChunks)
            .where(
                and(
                    eq(knowledgeChunks.knowledgebaseId, knowledgebaseId),
                    eq(knowledgeChunks.agentId, agentId), // ← filter tenant, WAJIB (§9)
                ),
            );
        await tx.insert(knowledgeChunks).values(rows);

        // Token usage embedding (1 baris/training run) dalam tx yang sama.
        // chatConversationId sengaja kosong: training knowledgebase tak terikat percakapan.
        await tx.insert(tokenUsages).values({
            agentId,
            type: USAGE_TYPE_EMBED,
            promptTokens: embedTokens,
            completionTokens: 0,
            totalTokens: embedTokens,
            model: env.AI_EMBED_MODEL,
        });
    });

    return rows.length;
}
