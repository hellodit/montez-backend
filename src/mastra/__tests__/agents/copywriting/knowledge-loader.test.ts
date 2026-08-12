import { describe, expect, test } from "bun:test";
import { loadKnowledge } from "../../../agents/copywriting/knowledge-loader";

describe("loadKnowledge", () => {
  test("loads a single file's real content", async () => {
    const text = await loadKnowledge(["8-human-basic-instinct.md"]);
    expect(text).toContain("8-human-basic-instinct.md");
    expect(text.length).toBeGreaterThan(100);
  });

  test("joins multiple files, each under its own filename heading, in the given order", async () => {
    const text = await loadKnowledge(["hook-neuroscience.md", "wtf-hook-framework.md"]);
    const neuroIdx = text.indexOf("hook-neuroscience.md");
    const wtfIdx = text.indexOf("wtf-hook-framework.md");
    expect(neuroIdx).toBeGreaterThanOrEqual(0);
    expect(wtfIdx).toBeGreaterThan(neuroIdx);
  });

  test("throws a clear error for a missing knowledge file", async () => {
    await expect(loadKnowledge(["does-not-exist.md"])).rejects.toThrow(/does-not-exist\.md/);
  });
});
