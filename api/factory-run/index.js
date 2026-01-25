function toStringSafe(value) {
  return typeof value === "string" ? value : "";
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

module.exports = async function factoryRun(context, req) {
  const body = req && typeof req.body === "object" && req.body !== null ? req.body : {};

  const contentTypeInput = toStringSafe(body.contentType).trim();
  const contentType = contentTypeInput || "items";

  const count = clampInt(body.count, 1, 10, 5);

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      ok: true,
      message: "Factory API is wired.",
      received: {
        contentType,
        count
      }
    }
  };
};

