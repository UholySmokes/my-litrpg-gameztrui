import { describe, expect, it } from "@jest/globals";
import handler from "../../api/[...path].js";

function createReq({ method = "GET", url = "/api/health", headers = {} } = {}) {
  return {
    method,
    url,
    headers,
    [Symbol.asyncIterator]: async function* iterator() {},
  };
}

function createRes() {
  let body = "";
  const headers = new Map();

  return {
    statusCode: 200,
    writableEnded: false,
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    end(chunk = "") {
      body += String(chunk || "");
      this.writableEnded = true;
    },
    get body() {
      return body;
    },
  };
}

describe("Vercel API handler adapter", () => {
  it("adapts the Vercel response object for the shared API router", async () => {
    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.getHeader("content-type")).toBe("application/json");
    expect(res.getHeader("x-trace-id")).toBeTruthy();
    expect(JSON.parse(res.body)).toEqual(
      expect.objectContaining({
        ok: true,
        service: "void-verse-firebase-api",
      }),
    );
  });
});
