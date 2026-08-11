import { describe, expect, test } from "bun:test";
import { verifyNotificationSignature } from "./midtrans";

const SERVER_KEY = "test-server-key";

function expectedSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  const hasher = new Bun.CryptoHasher("sha512");
  hasher.update(`${orderId}${statusCode}${grossAmount}${serverKey}`);
  return hasher.digest("hex");
}

describe("verifyNotificationSignature", () => {
  test("accepts a signature computed with the correct server key", () => {
    const payload = {
      order_id: "SUB-abc123",
      status_code: "200",
      gross_amount: "139000.00",
      signature_key: expectedSignature("SUB-abc123", "200", "139000.00", SERVER_KEY),
    };
    expect(verifyNotificationSignature(payload, SERVER_KEY)).toBe(true);
  });

  test("rejects a signature computed with the wrong server key", () => {
    const payload = {
      order_id: "SUB-abc123",
      status_code: "200",
      gross_amount: "139000.00",
      signature_key: expectedSignature("SUB-abc123", "200", "139000.00", "some-other-key"),
    };
    expect(verifyNotificationSignature(payload, SERVER_KEY)).toBe(false);
  });

  test("rejects when gross_amount was tampered after signing", () => {
    const payload = {
      order_id: "SUB-abc123",
      status_code: "200",
      gross_amount: "1.00",
      signature_key: expectedSignature("SUB-abc123", "200", "139000.00", SERVER_KEY),
    };
    expect(verifyNotificationSignature(payload, SERVER_KEY)).toBe(false);
  });
});
