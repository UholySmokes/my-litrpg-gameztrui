import { describe, it, expect } from "@jest/globals";
import { withTraceSpan } from "../../src/observability/traceShim.js";

describe("traceShim", () => {
  it("acts as a no-op when no tracer is set", () => {
    delete globalThis.__LITRPG_TRACER__;

    const value = withTraceSpan("test", { a: 1 }, () => 123);
    expect(value).toBe(123);
  });

  it("uses startActiveSpan when tracer exists", () => {
    const calls = [];
    globalThis.__LITRPG_TRACER__ = {
      startActiveSpan: (name, options, fn) => {
        calls.push({ name, options });
        const span = {
          end: () => calls.push({ end: true }),
        };
        return fn(span);
      },
    };

    const value = withTraceSpan("demo", { hello: "world" }, () => "ok");
    expect(value).toBe("ok");
    expect(calls[0].name).toBe("demo");
    expect(calls[0].options.attributes.hello).toBe("world");
    expect(calls.some((c) => c.end)).toBe(true);

    delete globalThis.__LITRPG_TRACER__;
  });
});
