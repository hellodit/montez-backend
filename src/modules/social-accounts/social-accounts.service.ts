import { eq } from "drizzle-orm";
import { env } from "../../config";
import { SOCIAL_PLATFORM, CREDENTIAL_PROVIDER, INSTAGRAM_OAUTH_PROVIDER_ID } from "../../db/constants";
import { db } from "../../db/client";
import { accountCredentials, socialAccounts } from "../../db/schema";
import { ownedBy } from "../../db/helpers";
import { AppError, notFound } from "../../lib/errors";
import { betterAuthSessionHeaders } from "../../lib/better-auth-session";
import { auth } from "../auth/auth";
import { exchangeLongLivedToken, fetchInstagramProfile } from "../../thirdparty/instagram/instagram";
import type { SocialAccountSummary } from "./social-accounts.types";

const CALLBACK_STATUS_PARAM = "ig_status";

/** Redirect FE dipakai untuk sukses & error — dibedakan lewat query param. */
function buildCallbackUrl(status: "connected" | "error"): string {
  const base = env.META_OAUTH_SUCCESS_REDIRECT ?? env.BETTER_AUTH_URL;
  const url = new URL(base);
  url.searchParams.set(CALLBACK_STATUS_PARAM, status);
  return url.toString();
}

function assertInstagramConfigured() {
  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    throw new AppError("Instagram connect is not configured.", 503);
  }
}

/**
 * Dipanggil dari `databaseHooks.account.create/update.after` (auth.ts) setelah
 * better-auth berhasil link akun "instagram". Tukar token panjang, ambil profil,
 * lalu upsert ke social_accounts + account_credentials. Gagal di tengah jalan =
 * tidak ada row domain yang dibuat — tidak ada state setengah jadi (lihat spec).
 */
export async function syncInstagramAccount(account: { userId: string; accountId: string }) {
  try {
    const { accessToken } = await auth.api.getAccessToken({
      body: {
        providerId: INSTAGRAM_OAUTH_PROVIDER_ID,
        userId: account.userId,
        accountId: account.accountId,
      },
    });
    const { access_token: longLivedToken } = await exchangeLongLivedToken(accessToken, env.META_APP_SECRET ?? "");
    const profile = await fetchInstagramProfile(longLivedToken);

    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(socialAccounts)
        .values({
          userId: account.userId,
          platform: SOCIAL_PLATFORM.instagram,
          username: profile.username,
          displayName: profile.name ?? null,
          followerCount: profile.followers_count ?? null,
        })
        .onConflictDoUpdate({
          target: [socialAccounts.userId, socialAccounts.platform, socialAccounts.username],
          set: {
            displayName: profile.name ?? null,
            followerCount: profile.followers_count ?? null,
            updatedAt: new Date(),
          },
        })
        .returning({ id: socialAccounts.id });

      if (!row) throw new Error("Failed to upsert social_accounts row.");

      await tx
        .insert(accountCredentials)
        .values({
          userId: account.userId,
          accountId: row.id,
          provider: CREDENTIAL_PROVIDER.meta,
          accessToken: longLivedToken,
          metaIgBusinessId: profile.id,
        })
        .onConflictDoUpdate({
          target: [accountCredentials.accountId],
          set: {
            accessToken: longLivedToken,
            metaIgBusinessId: profile.id,
            updatedAt: new Date(),
          },
        });
    });
  } catch (err) {
    console.error("[instagram-connect-sync]", account.userId, err instanceof Error ? err.message : String(err));
  }
}

/** Bangun URL authorize Instagram untuk user yang sedang login. */
export async function getInstagramConnectUrl(userId: string): Promise<{ url: string }> {
  assertInstagramConfigured();
  const headers = await betterAuthSessionHeaders(userId);

  const result = await auth.api.oAuth2LinkAccount({
    body: {
      providerId: INSTAGRAM_OAUTH_PROVIDER_ID,
      callbackURL: buildCallbackUrl("connected"),
      errorCallbackURL: buildCallbackUrl("error"),
    },
    headers,
  });

  return { url: result.url };
}

/** Akun sosial milik user — token tidak pernah ikut dikembalikan. */
export async function listSocialAccounts(userId: string): Promise<SocialAccountSummary[]> {
  const rows = await db
    .select({
      id: socialAccounts.id,
      platform: socialAccounts.platform,
      username: socialAccounts.username,
      displayName: socialAccounts.displayName,
      followerCount: socialAccounts.followerCount,
      createdAt: socialAccounts.createdAt,
      credentialId: accountCredentials.id,
    })
    .from(socialAccounts)
    .leftJoin(accountCredentials, eq(accountCredentials.accountId, socialAccounts.id))
    .where(ownedBy(socialAccounts, userId));

  return rows.map(({ credentialId, ...row }) => ({ ...row, connected: credentialId !== null }));
}

export async function findOwnedInstagramCredential(userId: string, socialAccountId: number) {
  const credential = await db.query.accountCredentials.findFirst({
    where: { accountId: socialAccountId, RAW: (t) => ownedBy(t, userId) },
  });
  if (!credential) throw notFound("Instagram connection not found.");
  return credential;
}

/**
 * Cabut akses Instagram: unlink dari better-auth lalu hapus row kredensial.
 * Row `social_accounts` & histori audit/post dibiarkan — disconnect mencabut
 * akses API, bukan menghapus riwayat.
 */
export async function disconnectInstagram(userId: string, socialAccountId: number): Promise<void> {
  const credential = await findOwnedInstagramCredential(userId, socialAccountId);

  const headers = await betterAuthSessionHeaders(userId);
  await auth.api.unlinkAccount({
    body: {
      providerId: INSTAGRAM_OAUTH_PROVIDER_ID,
      accountId: credential.metaIgBusinessId ?? undefined,
    },
    headers,
  });

  await db.delete(accountCredentials).where(eq(accountCredentials.id, credential.id));
}
