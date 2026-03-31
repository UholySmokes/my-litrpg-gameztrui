import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const runtime = require("../../functions/lib/firebase-agents/runtime.js");

const ENV_KEYS = [
  "AI_TEXT_PROVIDER",
  "OPENAI_MODEL",
  "OPENAI_ALLOWED_MODELS",
  "OPENAI_TEMPERATURE",
  "GEMINI_MODEL",
  "GENKIT_ALLOWED_MODELS",
  "GEMINI_TEMPERATURE",
  "FUNCTIONS_EMULATOR",
];

const originalEnv = {};
for (const key of ENV_KEYS) {
  originalEnv[key] = process.env[key];
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (typeof originalEnv[key] === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
}

describe("firebase agent runtime provider routing", () => {
  beforeEach(() => {
    restoreEnv();
    runtime.__resetRuntimeTestOverrides();
    process.env.AI_TEXT_PROVIDER = "openai";
    process.env.OPENAI_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_ALLOWED_MODELS = "gpt-5.4-mini,gpt-5.4";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
  });

  afterEach(() => {
    runtime.__resetRuntimeTestOverrides();
    restoreEnv();
  });

  it("uses OpenAI as primary for narration agents", async () => {
    const openAiExecutor = jest.fn(async () => ({
      backend: "openai-responses",
      text: "You step into the misted corridor.",
    }));
    const geminiExecutor = jest.fn(async () => ({
      backend: "google-ai-studio",
      text: "fallback text",
    }));

    runtime.__setRuntimeTestOverrides({
      executeOpenAiProvider: openAiExecutor,
      executeGeminiProvider: geminiExecutor,
    });

    const result = await runtime.runFirebaseAgent({
      agent: "narrator",
      input: { game_state: { location: "Ashen Gate" } },
    });

    expect(openAiExecutor).toHaveBeenCalledTimes(1);
    expect(geminiExecutor).not.toHaveBeenCalled();
    expect(result.backend).toBe("openai-responses");
    expect(result.fallbackUsed).toBe(false);
    expect(result.model).toBe("gpt-5.4-mini");
  });

  it("falls back to Gemini on retryable OpenAI failure", async () => {
    const openAiExecutor = jest.fn(async () => {
      const error = new Error("rate limited");
      error.status = 429;
      error.code = "RATE_LIMITED";
      throw error;
    });
    const geminiExecutor = jest.fn(async () => ({
      backend: "google-ai-studio",
      text: "The lanterns flare as you brace for impact.",
    }));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    runtime.__setRuntimeTestOverrides({
      executeOpenAiProvider: openAiExecutor,
      executeGeminiProvider: geminiExecutor,
    });

    const result = await runtime.runFirebaseAgent({
      agent: "combat",
      input: { combat_state: { turn: 1 } },
    });

    expect(openAiExecutor).toHaveBeenCalledTimes(1);
    expect(geminiExecutor).toHaveBeenCalledTimes(1);
    expect(result.backend).toBe("google-ai-studio");
    expect(result.fallbackUsed).toBe(true);
    expect(result.fallbackFrom).toBe("openai-responses");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("does not fall back on deterministic OpenAI request failures", async () => {
    const openAiExecutor = jest.fn(async () => {
      const error = new Error("invalid request payload");
      error.status = 400;
      error.code = "BAD_REQUEST";
      throw error;
    });
    const geminiExecutor = jest.fn(async () => ({
      backend: "google-ai-studio",
      text: "fallback",
    }));

    runtime.__setRuntimeTestOverrides({
      executeOpenAiProvider: openAiExecutor,
      executeGeminiProvider: geminiExecutor,
    });

    await expect(
      runtime.runFirebaseAgent({
        agent: "dialogue",
        input: { npc_context: { name: "Mara" } },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
    });

    expect(openAiExecutor).toHaveBeenCalledTimes(1);
    expect(geminiExecutor).not.toHaveBeenCalled();
  });

  it("enforces OpenAI allowlist before execution", async () => {
    process.env.OPENAI_ALLOWED_MODELS = "gpt-5.4-mini";
    const openAiExecutor = jest.fn(async () => ({
      backend: "openai-responses",
      text: "should not run",
    }));

    runtime.__setRuntimeTestOverrides({
      executeOpenAiProvider: openAiExecutor,
    });

    await expect(
      runtime.runFirebaseAgent({
        agent: "world",
        input: { world_context: { zone: "mistwood" } },
        model: "gpt-5.4",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "MODEL_NOT_ALLOWED",
      allowedModels: ["gpt-5.4-mini"],
    });

    expect(openAiExecutor).not.toHaveBeenCalled();
  });

  it("uses a local emulator fallback when provider credentials are unavailable", async () => {
    process.env.FUNCTIONS_EMULATOR = "true";
    const openAiExecutor = jest.fn(async () => {
      const error = new Error("Missing OpenAI API key. Set OPENAI_API_KEY for OpenAI provider execution.");
      error.status = 500;
      error.code = "OPENAI_API_KEY_MISSING";
      throw error;
    });
    const geminiExecutor = jest.fn(async () => {
      const error = new Error("API key not valid. Please pass a valid API key.");
      error.status = 400;
      throw error;
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    runtime.__setRuntimeTestOverrides({
      executeOpenAiProvider: openAiExecutor,
      executeGeminiProvider: geminiExecutor,
    });

    const result = await runtime.runFirebaseAgent({
      agent: "narrator",
      input: { game_state: { location: "Ashen Gate" } },
    });

    expect(openAiExecutor).toHaveBeenCalledTimes(1);
    expect(geminiExecutor).toHaveBeenCalledTimes(1);
    expect(result.backend).toBe("local-emulator-fallback");
    expect(result.fallbackUsed).toBe(true);
    expect(result.fallbackFrom).toBe("google-ai-studio");
    expect(result.structured?.narrative).toContain("local emulator");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
