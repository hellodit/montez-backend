import {MDocument} from "@mastra/rag";

export type Chunk = {
    index: number;
    content: string;
    originalContent: string;
    heading: string | null;
};

// Batas atas char per chunk sebelum sub-split (≈5k token).
const MAX_CHARS = 20_000;

const HEADERS: [string, string][] = [
    ["#", "h1"],
    ["##", "h2"],
    ["###", "h3"],
    ["####", "h4"],
    ["#####", "h5"],
    ["######", "h6"],
];

const HEADING_KEYS = HEADERS.map(([, key]) => key);

/** Susun ulang path heading dari metadata chunk Mastra; null bila tak ada (preamble). */
function buildHeadingPath(metadata: Record<string, unknown>): string | null {
    const parts: string[] = [];
    for (const key of HEADING_KEYS) {
        const value = metadata[key];
        if (typeof value === "string" && value.trim()) parts.push(value.trim());
    }
    return parts.length ? parts.join(" > ") : null;
}

/** Sub-split teks kebesaran: batas paragraf dulu, hard-split kalau terpaksa. */
function splitOversized(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) return [text];

    const out: string[] = [];
    let buf = "";
    for (const para of text.split(/\n{2,}/)) {
        if (para.length > maxChars) {
            if (buf) {
                out.push(buf);
                buf = "";
            }
            for (let i = 0; i < para.length; i += maxChars) out.push(para.slice(i, i + maxChars));
            continue;
        }
        const candidate = buf ? `${buf}\n\n${para}` : para;
        if (candidate.length > maxChars) {
            out.push(buf);
            buf = para;
        } else buf = candidate;
    }
    if (buf) out.push(buf);
    return out;
}

export async function chunkText(text: string): Promise<Chunk[]> {
    const docs = await MDocument.fromMarkdown(text).chunk({
        strategy: "markdown",
        headers: HEADERS,
        stripHeaders: false, // simpan baris heading di dalam chunk (jadi 1 section = 1 chunk)
    });

    const chunks: Chunk[] = [];
    let index = 0;

    for (const doc of docs) {
        const raw = doc.text.trim();
        if (!raw) continue;

        const heading = buildHeadingPath(doc.metadata);
        const budget = heading ? MAX_CHARS - heading.length - 2 : MAX_CHARS;

        for (const piece of splitOversized(raw, Math.max(budget, 1))) {
            const originalContent = piece.trim();
            if (!originalContent) continue;
            const content = heading ? `${heading}\n\n${originalContent}` : originalContent;
            chunks.push({index: index++, content, originalContent, heading});
        }
    }
    return chunks;
}

/** Estimasi kasar jumlah token (≈4 char/token) untuk kolom token_count. */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}
