import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "../db/client";
import { session as sessionTable } from "../db/schema";
import { unauthorized } from "./errors";

/**
 * Beberapa endpoint better-auth (link-social/oauth2-link, unlink-account, dst.)
 * mensyaratkan session asli better-auth (cookie atau bearer sessionToken), bukan
 * JWT yang dipakai `requireAuth`. Controller di sini hanya punya userId dari JWT,
 * jadi kita ambil session aktif terbaru milik user itu dari DB dan pakai token-nya
 * sebagai bearer — pola yang sama dengan `withJwt()` di modules/auth/auth.helper.ts.
 */
export async function betterAuthSessionHeaders(userId: string): Promise<Headers> {
  const [active] = await db
    .select({ token: sessionTable.token })
    .from(sessionTable)
    .where(and(eq(sessionTable.userId, userId), gt(sessionTable.expiresAt, new Date())))
    .orderBy(desc(sessionTable.createdAt))
    .limit(1);

  if (!active) throw unauthorized("Session expired. Please log in again.");
  return new Headers({ authorization: `Bearer ${active.token}` });
}
