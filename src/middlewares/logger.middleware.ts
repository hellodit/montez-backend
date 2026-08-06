import type { MiddlewareHandler } from "hono";



const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
]);

const MAX_BODY_CHARS = 10_000;
const LOG_BODY = process.env.LOG_HTTP_BODY !== "false"; // default: aktif

function headersToObject(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((value, key) => {
    out[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  });
  return out;
}

/**
 * Nama field yang nilainya tidak boleh muncul di log (dibandingkan lowercase).
 * Tambah field domain-spesifik di sini bila perlu.
 */
const SENSITIVE_FIELDS = new Set([
  "content", // isi pesan chat & chunk dokumen (PII)
  "email", // PII customer/contact — jangan di-log (CLAUDE.md §9)
  "user_id", // widget chat: identifier customer = email (PII)
  "userid",
  "phone_number", // PII customer/contact
  "phonenumber",
  "persona", // system prompt agent
  "auth_config", // credential tool eksternal (terenkripsi pun jangan di-log)
  "authconfig",
  "headers", // map header statis tool/mcp/webhook — bisa berisi kredensial (Authorization)
  "api_key",
  "apikey",
  "access_key",
  "accesskey",
  "secret_key",
  "secretkey",
  "encryption_key",
]);

/** Sensitif bila nama field ada di set, atau mengandung pola rahasia umum. */
function isSensitiveField(key: string): boolean {
  const k = key.toLowerCase();
  if (SENSITIVE_FIELDS.has(k)) return true;
  return /(password|passwd|secret|token|credential)/.test(k);
}

/** Ganti nilai field sensitif jadi "[REDACTED]", rekursif (objek & array). */
function redactDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveField(k) ? "[REDACTED]" : redactDeep(v);
    }
    return out;
  }
  return value;
}

/** Hanya body teks/JSON yang aman dibaca; stream & binary di-skip. */
function isLoggableBody(contentType: string | null): boolean {
  if (!contentType) return false;
  if (/text\/event-stream/i.test(contentType)) return false; // SSE
  return /(application\/json|text\/|application\/x-www-form-urlencoded)/i.test(
    contentType,
  );
}

/** Baca body dari clone tanpa mengonsumsi original; aman & defensif. */
async function captureBody(raw: Request | Response): Promise<unknown> {
  if (!LOG_BODY) return undefined;
  const contentType = raw.headers.get("content-type");
  if (!isLoggableBody(contentType)) {
    return contentType ? `[skipped: ${contentType}]` : undefined;
  }
  try {
    const text = await raw.clone().text();
    if (!text) return undefined;

    const truncated = text.length > MAX_BODY_CHARS;
    const slice = truncated ? text.slice(0, MAX_BODY_CHARS) : text;

    if (/application\/json/i.test(contentType!)) {
      try {
        const json = JSON.parse(slice);
        return truncated
          ? { _truncated: true, raw: slice }
          : redactDeep(json);
      } catch {
        return slice; // JSON tak valid → simpan apa adanya
      }
    }
    return truncated ? `${slice}…[truncated]` : slice;
  } catch {
    return "[unreadable]";
  }
}

export const httpLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = performance.now();

    const hasReqBody = ["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method);
    const requestBody = hasReqBody ? await captureBody(c.req.raw) : undefined;

    await next();

    const ms = Math.round(performance.now() - start);
    const url = new URL(c.req.url);

    const entry = {
      time: new Date().toISOString(),
      level: "info",
      type: "http",
      durationMs: ms,
      request: {
        method: c.req.method,
        path: url.pathname,
        // Query bisa membawa field sensitif (mis. user_id = email) → redact.
        query: redactDeep(Object.fromEntries(url.searchParams)),
        headers: headersToObject(c.req.raw.headers),
        body: requestBody,
      },
      response: {
        status: c.res.status,
        headers: headersToObject(c.res.headers),
        body: await captureBody(c.res),
      },
    };

    console.log(JSON.stringify(entry));
  };
};
