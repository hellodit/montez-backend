import { describe, expect, it, spyOn } from "bun:test";
import { app } from "../../app";
import { env } from "../../config";
import * as midtrans from "../../thirdparty/midtrans/midtrans";

async function registerAndLogin() {
  const email = `billing${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`;
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Billing Test", email, password: "password123" }),
  });
  const body = (await res.json()) as { data: { token: string; user: { id: string } } };
  return { token: body.data.token, userId: body.data.user.id };
}

function withMidtransConfigured<T>(fn: () => Promise<T>): Promise<T> {
  const prevServer = env.MIDTRANS_SERVER_KEY;
  const prevClient = env.MIDTRANS_CLIENT_KEY;
  env.MIDTRANS_SERVER_KEY = "test-server-key";
  env.MIDTRANS_CLIENT_KEY = "test-client-key";
  return fn().finally(() => {
    env.MIDTRANS_SERVER_KEY = prevServer;
    env.MIDTRANS_CLIENT_KEY = prevClient;
  });
}

describe("GET /billing/current", () => {
  it("requires auth", async () => {
    const res = await app.request("/api/billing/current");
    expect(res.status).toBe(401);
  });

  it("returns null for a fresh user", async () => {
    const { token } = await registerAndLogin();
    const res = await app.request("/api/billing/current", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown };
    expect(body.data).toBeNull();
  });
});

describe("POST /billing/checkout", () => {
  it("requires auth", async () => {
    const res = await app.request("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId: "premium", periodId: "6m" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 422 for an unknown planId", async () => {
    const { token } = await registerAndLogin();
    const res = await app.request("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ planId: "diamond", periodId: "6m" }),
    });
    expect(res.status).toBe(422);
  });

  it("returns 503 when Midtrans is not configured", async () => {
    const { token } = await registerAndLogin();
    const prevServer = env.MIDTRANS_SERVER_KEY;
    const prevClient = env.MIDTRANS_CLIENT_KEY;
    env.MIDTRANS_SERVER_KEY = undefined;
    env.MIDTRANS_CLIENT_KEY = undefined;
    try {
      const res = await app.request("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: "premium", periodId: "6m" }),
      });
      expect(res.status).toBe(503);
    } finally {
      env.MIDTRANS_SERVER_KEY = prevServer;
      env.MIDTRANS_CLIENT_KEY = prevClient;
    }
  });

  it("creates a pending transaction and returns a snap token when configured", async () => {
    const { token } = await registerAndLogin();
    await withMidtransConfigured(async () => {
      const spy = spyOn(midtrans, "createSnapTransaction").mockResolvedValue({
        token: "mocked-snap-token",
        redirect_url: "https://sandbox.midtrans.com/redirect/mocked",
      });
      try {
        const res = await app.request("/api/billing/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ planId: "premium", periodId: "6m" }),
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as { data: { orderId: string; snapToken: string } };
        expect(body.data.snapToken).toBe("mocked-snap-token");
        expect(body.data.orderId).toStartWith("SUB-");
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
    });
  });
});

describe("POST /billing/midtrans/notification", () => {
  it("does not require auth", async () => {
    const res = await app.request("/api/billing/midtrans/notification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        order_id: "SUB-does-not-exist",
        status_code: "200",
        gross_amount: "1.00",
        signature_key: "invalid",
        transaction_status: "settlement",
        transaction_id: "t-1",
        payment_type: "qris",
      }),
    });
    // Rejected on signature (401), not on auth — proves this route bypasses requireAuth.
    expect(res.status).toBe(401);
  });

  it("rejects a tampered signature", async () => {
    await withMidtransConfigured(async () => {
      const res = await app.request("/api/billing/midtrans/notification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_id: "SUB-does-not-exist",
          status_code: "200",
          gross_amount: "1.00",
          signature_key: "invalid",
          transaction_status: "settlement",
          transaction_id: "t-1",
          payment_type: "qris",
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  it("acknowledges an unknown order_id with 200 once the signature is valid (stops Midtrans retries without claiming to have processed it)", async () => {
    await withMidtransConfigured(async () => {
      const orderId = "SUB-does-not-exist";
      const statusCode = "200";
      const grossAmount = "1.00";
      const hasher = new Bun.CryptoHasher("sha512");
      hasher.update(`${orderId}${statusCode}${grossAmount}${env.MIDTRANS_SERVER_KEY}`);
      const signature_key = hasher.digest("hex");

      const res = await app.request("/api/billing/midtrans/notification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key,
          transaction_status: "settlement",
          transaction_id: "t-1",
          payment_type: "qris",
        }),
      });
      expect(res.status).toBe(200);
    });
  });
});
