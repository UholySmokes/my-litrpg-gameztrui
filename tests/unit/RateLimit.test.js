const {
  checkRateLimit,
  DEFAULT_CONFIG,
  getClientIp,
  _resetStore,
} = require("../../functions/lib/rate-limit");

beforeEach(() => _resetStore());

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } };
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to req.ip", () => {
    const req = { headers: {}, ip: "10.0.0.1" };
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("falls back to remoteAddress", () => {
    const req = { headers: {}, connection: { remoteAddress: "10.0.0.2" } };
    expect(getClientIp(req)).toBe("10.0.0.2");
  });

  it('returns "unknown" when no IP info is available', () => {
    expect(getClientIp({ headers: {} })).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const req = { headers: { "x-forwarded-for": "1.1.1.1" }, url: "/api/health" };
    for (let i = 0; i < DEFAULT_CONFIG.maxRequests; i++) {
      const r = checkRateLimit(req);
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks requests exceeding the limit", () => {
    const req = { headers: { "x-forwarded-for": "2.2.2.2" }, url: "/api/health" };
    for (let i = 0; i < DEFAULT_CONFIG.maxRequests; i++) {
      checkRateLimit(req);
    }
    const result = checkRateLimit(req);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("applies stricter limit for narration endpoints", () => {
    const req = { headers: { "x-forwarded-for": "3.3.3.3" }, url: "/api/narrate" };
    for (let i = 0; i < DEFAULT_CONFIG.narrationMaxRequests; i++) {
      const r = checkRateLimit(req);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit(req);
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(DEFAULT_CONFIG.narrationMaxRequests);
  });

  it("applies stricter limit for /story/ endpoints", () => {
    const req = { headers: { "x-forwarded-for": "4.4.4.4" }, url: "/api/story/event" };
    for (let i = 0; i < DEFAULT_CONFIG.narrationMaxRequests; i++) {
      checkRateLimit(req);
    }
    expect(checkRateLimit(req).allowed).toBe(false);
  });

  it("resets window after windowMs elapses", () => {
    const req = { headers: { "x-forwarded-for": "5.5.5.5" }, url: "/api/health" };
    const shortWindow = { windowMs: 100, maxRequests: 2, narrationMaxRequests: 1 };

    checkRateLimit(req, shortWindow);
    checkRateLimit(req, shortWindow);
    expect(checkRateLimit(req, shortWindow).allowed).toBe(false);

    // Simulate time passing by manipulating Date.now
    const realNow = Date.now;
    Date.now = () => realNow() + 200;
    try {
      const result = checkRateLimit(req, shortWindow);
      expect(result.allowed).toBe(true);
    } finally {
      Date.now = realNow;
    }
  });

  it("tracks different IPs independently", () => {
    const reqA = { headers: { "x-forwarded-for": "6.6.6.6" }, url: "/api/health" };
    const reqB = { headers: { "x-forwarded-for": "7.7.7.7" }, url: "/api/health" };
    const cfg = { maxRequests: 2, narrationMaxRequests: 1 };

    checkRateLimit(reqA, cfg);
    checkRateLimit(reqA, cfg);
    expect(checkRateLimit(reqA, cfg).allowed).toBe(false);
    expect(checkRateLimit(reqB, cfg).allowed).toBe(true);
  });

  it("returns correct remaining count", () => {
    const req = { headers: { "x-forwarded-for": "8.8.8.8" }, url: "/api/health" };
    const cfg = { maxRequests: 5, narrationMaxRequests: 2 };

    const r1 = checkRateLimit(req, cfg);
    expect(r1.remaining).toBe(4);
    checkRateLimit(req, cfg);
    checkRateLimit(req, cfg);
    const r3 = checkRateLimit(req, cfg);
    expect(r3.remaining).toBe(1);
  });
});
