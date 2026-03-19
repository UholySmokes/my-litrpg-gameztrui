import { createRequire } from "node:module";
import { describe, expect, it } from "@jest/globals";

const require = createRequire(import.meta.url);
const { checkRateLimit, getClientIp } = require("../../../functions/lib/rate-limit.js");

describe("smoke: functions rate-limit", () => {
  it("calculates per-request limits", () => {
    const req = { url: "/api/test", headers: { "x-forwarded-for": "127.0.0.1" } };
    const result = checkRateLimit(req, { maxRequests: 2, narrationMaxRequests: 2, windowMs: 1000 });
    expect(result.allowed).toBe(true);
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
