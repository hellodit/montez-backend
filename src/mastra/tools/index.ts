import { buildBuiltinTools } from "./builtin";

/**
 * Kumpulkan semua tool untuk satu agent. Saat ini hanya tool built-in (dari
 * kode, selalu aktif) — tool external-api buatan user dihapus bersama modul
 * `tools` yang tidak ikut diport ke monorepo.
 *
 * Tetap async dan tetap menerima `agentId` supaya penambahan sumber tool
 * per-agent (yang perlu query DB) tidak mengubah signature semua caller.
 */
export async function buildToolsForAgent(_agentId: number) {
  return { ...buildBuiltinTools() };
}
