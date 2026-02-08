const isPromiseLike = (value) =>
  value && (typeof value === "object" || typeof value === "function")
    ? typeof value.then === "function"
    : false;

/**
 * Minimal tracing shim used across shared (browser+node) code.
 *
 * Node-only OpenTelemetry setup should assign:
 *   globalThis.__LITRPG_TRACER__ = opentelemetry.trace.getTracer(...)
 *
 * When unavailable (default), this becomes a no-op.
 */
export function withTraceSpan(name, attributes, fn) {
  const tracer = globalThis.__LITRPG_TRACER__;
  if (!tracer || typeof tracer.startActiveSpan !== "function") {
    return fn();
  }

  return tracer.startActiveSpan(
    String(name || "span"),
    { attributes: attributes && typeof attributes === "object" ? attributes : {} },
    (span) => {
      try {
        const result = fn(span);
        if (isPromiseLike(result)) {
          return result
            .then((value) => {
              span.end();
              return value;
            })
            .catch((error) => {
              span.recordException?.(error);
              span.setStatus?.({ code: 2, message: String(error?.message || error) });
              span.end();
              throw error;
            });
        }
        span.end();
        return result;
      } catch (error) {
        span.recordException?.(error);
        span.setStatus?.({ code: 2, message: String(error?.message || error) });
        span.end();
        throw error;
      }
    },
  );
}
