import type { user } from "../../db/schema";

/** Baris user penuh seperti dikembalikan Drizzle (source of truth = schema DB). */
export type User = typeof user.$inferSelect;

/**
 * Bentuk user yang aman dikirim ke client. Di repo ini identik dengan `User`:
 * tabel `user` (Better Auth) TIDAK menyimpan password — kredensial ada di tabel
 * `account` — jadi tak ada kolom yang perlu dibuang. Alias tetap dipakai agar
 * kalau kelak ada kolom rahasia di `user`, hanya satu tempat ini yang diubah.
 */
export type PublicUser = User;
