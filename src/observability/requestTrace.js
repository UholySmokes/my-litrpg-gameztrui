function randomHex(bytes) {
  const array = new Uint8Array(bytes);
  if (globalThis?.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createRequestTraceContext() {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return {
    traceId,
    spanId,
    traceparent: `00-${traceId}-${spanId}-01`,
  };
}

export function buildTraceHeaders(trace) {
  if (!trace) return {};
  return {
    "X-Trace-Id": trace.traceId,
    "X-Span-Id": trace.spanId,
    Traceparent: trace.traceparent,
  };
}
