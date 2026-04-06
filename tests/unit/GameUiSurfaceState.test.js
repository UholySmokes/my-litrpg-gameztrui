import { describe, expect, it } from "@jest/globals";
import { resolveGameUiSurfaceState } from "../../src/components/gameui/gameUiSurfaceState.js";

describe("resolveGameUiSurfaceState", () => {
  it("falls back to the character hub when adventure is selected without a created character", () => {
    expect(
      resolveGameUiSurfaceState({
        activeSurface: "adventure",
        characterCreated: false,
        hasCharacterSnapshot: false,
        isTransitioning: false,
      }),
    ).toEqual({
      shouldShowAdventure: false,
      shouldShowCreation: false,
      shouldShowHub: true,
    });
  });

  it("keeps the creation shell visible during the post-creation transition", () => {
    expect(
      resolveGameUiSurfaceState({
        activeSurface: "adventure",
        characterCreated: false,
        hasCharacterSnapshot: true,
        isTransitioning: true,
      }),
    ).toEqual({
      shouldShowAdventure: false,
      shouldShowCreation: true,
      shouldShowHub: false,
    });
  });

  it("shows adventure only when a created character exists", () => {
    expect(
      resolveGameUiSurfaceState({
        activeSurface: "adventure",
        characterCreated: true,
        hasCharacterSnapshot: false,
        isTransitioning: false,
      }),
    ).toEqual({
      shouldShowAdventure: true,
      shouldShowCreation: false,
      shouldShowHub: false,
    });
  });
});