import type { MiddlewareHandler } from "hono";
import { redactDeep } from "../lib/redact";

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
