function randomHex(length) {
  if (globalThis?.crypto?.getRandomValues) {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, length);
  }

  let fallback = "";
  while (fallback.length < length) {
    fallback += Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
  }
  return fallback.slice(0, length);
}

export function createRequestTraceContext() {
  return {
    traceId: randomHex(32),
    spanId: randomHex(16),
  };
}

export function buildTraceHeaders(traceContext) {
  if (!traceContext || typeof traceContext !== "object") {
    return {};
  }

  const headers = {};
  if (typeof traceContext.traceId === "string" && traceContext.traceId.trim()) {
    headers["X-Trace-Id"] = traceContext.traceId.trim();
  }
  if (typeof traceContext.spanId === "string" && traceContext.spanId.trim()) {
    headers["X-Span-Id"] = traceContext.spanId.trim();
  }
  if (
    typeof traceContext.parentSpanId === "string" &&
    traceContext.parentSpanId.trim()
  ) {
    headers["X-Parent-Span-Id"] = traceContext.parentSpanId.trim();
  }
  return headers;
}
