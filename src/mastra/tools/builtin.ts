import { createTool } from "@mastra/core/tools";
import type { z } from "zod";
import { getCurrentTime } from "./get-current-time";

/** Bentuk sebuah tool built-in (lihat contoh di get-current-time.ts). */
export type BuiltinTool = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  run: (args: Record<string, unknown>) => unknown;
};

/**
 * Daftar semua tool built-in. Menambah tool baru: bikin file seperti
 * get-current-time.ts, lalu tambahkan di array ini. Semua built-in di sini
 * selalu aktif untuk semua agent (tidak ada setting on/off — lihat spec 2026-07-16).
 */
const BUILTIN_TOOLS: BuiltinTool[] = [getCurrentTime];

/** Nama built-in yang direservasi — HTTP-tool tak boleh memakai nama ini. */
export const BUILTIN_TOOL_NAMES = BUILTIN_TOOLS.map((tool) => tool.name);

/**
 * Tool built-in dalam bentuk Mastra. Dibangun SEKALI saat modul dimuat karena
 * built-in statis (tak berubah antar request) — beda dengan tool HTTP yang
 * dirakit per-agent dari DB.
 */
const MASTRA_BUILTIN_TOOLS: Record<string, ReturnType<typeof createTool>> = {};
for (const tool of BUILTIN_TOOLS) {
  MASTRA_BUILTIN_TOOLS[tool.name] = createTool({
    id: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    execute: async (input) => tool.run((input ?? {}) as Record<string, unknown>),
  });
}

/** Semua tool built-in (siap dipasang ke agent mana pun). */
export function buildBuiltinTools() {
  return MASTRA_BUILTIN_TOOLS;
}
