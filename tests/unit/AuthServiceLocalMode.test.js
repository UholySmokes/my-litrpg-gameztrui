import { afterEach, describe, expect, it } from "@jest/globals";
import {
  getChronicleSessionHeaders,
  getDevAuthHeaders,
} from "../../src/core/AuthService.js";

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

  it("creates and reuses a chronicle session header for guest narration", () => {
    const storage = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    };

    const first = getChronicleSessionHeaders();
    const second = getChronicleSessionHeaders();

    expect(typeof first["x-chronicle-session-id"]).toBe("string");
    expect(first["x-chronicle-session-id"].length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });
});
