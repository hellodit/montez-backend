import { describe, expect, test } from "bun:test";
import { checkoutSchema } from "./billing.schema";

describe("checkoutSchema", () => {
  test("accepts a known planId + periodId", () => {
    const parsed = checkoutSchema.safeParse({ planId: "premium", periodId: "6m" });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ planId: "premium", periodId: "6m" });
  });

  test.each([
    ["unknown planId", { planId: "diamond", periodId: "6m" }],
    ["unknown periodId", { planId: "premium", periodId: "24m" }],
    ["missing planId", { periodId: "6m" }],
    ["missing periodId", { planId: "premium" }],
  ])("rejects: %s", (_label, input) => {
    expect(checkoutSchema.safeParse(input).success).toBe(false);
  });
});
