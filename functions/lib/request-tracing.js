const crypto = require("crypto");

function randomHex(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function normalizeHeaderValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validTraceId(value) {
  return /^[0-9a-f]{32}$/i.test(value);
}

function validSpanId(value) {
  return /^[0-9a-f]{16}$/i.test(value);
}

function createTraceContext(req) {
  const headers = req?.headers || {};
  const traceId = normalizeHeaderValue(headers["x-trace-id"]);
  const parentSpanId = normalizeHeaderValue(headers["x-span-id"]);
  return {
    traceId: validTraceId(traceId) ? traceId : randomHex(32),
    spanId: randomHex(16),
    parentSpanId: validSpanId(parentSpanId) ? parentSpanId : null,
  };
}

function attachTraceHeaders(res, traceContext) {
  if (!res || !traceContext) return;
  res.set("X-Trace-Id", traceContext.traceId);
  res.set("X-Span-Id", traceContext.spanId);
  if (traceContext.parentSpanId) {
    res.set("X-Parent-Span-Id", traceContext.parentSpanId);
  }
}

function withTraceBody(body, traceContext) {
  if (!body || typeof body !== "object" || Array.isArray(body) || !traceContext) {
    return body;
  }
  return {
    ...body,
    trace: {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      parentSpanId: traceContext.parentSpanId || null,
    },
  };
}

module.exports = {
  createTraceContext,
  createRequestTraceContext: createTraceContext,
  attachTraceContext: attachTraceHeaders,
  attachTraceHeaders,
  withTraceBody,
};
