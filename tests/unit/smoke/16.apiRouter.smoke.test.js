import { createRequire } from "node:module";
import { describe, expect, it } from "@jest/globals";

const require = createRequire(import.meta.url);
const { handleApiRequest, MAX_BODY_SIZE } = require("../../../functions/lib/api-router.js");

describe("smoke: functions api-router", () => {
  it("exports router function and size limit", () => {
    expect(typeof handleApiRequest).toBe("function");
    expect(MAX_BODY_SIZE).toBeGreaterThan(0);
  });
});
