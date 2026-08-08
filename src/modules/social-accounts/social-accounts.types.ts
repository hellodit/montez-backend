import type { accountCredentials, socialAccounts } from "../../db/schema";

/** Baris social_accounts penuh seperti dikembalikan Drizzle. */
export type SocialAccount = typeof socialAccounts.$inferSelect;

/** Baris account_credentials penuh — TIDAK PERNAH dikirim langsung ke client. */
export type AccountCredential = typeof accountCredentials.$inferSelect;

/** Bentuk yang dikirim ke client: tanpa access token, ditambah flag koneksi. */
export type SocialAccountSummary = Pick<
  SocialAccount,
  "id" | "platform" | "username" | "displayName" | "followerCount" | "createdAt"
> & { connected: boolean };
