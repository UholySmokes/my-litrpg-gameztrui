const { handleApiRequest, MAX_BODY_SIZE } = require("../../functions/lib/api-router");

// Stub rate-limit to always allow
jest.mock("../../functions/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, limit: 60, remaining: 59 }),
  resetRateLimitStore: () => {},
}));

function mockReq(overrides = {}) {
  return {
    url: overrides.url || "/api/health",
    method: overrides.method || "GET",
    headers: overrides.headers || {},
    body: overrides.body ?? undefined,
    ip: "127.0.0.1",
    ...overrides,
  };
}

function mockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    status(code) { res._status = code; return res; },
    set(k, v) { res._headers[k] = v; return res; },
    json(body) { res._body = body; return res; },
  };
  return res;
}

describe("Body size validation", () => {
  test("MAX_BODY_SIZE is exported and equals 100KB", () => {
    expect(MAX_BODY_SIZE).toBe(100 * 1024);
  });

  test("GET request with no body passes through", async () => {
    const req = mockReq({ url: "/api/health", method: "GET" });
    const res = mockRes();
    await handleApiRequest(req, res);
    expect(res._status).toBe(200);
  });

  test("small POST body passes through to route matching", async () => {
    const req = mockReq({
      url: "/api/health",
      method: "GET",
      body: { data: "small" },
    });
    const res = mockRes();
    await handleApiRequest(req, res);
    // Should reach route handler (health returns 200)
    expect(res._status).not.toBe(413);
  });

  test("Content-Length header over limit is rejected with 413", async () => {
    const req = mockReq({
      url: "/api/narrate",
      method: "POST",
      headers: { "content-length": String(MAX_BODY_SIZE + 1) },
      body: { x: 1 },
    });
    const res = mockRes();
    await handleApiRequest(req, res);
    expect(res._status).toBe(413);
    expect(res._body.errorCode).toBe("PAYLOAD_TOO_LARGE");
  });

  test("body exceeding 100KB is rejected with 413", async () => {
    const largeBody = "x".repeat(MAX_BODY_SIZE + 1);
    const req = mockReq({
      url: "/api/narrate",
      method: "POST",
      body: largeBody,
    });
    const res = mockRes();
    await handleApiRequest(req, res);
    expect(res._status).toBe(413);
    expect(res._body.errorCode).toBe("PAYLOAD_TOO_LARGE");
  });

  test("object body exceeding 100KB is rejected with 413", async () => {
    const largeObj = { data: "x".repeat(MAX_BODY_SIZE) };
    const req = mockReq({
      url: "/api/narrate",
      method: "POST",
      body: largeObj,
    });
    const res = mockRes();
    await handleApiRequest(req, res);
    expect(res._status).toBe(413);
    expect(res._body.errorCode).toBe("PAYLOAD_TOO_LARGE");
  });

  test("body exactly at limit passes through", async () => {
    const req = mockReq({
      url: "/api/health",
      method: "GET",
      body: "x".repeat(MAX_BODY_SIZE),
    });
    const res = mockRes();
    await handleApiRequest(req, res);
    expect(res._status).not.toBe(413);
  });
});
