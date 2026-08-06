/**
 * Deteksi error Postgres yang punya arti bisnis, agar service bisa membalasnya
 * sebagai AppError (409/422) alih-alih bocor jadi 500.
 *
 * Drizzle membungkus error driver, jadi `code` bisa berada beberapa lapis di
 * dalam rantai `.cause` — karena itu ditelusuri, bukan dibaca sekali.
 */

const UNIQUE_VIOLATION = "23505";

type PgError = { code?: unknown; constraint?: unknown; cause?: unknown };

/** Error driver pertama di rantai `.cause` yang punya `code` tersebut. */
function findPgError(err: unknown, code: string): PgError | null {
  let current: unknown = err;
  // Batasi kedalaman: rantai cause bisa siklik pada error buatan sendiri.
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (typeof current === "object" && (current as PgError).code === code) {
      return current as PgError;
    }
    current = (current as PgError).cause;
  }
  return null;
}

/** True untuk pelanggaran UNIQUE (mis. `(agent_id, name)` pada tabel tools). */
export function isUniqueViolation(err: unknown): boolean {
  return findPgError(err, UNIQUE_VIOLATION) !== null;
}

/**
 * Nama constraint yang dilanggar bila UNIQUE, `null` bila bukan unique violation.
 * Dipakai saat satu tabel punya beberapa kolom unik dan pesan errornya harus
 * menyebut kolom mana (mis. `user_email_unique` → "email"). Bisa `""` kalau
 * driver tak menyertakan nama constraint — tetap bukan `null` (unique tetap unique).
 */
export function uniqueViolationConstraint(err: unknown): string | null {
  const pgError = findPgError(err, UNIQUE_VIOLATION);
  if (!pgError) return null;
  return typeof pgError.constraint === "string" ? pgError.constraint : "";
}
