import { describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleCors } = require("../../functions/lib/cors.js");

function createRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
  };
  res.set = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.send = jest.fn((value) => {
    res.body = value;
    return res;
  });
  return res;
}

describe("cors", () => {
  it("allows void-verse preflight requests to the fallback host", () => {
    const req = {
      method: "OPTIONS",
      headers: {
        origin: "https://void-verse.com",
        host: "my-litrpg-gameztrui-3416-da75c.web.app",
        "x-forwarded-proto": "https",
      },
    };
    const res = createRes();

    const handled = handleCors(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(204);
    expect(res.headers["Access-Control-Allow-Origin"]).toBe(
      "https://void-verse.com",
    );
    expect(res.headers["Access-Control-Allow-Methods"]).toContain("OPTIONS");
    expect(res.headers["Access-Control-Allow-Headers"]).toContain(
      "Authorization",
    );
    expect(res.body).toBe("");
  });
});
