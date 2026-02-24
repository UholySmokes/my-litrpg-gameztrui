import { afterEach, describe, expect, it } from "@jest/globals";
import { __testing, isWebGameplayEnabled } from "../../src/core/WebGameplayGate.js";

afterEach(() => {
  delete globalThis.__RUNTIME_CONFIG__;
});

describe("WebGameplayGate", () => {
  it("defaults to disabled outside dev when no explicit flag exists", () => {
    expect(isWebGameplayEnabled()).toBe(false);
  });

  it("enables gameplay when runtime flag is explicitly true", () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_WEB_GAMEPLAY_ENABLED: "true",
    };
    expect(isWebGameplayEnabled()).toBe(true);
  });

  it("keeps gameplay disabled when runtime flag is explicitly false", () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_ENABLE_WEB_GAMEPLAY: "false",
    };
    expect(isWebGameplayEnabled()).toBe(false);
  });

  it("parses boolean-like flags deterministically", () => {
    expect(__testing.parseBooleanFlag("yes", false)).toBe(true);
    expect(__testing.parseBooleanFlag("off", true)).toBe(false);
    expect(__testing.parseBooleanFlag("unexpected", true)).toBe(true);
  });
});
