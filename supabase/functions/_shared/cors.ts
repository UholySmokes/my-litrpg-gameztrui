function normalizeOrigin(value: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function guessRequestOrigin(req: Request): string {
  const protoHeader = req.headers.get("x-forwarded-proto") || "";
  const proto = (protoHeader.split(",")[0] || "").trim() || "https";
  const host = req.headers.get("host") || "";
  if (!host) return "";
  return `${proto}://${host}`;
}

function matchesAllowedOrigin(origin: string, allowed: string): boolean {
  if (!origin || !allowed) return false;
  if (allowed === "*") return true;
  if (allowed.endsWith("*")) {
    return origin.startsWith(allowed.slice(0, -1));
  }
  if (allowed.startsWith("*.")) {
    try {
      const url = new URL(origin);
      const host = url.hostname.toLowerCase();
      const suffix = allowed.slice(1).toLowerCase();
      return host.endsWith(suffix);
    } catch {
      return false;
    }
  }
  return origin === allowed;
}

function shouldAllowOrigin(origin: string, req: Request): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const requestOrigin = guessRequestOrigin(req);
  if (requestOrigin && normalized === requestOrigin) return true;

  const configured = parseCsv(Deno.env.get("CORS_ALLOWED_ORIGINS") || "");
  const defaults = [
    "https://void-verse.com",
    "https://my-litrpg-gameztrui-3416-da75c.web.app",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:54321",
    "http://localhost:54321",
  ];

  const allowedList = configured.length > 0 ? configured : defaults;
  return allowedList.some((allowed) => matchesAllowedOrigin(normalized, allowed));
}

function applyCorsHeaders(headers: Headers, origin: string): void {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    [
      "Content-Type",
      "Authorization",
      "X-Dev-User-Id",
      "X-Dev-User-Email",
      "X-Trace-Id",
      "X-Span-Id",
      "X-Parent-Span-Id",
    ].join(", "),
  );
  headers.set(
    "Access-Control-Expose-Headers",
    [
      "X-Trace-Id",
      "X-Span-Id",
      "X-Parent-Span-Id",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "Retry-After",
    ].join(", "),
  );
  headers.set("Access-Control-Max-Age", "86400");
}

export function handleCors(req: Request, headers: Headers): boolean {
  const origin = normalizeOrigin(req.headers.get("origin") || "");
  if (!origin) return false;
  if (!shouldAllowOrigin(origin, req)) return false;

  applyCorsHeaders(headers, origin);

  if (req.method.toUpperCase() === "OPTIONS") {
    return true;
  }

  return false;
}

function parseCsv(value: string): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
