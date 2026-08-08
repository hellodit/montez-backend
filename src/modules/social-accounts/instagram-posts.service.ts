import { AppError, notFound } from "../../lib/errors";
import type { AccountCredential } from "./social-accounts.types";
import { findOwnedInstagramCredential } from "./social-accounts.service";
import {
  getInstagramPost,
  getInstagramPostInsights,
  listInstagramPosts,
  type InstagramInsightsResult,
  type InstagramMedia,
  type InstagramMediaPage,
} from "../../thirdparty/instagram/instagram";

async function withCredential<T>(
  userId: string,
  socialAccountId: number,
  fn: (credential: AccountCredential) => Promise<T>,
): Promise<T> {
  const credential = await findOwnedInstagramCredential(userId, socialAccountId);
  try {
    return await fn(credential);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(err instanceof Error ? err.message : "Instagram API request failed.", 502);
  }
}

export function listPostsForAccount(
  userId: string,
  socialAccountId: number,
  options: { after?: string; limit?: number },
): Promise<InstagramMediaPage> {
  return withCredential(userId, socialAccountId, (credential) => {
    if (!credential.metaIgBusinessId) throw notFound("Instagram connection not found.");
    return listInstagramPosts(credential.accessToken, credential.metaIgBusinessId, options);
  });
}

export function getPostForAccount(
  userId: string,
  socialAccountId: number,
  mediaId: string,
): Promise<InstagramMedia> {
  return withCredential(userId, socialAccountId, (credential) => getInstagramPost(credential.accessToken, mediaId));
}

export function getPostInsightsForAccount(
  userId: string,
  socialAccountId: number,
  mediaId: string,
  metrics?: string[],
): Promise<InstagramInsightsResult> {
  return withCredential(userId, socialAccountId, (credential) =>
    getInstagramPostInsights(credential.accessToken, mediaId, metrics),
  );
}
