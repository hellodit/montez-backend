/**
 * Baca file knowledge statis (dibundle di knowledge/copywriting/) dan gabung jadi satu
 * blok teks untuk instructions sub-agent. Sumber: the-hive/brain/knowledge/Copywriting —
 * snapshot manual, bukan live sync (lihat docs/superpowers/specs kalau ada catatan drift).
 */
const KNOWLEDGE_DIR = `${import.meta.dir}/../../knowledge/copywriting`;

/** Baca file knowledge sebagai map filename → content, untuk Skill `references`. */
export async function loadKnowledgeFiles(filenames: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    filenames.map(async (filename) => {
      const file = Bun.file(`${KNOWLEDGE_DIR}/${filename}`);
      if (!(await file.exists())) {
        throw new Error(`loadKnowledgeFiles: knowledge file not found: ${filename}`);
      }
      return [filename, await file.text()] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Gabung map knowledge jadi satu blok teks, untuk instructions sub-agent generation. */
export function joinKnowledge(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([filename, content]) => `## Source: ${filename}\n\n${content}`)
    .join("\n\n---\n\n");
}

export async function loadKnowledge(filenames: string[]): Promise<string> {
  return joinKnowledge(await loadKnowledgeFiles(filenames));
}
