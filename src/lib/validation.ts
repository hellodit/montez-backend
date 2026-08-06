import type { Context } from 'hono'
import { z } from 'zod'

export type ValidationErrors = Record<string, string[] | undefined>
export type ParseResult<T> = { ok: true; data: T } | { ok: false; errors: ValidationErrors }

export async function parseBody<T extends z.ZodType>(
  c: Context,
  schema: T,
): Promise<ParseResult<z.infer<T>>> {
  const raw = await c.req.json().catch(() => null)
  return validateRequest(schema, raw)
}

export function parseQueryParams<T extends z.ZodType>(c: Context, schema: T): ParseResult<z.infer<T>> {
  return validateRequest(schema, c.req.query())
}

/** Validasi path param (`/:id`) — nilai selalu string, jadi schema perlu coerce. */
export function parseParam<T extends z.ZodType>(c: Context, schema: T): ParseResult<z.infer<T>> {
  return validateRequest(schema, c.req.param())
}

/**
 * PK semua tabel domain = bigserial (number) → param URL & id di body wajib
 * di-coerce. Satu factory supaya pesan error konsisten di semua module.
 */
export function idParam(label: string) {
  return z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be an integer.`)
    .positive(`${label} must be a positive number.`)
}

function validateRequest<T extends z.ZodType>(schema: T, raw: unknown): ParseResult<z.infer<T>> {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }
  }
  return { ok: true, data: parsed.data }
}
