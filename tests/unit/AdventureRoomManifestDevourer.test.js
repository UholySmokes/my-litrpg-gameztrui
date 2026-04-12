import { describe, expect, it } from "@jest/globals";
import { initialGameState } from "../../src/data/initialState.js";
import {
  buildAdventureRoomManifest,
  splitAdventureRooms,
} from "../../src/components/shell/adventureRoomManifest.jsx";

function createBaseView(playerOverrides = {}) {
  const player = {
    ...initialGameState.player,
    ...playerOverrides,
  };
  const state = {
    ...initialGameState,
    player,
  };

  return {
    user: null,
    state,
    player,
    config: state.config,
    quests: state.quests,
    combatState: state.combat,
    chronicle: state.chronicle,
    narrative: {
      summary: "",
      currentMood: "neutral",
      entries: [],
      latestEntry: null,
      latestEntryText: "",
      memoryRef: null,
    },
    command: {
      userInput: "",
      onInputChange: () => {},
      onSubmit: () => {},
      isLoading: false,
      error: null,
      inputRef: null,
      suggestions: [],
      onSuggestionSelect: () => {},
    },
    surfaces: {
      equipmentSelectSlot: null,
      equipmentSelectLabel: "Item",
      showBestiary: false,
      showArchetypeSystem: false,
      showDevourerCore: false,
      showGacha: false,
      showProfessions: false,
      showQuests: false,
      showReplayInspector: false,
      showSaveLoad: false,
      showShop: false,
      showStatusOverlay: false,
      showTitleSystem: false,
      handleCloseEquipmentSelect: () => {},
      handleCloseBestiary: () => {},
      handleCloseArchetypeSystem: () => {},
      handleCloseDevourerCore: () => {},
      handleCloseGacha: () => {},
      handleCloseProfessions: () => {},
      handleCloseQuests: () => {},
      handleCloseReplayInspector: () => {},
      handleCloseSaveLoad: () => {},
      handleCloseShop: () => {},
      handleCloseStatusOverlay: () => {},
      handleCloseTitleSystem: () => {},
      handleOpenEquipmentSlot: () => {},
      handleToggleArchetypeSystem: () => {},
      handleToggleDevourerCore: () => {},
    },
    actions: {},
    system: {
      onLoadState: () => {},
      addSystemMessage: () => {},
      trackUiAction: () => {},
    },
  };
}

describe("AdventureRoomManifest devourer room", () => {
  it("shows the Devourer room only for Devourer characters", () => {
    const devourerRooms = splitAdventureRooms(
      buildAdventureRoomManifest({
        view: createBaseView({
          archetypeSystem: {
            id: "devourer_core",
            name: "Devourer Core",
            category: "System",
            resource: { name: "Biomass", current: 10, max: 100, color: "#7DFFB3" },
            runtime: {},
          },
          level: 2,
        }),
        quickActionsProps: {
          onToggleArchetypeSystem: () => {},
          onToggleBestiary: () => {},
          onToggleCraft: () => {},
          onToggleDevourerCore: () => {},
          onToggleGacha: () => {},
          onToggleQuests: () => {},
          onToggleReplayInspector: () => {},
          onToggleSaveLoad: () => {},
          onToggleShop: () => {},
          onToggleStatus: () => {},
          onToggleTitles: () => {},
        },
      }),
    ).systemRooms;

    const nonDevourerRooms = splitAdventureRooms(
      buildAdventureRoomManifest({
        view: createBaseView({
          archetypeSystem: {
            id: "revival_archive",
            name: "Revival Archive",
            category: "System",
          },
          level: 2,
        }),
        quickActionsProps: {
          onToggleArchetypeSystem: () => {},
          onToggleBestiary: () => {},
          onToggleCraft: () => {},
          onToggleDevourerCore: () => {},
          onToggleGacha: () => {},
          onToggleQuests: () => {},
          onToggleReplayInspector: () => {},
          onToggleSaveLoad: () => {},
          onToggleShop: () => {},
          onToggleStatus: () => {},
          onToggleTitles: () => {},
        },
      }),
    ).systemRooms;

    expect(devourerRooms.some((room) => room.id === "devourer")).toBe(true);
    expect(devourerRooms.some((room) => room.id === "system")).toBe(true);
    expect(nonDevourerRooms.some((room) => room.id === "devourer")).toBe(false);
  });
});
