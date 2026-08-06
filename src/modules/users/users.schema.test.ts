import { describe, expect, test } from "bun:test";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "./users.schema";

/** Body create valid minimal (hanya field wajib). */
const validMinimal = { name: "Budi", email: "budi@example.com", password: "secret123" };

describe("createUserSchema", () => {
  test("accepts minimal required fields", () => {
    const parsed = createUserSchema.parse(validMinimal);
    expect(parsed.name).toBe("Budi");
    expect(parsed.email).toBe("budi@example.com");
    expect(parsed.password).toBe("secret123");
    // Field opsional tak ada → undefined (bukan default), agar tak menimpa flag.
    expect(parsed.isAdmin).toBeUndefined();
    expect(parsed.emailVerified).toBeUndefined();
  });

  test("accepts the admin-only flags", () => {
    const parsed = createUserSchema.parse({
      ...validMinimal,
      isAdmin: true,
      emailVerified: true,
    });
    expect(parsed.isAdmin).toBe(true);
    expect(parsed.emailVerified).toBe(true);
  });

  test.each([
    ["missing name", { email: "a@b.com", password: "secret123" }],
    ["missing email", { name: "Budi", password: "secret123" }],
    ["missing password", { name: "Budi", email: "a@b.com" }],
    ["invalid email", { ...validMinimal, email: "not-an-email" }],
    ["password too short", { ...validMinimal, password: "short" }],
    ["non-boolean flag", { ...validMinimal, isAdmin: "yes" }],
  ])("rejects: %s", (_label, input) => {
    expect(createUserSchema.safeParse(input).success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  test("accepts a partial patch", () => {
    const parsed = updateUserSchema.safeParse({ name: "Budi Baru" });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ name: "Budi Baru" });
  });

  test("rejects an empty body and a malformed image url", () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.safeParse({ image: "not-a-url" }).success).toBe(false);
  });
});

describe("userIdParamSchema", () => {
  // ID Better Auth = string acak, BUKAN angka — jangan sampai di-coerce.
  test("accepts a Better Auth style text id", () => {
    const parsed = userIdParamSchema.safeParse({ id: "D1pVrV9G1zxqEEpMiEWvVsmXlIjz" });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.id).toBe("D1pVrV9G1zxqEEpMiEWvVsmXlIjz");
  });

  test("rejects an empty id", () => {
    expect(userIdParamSchema.safeParse({ id: "   " }).success).toBe(false);
  });
});
