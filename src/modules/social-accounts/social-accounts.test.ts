import { describe, expect, it, spyOn } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../../app";
import { env } from "../../config";
import { db } from "../../db/client";
import { accountCredentials, socialAccounts } from "../../db/schema";
import { auth } from "../auth/auth";
import { syncInstagramAccount } from "./social-accounts.service";

async function registerAndLogin() {
  const email = `ig${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`;
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "IG", email, password: "password123" }),
  });
  const body = (await res.json()) as { data: { token: string; user: { id: string } } };
  return { token: body.data.token, userId: body.data.user.id };
}

describe("social accounts (Instagram connect)", () => {
  it("connect requires auth", async () => {
    const res = await app.request("/api/social-accounts/instagram/connect", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("connect returns 503 when Instagram is not configured", async () => {
    const { token } = await registerAndLogin();
    const prevId = env.META_APP_ID;
    const prevSecret = env.META_APP_SECRET;
    env.META_APP_ID = undefined;
    env.META_APP_SECRET = undefined;
    try {
      const res = await app.request("/api/social-accounts/instagram/connect", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(503);
    } finally {
      env.META_APP_ID = prevId;
      env.META_APP_SECRET = prevSecret;
    }
  });

  it("connect returns the Instagram authorization URL when configured", async () => {
    const { token } = await registerAndLogin();
    const prevId = env.META_APP_ID;
    const prevSecret = env.META_APP_SECRET;
    env.META_APP_ID = "test-app-id";
    env.META_APP_SECRET = "test-app-secret";

    const spy = spyOn(auth.api, "oAuth2LinkAccount").mockResolvedValue({
      url: "https://www.instagram.com/oauth/authorize?mocked=1",
      redirect: true,
    } as never);
    try {
      const res = await app.request("/api/social-accounts/instagram/connect", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { url: string } };
      expect(body.data.url).toContain("instagram.com/oauth/authorize");
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
      env.META_APP_ID = prevId;
      env.META_APP_SECRET = prevSecret;
    }
  });

  it("list requires auth", async () => {
    const res = await app.request("/api/social-accounts");
    expect(res.status).toBe(401);
  });

  it("list returns an empty array for a fresh user", async () => {
    const { token } = await registerAndLogin();
    const res = await app.request("/api/social-accounts", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it("disconnect returns 404 when there is no Instagram connection", async () => {
    const { token } = await registerAndLogin();
    const res = await app.request("/api/social-accounts/999999/instagram", {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });
});

describe("syncInstagramAccount", () => {
  it("upserts social_accounts + account_credentials from the Instagram profile", async () => {
    const { userId } = await registerAndLogin();

    const getAccessTokenSpy = spyOn(auth.api, "getAccessToken").mockResolvedValue({
      accessToken: "short-lived-token",
      accessTokenExpiresAt: undefined,
      scopes: [],
      idToken: undefined,
    } as never);

    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes("grant_type=ig_exchange_token")) {
        return new Response(
          JSON.stringify({ access_token: "long-lived-token", token_type: "bearer", expires_in: 5184000 }),
          { status: 200 },
        );
      }
      if (url.includes("graph.instagram.com/me")) {
        return new Response(
          JSON.stringify({ id: "ig-123", username: "test_ig_user", name: "Test IG", followers_count: 42 }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      await syncInstagramAccount({ userId, accountId: "ig-123" });

      const [socialAccount] = await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
      expect(socialAccount?.username).toBe("test_ig_user");
      expect(socialAccount?.followerCount).toBe(42);

      const [credential] = await db
        .select()
        .from(accountCredentials)
        .where(eq(accountCredentials.userId, userId));
      expect(credential?.accessToken).toBe("long-lived-token");
      expect(credential?.metaIgBusinessId).toBe("ig-123");
    } finally {
      fetchSpy.mockRestore();
      getAccessTokenSpy.mockRestore();
    }
  });

  it("leaves no partial rows when the long-lived token exchange fails", async () => {
    const { userId } = await registerAndLogin();

    const getAccessTokenSpy = spyOn(auth.api, "getAccessToken").mockResolvedValue({
      accessToken: "short-lived-token",
      accessTokenExpiresAt: undefined,
      scopes: [],
      idToken: undefined,
    } as never);
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));

    try {
      await syncInstagramAccount({ userId, accountId: "ig-456" });

      const rows = await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
      expect(rows).toHaveLength(0);
    } finally {
      fetchSpy.mockRestore();
      getAccessTokenSpy.mockRestore();
    }
  });
});
