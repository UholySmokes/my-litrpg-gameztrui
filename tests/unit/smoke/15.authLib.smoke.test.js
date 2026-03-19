import { createRequire } from "node:module";
import { describe, expect, it } from "@jest/globals";

const require = createRequire(import.meta.url);
const {
  isDevAuthEnabled,
  isProductionEnvironment,
  getUserFromRequest,
} = require("../../../functions/lib/auth.js");

describe("smoke: functions auth", () => {
  it("exports auth helpers", async () => {
    expect(typeof isDevAuthEnabled).toBe("function");
    expect(typeof isProductionEnvironment).toBe("function");
    const user = await getUserFromRequest({ headers: {} });
    expect(user === null || typeof user === "object").toBe(true);
  });
});
