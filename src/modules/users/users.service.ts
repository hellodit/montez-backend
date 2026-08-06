import { APIError } from "better-auth/api";
import { count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "../../db/client";
import { user } from "../../db/schema";
import { uniqueViolationConstraint } from "../../lib/db-errors";
import { AppError, conflict, forbidden, notFound } from "../../lib/errors";
import { auth } from "../auth/auth";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./users.schema";
import type { PublicUser } from "./users.types";

// Tabel `user` (Better Auth) tak menyimpan kolom rahasia — password ada di tabel
// `account`. Jadi row penuh boleh dikembalikan; tak ada projection "kolom aman".

function matchesSearch(search?: string): SQL | undefined {
  if (!search) return undefined;
  const term = `%${search}%`;
  return or(ilike(user.name, term), ilike(user.email, term));
}

/** List semua user (admin) — pagination & search (2 query, paralel). */
export async function fetchUsers(query: ListUsersQuery) {
  const where = matchesSearch(query.search);
  const offset = (query.page - 1) * query.perPage;

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(user)
      .where(where)
      // id sebagai tie-breaker agar urutan stabil saat createdAt sama.
      .orderBy(desc(user.createdAt), desc(user.id))
      .limit(query.perPage)
      .offset(offset),
    db.select({ value: count() }).from(user).where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;
  return {
    items,
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage),
    },
  };
}

/**
 * Terjemahkan error Better Auth `signUpEmail` (APIError) → AppError agar
 * konsisten dengan error handler global. Email duplikat → 409 (samakan dengan
 * konvensi unique-violation modul ini); APIError lain → status aslinya.
 */
function translateSignUpError(err: unknown): never {
  if (err instanceof APIError) {
    const code = (err.body as { code?: string } | undefined)?.code;
    if (code === "USER_ALREADY_EXISTS") {
      throw conflict("A user with this email already exists.");
    }
    const status = (err.statusCode ?? 400) as AppError["status"];
    throw new AppError(err.body?.message ?? err.message, status);
  }
  throw err; // bukan error auth → bubble up
}

/**
 * Buat user via Better Auth (hash password + record `account`), lalu terapkan
 * flag admin-only lewat update susulan — `isAdmin` & `emailVerified` ditandai
 * `input: false` di auth.ts, jadi signUpEmail memang tak menerimanya.
 */
export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const { name, email, password, ...flags } = input;

  // ID Better Auth = string acak (bukan serial) — jangan pernah di-Number().
  let newUserId: string;
  try {
    const { response } = await auth.api.signUpEmail({
      body: { name, email, password },
      returnHeaders: true,
    });
    newUserId = response.user.id;
  } catch (err) {
    translateSignUpError(err);
  }

  if (Object.keys(flags).length > 0) {
    const [updated] = await db
      .update(user)
      .set({ ...flags, updatedAt: new Date() })
      .where(eq(user.id, newUserId))
      .returning();
    if (updated) return updated;
  }

  return findUserById(newUserId);
}

/** Detail satu user; lempar 404 bila tak ada. */
export async function findUserById(id: string): Promise<PublicUser> {
  const found = await db.query.user.findFirst({ where: { id } });
  if (!found) throw notFound("User not found.");
  return found;
}

/**
 * Guard anti lock-out: admin tak boleh menonaktifkan aksesnya sendiri.
 * Menghapus akun sendiri / mencabut admin pada akun sendiri ditolak agar tak ada
 * admin yang tak sengaja mengunci dirinya keluar dari panel.
 */
function guardSelfMutation(
  actingUserId: string,
  targetId: string,
  changes?: UpdateUserInput,
) {
  if (actingUserId !== targetId) return;

  if (!changes) {
    throw forbidden("You cannot delete your own account.");
  }
  if (changes.isAdmin === false) {
    throw forbidden("You cannot revoke your own admin access.");
  }
}

/** Update profil/flag user; tangani bentrok unik (email) → 409. */
export async function updateUser(
  actingUserId: string,
  targetId: string,
  input: UpdateUserInput,
): Promise<PublicUser> {
  guardSelfMutation(actingUserId, targetId, input);

  const existing = await db.query.user.findFirst({
    where: { id: targetId },
    columns: { id: true },
  });
  if (!existing) throw notFound("User not found.");

  const [updated] = await db
    .update(user)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(user.id, targetId))
    .returning()
    .catch(rethrowUniqueViolation);

  if (!updated) throw notFound("User not found.");
  return updated;
}

/** Hapus user; admin tak boleh menghapus akunnya sendiri. */
export async function deleteUser(actingUserId: string, targetId: string) {
  guardSelfMutation(actingUserId, targetId);

  const [deleted] = await db
    .delete(user)
    .where(eq(user.id, targetId))
    .returning({ id: user.id });

  if (!deleted) throw notFound("User not found.");
}

/** Terjemahkan unique violation Postgres (email) → AppError 409. */
function rethrowUniqueViolation(err: unknown): never {
  const constraint = uniqueViolationConstraint(err);
  if (constraint !== null) {
    const field = constraint.includes("email") ? "email" : "value";
    throw conflict(`A user with this ${field} already exists.`);
  }
  throw err;
}
