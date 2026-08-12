import { describe, expect, test } from "bun:test";
import { getCurrentTime } from "./get-current-time";

describe("get_current_time", () => {
  test("returns ok with iso + formatted for a valid timezone", () => {
    const result = getCurrentTime.run({ timezone: "Asia/Jakarta" }) as {
      ok: boolean;
      iso: string;
      timezone: string;
      formatted: string;
    };
    expect(result.ok).toBe(true);
    expect(result.timezone).toBe("Asia/Jakarta");
    expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof result.formatted).toBe("string");
  });

  test("defaults to UTC when no timezone given", () => {
    const result = getCurrentTime.run({}) as { ok: boolean; timezone: string };
    expect(result.ok).toBe(true);
    expect(result.timezone).toBe("UTC");
  });

  test("returns a structured error for an unknown timezone", () => {
    const result = getCurrentTime.run({ timezone: "Mars/Olympus" }) as {
      ok: boolean;
      error: string;
    };
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Mars/Olympus");
  });
});
