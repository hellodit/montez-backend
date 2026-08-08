const SENSITIVE_FIELDS = new Set([
  "content",
  "email",
  "user_id",
  "userid",
  "phone_number",
  "phonenumber",
  "persona",
  "auth_config",
  "authconfig",
  "headers",
  "api_key",
  "apikey",
  "access_key",
  "accesskey",
  "secret_key",
  "secretkey",
  "encryption_key",
]);

function isSensitiveField(key: string): boolean {
  const k = key.toLowerCase();
  if (SENSITIVE_FIELDS.has(k)) return true;
  return /(password|passwd|secret|token|credential)/.test(k);
}

export function redactDeep(value: unknown): unknown {
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
