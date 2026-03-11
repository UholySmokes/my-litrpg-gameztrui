import { afterEach, describe, expect, it } from "@jest/globals";
import { getDevAuthHeaders } from "../../src/core/AuthService.js";

afterEach(() => {
  delete globalThis.window;
  delete globalThis.__RUNTIME_CONFIG__;
});

describe("AuthService local mode headers", () => {
  it("returns empty headers when no dev user is available", () => {
    const headers = getDevAuthHeaders();
    expect(headers).toEqual({});
  });

  it("returns local dev headers when local game mode is enabled", () => {
    globalThis.window = {
      localStorage: {
        getItem: (key) => (key === "localGame" ? "true" : null),
      },
    };

    const headers = getDevAuthHeaders();
    expect(headers).toEqual({
      "x-dev-user-id": "local",
      "x-dev-user-email": "local@game.dev",
    });
  });
});
