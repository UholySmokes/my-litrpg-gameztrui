const crypto = require("crypto");

function normalizeHeaderValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString("hex");
}

function normalizeTraceId(value) {
  const normalized = normalizeHeaderValue(value).toLowerCase();
  return /^[0-9a-f]{32}$/.test(normalized) ? normalized : randomHex(16);
}

function normalizeSpanId(value) {
  const normalized = normalizeHeaderValue(value).toLowerCase();
  return /^[0-9a-f]{16}$/.test(normalized) ? normalized : randomHex(8);
}

function createRequestTraceContext(req) {
  const headers = req?.headers || {};
  const traceId = normalizeTraceId(
    headers["x-trace-id"] || headers["traceparent"]?.split("-")?.[1],
  );
  const spanId = normalizeSpanId(headers["x-span-id"]);
  const traceparent = `00-${traceId}-${spanId}-01`;
  return {
    traceId,
    spanId,
    traceparent,
  };
}

function attachTraceHeaders(res, trace) {
  if (!res || typeof res.set !== "function" || !trace) return;
  res.set("X-Trace-Id", trace.traceId);
  res.set("X-Span-Id", trace.spanId);
  res.set("Traceparent", trace.traceparent);
}

function withTraceBody(body, trace) {
  if (!trace || !body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }
  if (body.trace) return body;
  return {
    ...body,
    trace: {
      traceId: trace.traceId,
      spanId: trace.spanId,
    },
  };
}

module.exports = {
  attachTraceHeaders,
  createRequestTraceContext,
  withTraceBody,
};
