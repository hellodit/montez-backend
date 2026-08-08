import { describe, expect, it, spyOn } from "bun:test";
import { app } from "../../app";
import { auth } from "../auth/auth";
import { syncInstagramAccount } from "./social-accounts.service";

async function registerAndLogin() {
  const email = `igpost${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`;
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "IG Posts", email, password: "password123" }),
  });
  const body = (await res.json()) as { data: { token: string; user: { id: string } } };
  return { token: body.data.token, userId: body.data.user.id };
}

/** Sambungkan akun IG palsu (mock exchange + profile) supaya ada credential untuk dites. */
async function connectFakeInstagramAccount(userId: string) {
  const getAccessTokenSpy = spyOn(auth.api, "getAccessToken").mockResolvedValue({
    accessToken: "short-lived-token",
    accessTokenExpiresAt: undefined,
    scopes: [],
    idToken: undefined,
  } as never);
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async (input: unknown) => {
    const url = String(input);
    if (url.includes("grant_type=ig_exchange_token")) {
      return new Response(JSON.stringify({ access_token: "long-lived-token" }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ id: "ig-business-1", username: "test_ig_user", name: "Test IG" }),
      { status: 200 },
    );
  });

  await syncInstagramAccount({ userId, accountId: "ig-business-1" });

  getAccessTokenSpy.mockRestore();
  fetchSpy.mockRestore();
}

async function findSocialAccountId(token: string): Promise<number> {
  const res = await app.request("/api/social-accounts", { headers: { authorization: `Bearer ${token}` } });
  const body = (await res.json()) as { data: { id: number }[] };
  return body.data[0]!.id;
}

describe("instagram posts", () => {
  it("list requires auth", async () => {
    const res = await app.request("/api/social-accounts/1/instagram/posts");
    expect(res.status).toBe(401);
  });

  it("list returns 404 when the account isn't connected", async () => {
    const { token } = await registerAndLogin();
    const res = await app.request("/api/social-accounts/999999/instagram/posts", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  it("lists posts for a connected account", async () => {
    const { token, userId } = await registerAndLogin();
    await connectFakeInstagramAccount(userId);
    const socialAccountId = await findSocialAccountId(token);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ id: "media-1", media_type: "IMAGE", permalink: "https://instagram.com/p/x", timestamp: "2026-01-01T00:00:00Z" }],
          paging: { cursors: { after: "cursor-1" } },
        }),
        { status: 200 },
      ),
    );

    try {
      const res = await app.request(`/api/social-accounts/${socialAccountId}/instagram/posts`, {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { data: { id: string }[] } };
      expect(body.data.data[0]?.id).toBe("media-1");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(String(fetchSpy.mock.calls[0]![0])).toContain("/ig-business-1/media");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("gets post detail for a connected account", async () => {
    const { token, userId } = await registerAndLogin();
    await connectFakeInstagramAccount(userId);
    const socialAccountId = await findSocialAccountId(token);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ id: "media-1", media_type: "IMAGE", permalink: "https://instagram.com/p/x", timestamp: "2026-01-01T00:00:00Z" }),
        { status: 200 },
      ),
    );

    try {
      const res = await app.request(`/api/social-accounts/${socialAccountId}/instagram/posts/media-1`, {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { id: string } };
      expect(body.data.id).toBe("media-1");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("gets post insights for a connected account", async () => {
    const { token, userId } = await registerAndLogin();
    await connectFakeInstagramAccount(userId);
    const socialAccountId = await findSocialAccountId(token);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ data: [{ name: "reach", period: "lifetime", values: [{ value: 42 }] }] }),
        { status: 200 },
      ),
    );

    try {
      const res = await app.request(`/api/social-accounts/${socialAccountId}/instagram/posts/media-1/insights?metrics=reach`, {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { data: { name: string; values: { value: number }[] }[] } };
      expect(body.data.data[0]?.name).toBe("reach");
      expect(body.data.data[0]?.values[0]?.value).toBe(42);
      expect(String(fetchSpy.mock.calls[0]![0])).toContain("metric=reach");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("maps an upstream Instagram API error to a 502", async () => {
    const { token, userId } = await registerAndLogin();
    await connectFakeInstagramAccount(userId);
    const socialAccountId = await findSocialAccountId(token);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid OAuth access token." } }), { status: 400 }),
    );

    try {
      const res = await app.request(`/api/social-accounts/${socialAccountId}/instagram/posts/media-1`, {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(502);
      const body = (await res.json()) as { message: string };
      expect(body.message).toBe("Invalid OAuth access token.");
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
