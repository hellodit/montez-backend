/**
 * Baca file knowledge statis (dibundle di knowledge/copywriting/) dan gabung jadi satu
 * blok teks untuk instructions sub-agent. Sumber: the-hive/brain/knowledge/Copywriting —
 * snapshot manual, bukan live sync (lihat docs/superpowers/specs kalau ada catatan drift).
 */
const KNOWLEDGE_DIR = `${import.meta.dir}/../../knowledge/copywriting`;

export async function loadKnowledge(filenames: string[]): Promise<string> {
  const sections = await Promise.all(
    filenames.map(async (filename) => {
      const file = Bun.file(`${KNOWLEDGE_DIR}/${filename}`);
      if (!(await file.exists())) {
        throw new Error(`loadKnowledge: knowledge file not found: ${filename}`);
      }
      const content = await file.text();
      return `## Source: ${filename}\n\n${content}`;
    }),
  );
  return sections.join("\n\n---\n\n");
}
