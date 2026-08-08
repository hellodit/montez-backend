import { HttpClientError, outboundRequest } from "../http-client";

const GRAPH_BASE = "https://graph.instagram.com";

const PROFILE_FIELDS = "id,username,name,profile_picture_url,followers_count";

const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_product_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "username",
  "like_count",
  "comments_count",
].join(",");

const DEFAULT_INSIGHTS_METRICS = ["reach", "saved", "likes", "comments", "shares", "total_interactions"];

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS" | "STORY";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramMediaPage {
  data: InstagramMedia[];
  paging?: { cursors?: { before?: string; after?: string }; next?: string };
}

export interface InstagramInsightValue {
  name: string;
  period: string;
  values: { value: number }[];
  title?: string;
  description?: string;
}

export interface InstagramInsightsResult {
  data: InstagramInsightValue[];
}

async function graphGet<T>(path: string, accessToken: string, query: Record<string, string> = {}): Promise<T> {
  try {
    return await outboundRequest<T>(`${GRAPH_BASE}${path}`, {
      query: { ...query, access_token: accessToken },
    });
  } catch (err) {
    if (err instanceof HttpClientError) {
      const message = (err.body as { error?: { message?: string } } | null)?.error?.message ?? err.message;
      throw new Error(message);
    }
    throw err;
  }
}

export function exchangeLongLivedToken(shortLivedToken: string, clientSecret: string): Promise<{ access_token: string }> {
  return graphGet<{ access_token: string }>("/access_token", shortLivedToken, {
    grant_type: "ig_exchange_token",
    client_secret: clientSecret,
  });
}

export function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  return graphGet<InstagramProfile>("/me", accessToken, { fields: PROFILE_FIELDS });
}

export function listInstagramPosts(
  accessToken: string,
  igUserId: string,
  options: { after?: string; limit?: number } = {},
): Promise<InstagramMediaPage> {
  return graphGet<InstagramMediaPage>(`/${igUserId}/media`, accessToken, {
    fields: MEDIA_FIELDS,
    limit: String(options.limit ?? 25),
    ...(options.after ? { after: options.after } : {}),
  });
}

export function getInstagramPost(accessToken: string, mediaId: string): Promise<InstagramMedia> {
  return graphGet<InstagramMedia>(`/${mediaId}`, accessToken, { fields: MEDIA_FIELDS });
}

export function getInstagramPostInsights(
  accessToken: string,
  mediaId: string,
  metrics: string[] = DEFAULT_INSIGHTS_METRICS,
): Promise<InstagramInsightsResult> {
  return graphGet<InstagramInsightsResult>(`/${mediaId}/insights`, accessToken, {
    metric: metrics.join(","),
  });
}
