type NutritionSourceHttpLogSource = 'fatsecret' | 'usda';

const MAX_VALUE_LENGTH = 500;

function isEnabled(): boolean {
  return process.env.NUTRITION_SOURCE_HTTP_LOGGING === 'true';
}

function redactString(value: string): string {
  if (value.length <= MAX_VALUE_LENGTH) return value;
  return `${value.slice(0, MAX_VALUE_LENGTH)}…`;
}

function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Never log API keys / secrets.
    for (const key of ['api_key', 'access_token', 'token', 'key']) {
      if (url.searchParams.has(key)) url.searchParams.set(key, 'REDACTED');
    }
    return url.toString();
  } catch {
    return redactString(rawUrl);
  }
}

function logLine(line: unknown) {
  // eslint-disable-next-line no-console
  console.log(line);
}

function stringifyBody(body: unknown): unknown {
  if (body === undefined) return undefined;
  if (typeof body === 'string') return body;

  try {
    // Pretty-print so the full JSON shows up in logs.
    return JSON.stringify(body, null, 2);
  } catch {
    // Fall back to something loggable if stringify fails (e.g. circular).
    return String(body);
  }
}

export function logSourceRequest(source: NutritionSourceHttpLogSource, requestId: string, info: {
  method: string;
  url: string;
  note?: string;
}) {
  if (!isEnabled()) return;

  logLine({
    at: new Date().toISOString(),
    type: 'nutrition_source_http_request',
    source,
    requestId,
    method: info.method,
    url: redactUrl(info.url),
    note: info.note,
  });
}

export function logSourceResponse(source: NutritionSourceHttpLogSource, requestId: string, info: {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  body?: unknown;
}) {
  if (!isEnabled()) return;

  logLine({
    at: new Date().toISOString(),
    type: 'nutrition_source_http_response',
    source,
    requestId,
    method: info.method,
    url: redactUrl(info.url),
    status: info.status,
    durationMs: info.durationMs,
    body: stringifyBody(info.body),
  });
}

export function logSourceError(source: NutritionSourceHttpLogSource, requestId: string, info: {
  method: string;
  url: string;
  durationMs: number;
  error: unknown;
}) {
  if (!isEnabled()) return;

  const message = info.error instanceof Error ? info.error.message : String(info.error);

  logLine({
    at: new Date().toISOString(),
    type: 'nutrition_source_http_error',
    source,
    requestId,
    method: info.method,
    url: redactUrl(info.url),
    durationMs: info.durationMs,
    error: redactString(message),
  });
}

export function newRequestId(prefix: NutritionSourceHttpLogSource): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}
