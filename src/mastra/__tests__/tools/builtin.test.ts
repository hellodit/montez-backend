import { describe, expect, test } from "bun:test";
import { BUILTIN_TOOL_NAMES, buildBuiltinTools } from "../../tools/builtin";

describe("built-in tools", () => {
  test("exposes get_current_time", () => {
    expect(BUILTIN_TOOL_NAMES).toContain("get_current_time");
    expect(Object.keys(buildBuiltinTools())).toContain("get_current_time");
  });

  test("is built once — same instance across calls", () => {
    // Built-in statis, jadi buildBuiltinTools() mengembalikan objek yang sama
    // (bukan dirakit ulang tiap panggilan).
    expect(buildBuiltinTools()).toBe(buildBuiltinTools());
  });
});
