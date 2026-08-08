import { env } from "../config";
import { redactDeep } from "../lib/redact";

export interface OutboundRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, string | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

export class HttpClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HttpClientError";
    this.status = status;
    this.body = body;
  }
}

function buildUrl(url: string, query?: Record<string, string | undefined>): URL {
  const u = new URL(url);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) u.searchParams.set(key, value);
    }
  }
  return u;
}

function logOutbound(entry: Record<string, unknown>) {
  console.log(JSON.stringify({ time: new Date().toISOString(), level: "info", type: "http_outbound", ...entry }));
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** $fetch untuk pihak ketiga: log request & response, timeout, redact field sensitif (token, dst). */
export async function outboundRequest<T>(url: string, options: OutboundRequestOptions = {}): Promise<T> {
  const { method = "GET", headers, query, body, timeoutMs = env.TOOL_FETCH_TIMEOUT_MS } = options;
  const fullUrl = buildUrl(url, query);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  const requestLog = {
    method,
    url: `${fullUrl.origin}${fullUrl.pathname}`,
    query: redactDeep(Object.fromEntries(fullUrl.searchParams)),
    body: body !== undefined ? redactDeep(body) : undefined,
  };

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    logOutbound({
      request: requestLog,
      durationMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const data = parseBody(await res.text());

  logOutbound({
    request: requestLog,
    response: { status: res.status, body: redactDeep(data) },
    durationMs: Math.round(performance.now() - start),
  });

  if (!res.ok) throw new HttpClientError(`Request failed with status ${res.status}`, res.status, data);
  return data as T;
}
