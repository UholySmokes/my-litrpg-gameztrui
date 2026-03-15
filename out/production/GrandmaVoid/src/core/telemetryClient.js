function normalizeUserId(user) {
  if (!user || typeof user !== "object") return "";
  return String(user.uid || user.id || user.userId || "").trim();
}

function normalizeUserEmail(user) {
  if (!user || typeof user !== "object") return "";
  return String(user.email || user.mail || "").trim();
}

export function createTelemetryEvent(type, { level = "info", message = null, data } = {}) {
  return {
    type,
    level,
    ts: new Date().toISOString(),
    message,
    data,
  };
}

export async function postTelemetryBatch({
  source = "web",
  user = null,
  tags = {},
  events = [],
} = {}) {
  if (typeof fetch !== "function") return { ok: false, skipped: true };
  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, skipped: true };
  }

  const headers = {
    "Content-Type": "application/json",
  };
  const userId = normalizeUserId(user);
  const userEmail = normalizeUserEmail(user);
  if (userId) headers["x-dev-user-id"] = userId;
  if (userEmail) headers["x-dev-user-email"] = userEmail;

  try {
    const response = await fetch("/api/telemetry", {
      method: "POST",
      headers,
      body: JSON.stringify({
        source,
        sessionId: "character-creation-web",
        build: "web",
        clientTime: new Date().toISOString(),
        tags,
        events,
      }),
    });

    return { ok: response.ok, skipped: false };
  } catch {
    return { ok: false, skipped: false };
  }
}
