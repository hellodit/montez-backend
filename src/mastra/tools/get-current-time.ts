import { z } from "zod";

/**
 * Tool built-in: waktu sekarang di server. `timezone` opsional (nama IANA,
 * mis. "Asia/Jakarta"); kalau kosong pakai UTC. Timezone salah → { ok: false }.
 *
 * Bentuknya sengaja sama dengan tool built-in lain: name, description,
 * inputSchema, dan fungsi `run`. Lihat builtin.ts.
 */
export const getCurrentTime = {
  name: "get_current_time",
  description:
    "Get the current date and time. Optionally provide an IANA timezone (e.g. 'Asia/Jakarta'); defaults to UTC.",
  inputSchema: z.object({
    timezone: z
      .string()
      .describe("IANA timezone name, e.g. 'Asia/Jakarta'. Defaults to UTC.")
      .optional(),
  }),
  run: (args: Record<string, unknown>) => {
    const timezone = (args.timezone as string | undefined) ?? "UTC";
    const now = new Date();
    try {
      const formatted = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: timezone,
      }).format(now);
      return { ok: true, iso: now.toISOString(), timezone, formatted };
    } catch {
      return { ok: false, error: `Unknown timezone: ${timezone}.` };
    }
  },
};
