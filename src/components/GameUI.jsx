// GameUI.jsx - Technical Cleanup & Dashboard Refactor
import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useGameEngine } from "../hook/usegamestate";
import { useNarrative } from "../hook/useNarrative";
import { renderStatusBlock } from "../util/statusrenderer.js";
import CharacterGenesisUI from "./CharacterGenesisUI_Enhanced";
import HudVitals from "./HudVitals";
import ClassResourceBar from "./ClassResourceBar";
import StatusEffects from "./StatusEffects";
import ExperienceBar from "./ExperienceBar";
import EquipmentSlots from "./EquipmentSlots";
import QuestTracker from "./QuestTracker";
import AdminTools from "./AdminTools";
import CombatUI from "./CombatUI";
import { QuestManager } from "../systems/quest/QuestManager.js";
import { gachaPools } from "../data/gachaData.js";
import { getTitleBonuses } from "../systems/titles/TitleSystem.js";

const ShopUI = lazy(() => import("./ShopUI"));
const GachaUI = lazy(() => import("./GachaUI"));
const TitleUI = lazy(() => import("./TitleUI"));
const ProfessionUI = lazy(() => import("./ProfessionUI"));
const StatusOverlay = lazy(() => import("./StatusOverlay.jsx"));

const TYPEWRITER_CHAR_DELAY_MS = 28;

const renderTypewriterText = (text = "") => {
  const segments = text.split("\n");
  let globalCharIndex = 0;

  return segments.map((segment, segmentIdx) => {
    const chars = segment.split("").map((char, charIdx) => {
      const delayMs = (globalCharIndex + charIdx) * TYPEWRITER_CHAR_DELAY_MS;
      return (
        <span
          key={`char-${segmentIdx}-${charIdx}`}
          className="narrative-typewriter-char"
          style={{ animationDelay: `${delayMs}ms` }}
        >
          {char === " " ? " " : char}
        </span>
      );
    });

    globalCharIndex += segment.length + 1;

    return (
      <React.Fragment key={`segment-${segmentIdx}`}>
        {chars}
        {segmentIdx < segments.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mergeInventoryItems = (inventory = [], items = []) => {
  if (!Array.isArray(items) || items.length === 0) return [...inventory];
  const next = [...inventory];
  items.forEach((item) => {
    if (!item?.id) return;
    const quantity = toNumber(item.quantity, 1);
    const index = next.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      const existing = next[index];
      next[index] = {
        ...existing,
        quantity: toNumber(existing.quantity, 0) + quantity,
      };
    } else {
      next.push({ ...item, quantity });
    }
  });
  return next;
};

export default function GameUI() {
  // PART 1: State Sanitation - Define missing visibility states
  const [showShop, setShowShop] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showTitleSystem, setShowTitleSystem] = useState(false);
  const [showProfessions, setShowProfessions] = useState(false);
  const [characterCreated, setCharacterCreated] = useState(false);
  const [showLoadoutPanel, setShowLoadoutPanel] = useState(false);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);

  const {
    state,
    chatLog,
    addSystemMessage,
    setState,
    evaluateQuestProgress,
    dispatchSystemEvent,
  } = useGameEngine();

  const narrativeSummary = state?.narrative?.summary;
  const narrativeMemory = state?.narrative?.chatLog || [];
  const recentNarrativeEntries = narrativeMemory.slice(-10).reverse();
  const latestNarrativeEntry = narrativeMemory[narrativeMemory.length - 1];
  const latestNarrativeRawText = latestNarrativeEntry?.text || "";
  const latestNarrativeText = latestNarrativeRawText.trim();
  const latestEntryTypewriterContent = latestNarrativeRawText
    ? renderTypewriterText(latestNarrativeRawText)
    : null;
  const sanitizedNarrativeSummary = narrativeSummary?.trim() || "";
  const shouldShowNarrativeSummary =
    sanitizedNarrativeSummary.length > 0 &&
    sanitizedNarrativeSummary !== latestNarrativeText;
  const narrativeMemoryRef = useRef(null);
  useEffect(() => {
    const container = narrativeMemoryRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [narrativeMemory.length]);

  const {
    submitInput,
    isLoading,
    userInput,
    setUserInput,
    inputRef,
    actionSuggestions,
    generateInitialNarrativeText,
  } = useNarrative(
    setState,
    addSystemMessage,
    evaluateQuestProgress,
    dispatchSystemEvent,
  );

  // Event handlers - ALL hooks must be called before any conditional returns
  const handleCharacterCreationComplete = async (characterData) => {
    console.log("=== CHARACTER CREATION COMPLETE ===");
    console.log("Character data received:", characterData);

    let initialQuests = [];
    try {
      initialQuests = QuestManager.generateInitialQuests(characterData);
      console.log("Generated initial quests:", initialQuests);
    } catch (error) {
      console.error("Failed to generate initial quests:", error);
      addSystemMessage(
        "Quest generation failed, but you can continue your adventure.",
        "system",
      );
    }

    setState((prevState) => ({
      ...prevState,
      player: characterData,
      quests: {
        active: initialQuests,
        completed: [],
      },
    }));
    setCharacterCreated(true);

    // Generate initial narrative after character creation using seeded quests
    try {
      await generateInitialNarrativeText({
        ...state,
        player: characterData,
        quests: {
          active: initialQuests,
          completed: [],
        },
      });
    } catch (error) {
      console.error("Failed to generate initial narrative:", error);
      addSystemMessage(
        "Welcome to your adventure! Type commands to begin.",
        "system",
      );
    }
  };

  const handleShopPurchase = (item) => {
    const currentCurrency = state.player.currency || {};
    const currentGold = currentCurrency.goldCoins ?? state.player.gold ?? 0;
    const currentSoul =
      currentCurrency.soulpoints ?? state.player.soulpoints ?? 0;

    const titleBonuses = getTitleBonuses(state.player);
    const shopDiscount = Number.isFinite(titleBonuses.shopDiscount)
      ? Math.min(Math.max(titleBonuses.shopDiscount, 0), 0.9)
      : 0;
    const multiplier = 1 - shopDiscount;

    const baseGoldCost = item?.price?.goldCoins ?? 0;
    const baseSoulCost = item?.price?.soulpoints ?? 0;
    const goldCost =
      baseGoldCost > 0 ? Math.max(0, Math.floor(baseGoldCost * multiplier)) : 0;
    const soulCost =
      baseSoulCost > 0 ? Math.max(0, Math.floor(baseSoulCost * multiplier)) : 0;

    if (currentGold < goldCost || currentSoul < soulCost) {
      addSystemMessage(`Cannot afford ${item.name}`, "system");
      return;
    }

    const nextGold = currentGold - goldCost;
    const nextSoul = currentSoul - soulCost;

    let nextPlayer = {
      ...state.player,
      gold: nextGold,
      soulpoints: nextSoul,
      currency: {
        ...currentCurrency,
        goldCoins: nextGold,
        soulpoints: nextSoul,
      },
    };

    if (item?.itemId) {
      nextPlayer.inventory = mergeInventoryItems(state.player.inventory || [], [
        {
          ...(item.itemData || {}),
          id: item.itemId,
          name: item.name,
          quantity: item.quantity ?? 1,
        },
      ]);
    } else if (item?.skillData?.id) {
      const abilities = Array.isArray(state.player.abilities)
        ? state.player.abilities
        : [];
      const alreadyKnown = abilities.some(
        (ability) => ability.id === item.skillData.id,
      );
      nextPlayer.abilities = alreadyKnown
        ? abilities
        : [...abilities, item.skillData];
    } else if (item?.service) {
      const equipment = { ...(state.player.equipment || {}) };
      if (item.service === "enhance_weapon") {
        const weapon = equipment.weapon;
        if (weapon) {
          equipment.weapon = {
            ...weapon,
            stats: {
              ...(weapon.stats || {}),
              attack: (weapon.stats?.attack || 0) + 5,
            },
          };
          nextPlayer.equipment = equipment;
        }
      } else if (item.service === "enhance_armor") {
        const armor = equipment.armor;
        if (armor) {
          equipment.armor = {
            ...armor,
            stats: {
              ...(armor.stats || {}),
              defense: (armor.stats?.defense || 0) + 5,
            },
          };
          nextPlayer.equipment = equipment;
        }
      }
    }

    dispatchSystemEvent({
      type: "UPDATE_STATE",
      payload: {
        player: nextPlayer,
      },
    });

    const costText =
      goldCost > 0
        ? `${goldCost} gold`
        : soulCost > 0
          ? `${soulCost} soulpoints`
          : "free";
    addSystemMessage(`Purchased ${item.name} for ${costText}`, "system");
  };

  const handleGachaPull = (poolType, results = []) => {
    const pool = gachaPools[poolType];
    if (!pool) {
      addSystemMessage(
        `Gacha pull failed: unknown pool ${poolType}.`,
        "system",
      );
      return;
    }

    dispatchSystemEvent({
      type: "GACHA_PULL",
      payload: {
        poolId: poolType,
        poolName: pool.name,
        cost: pool.cost,
        results,
      },
    });

    addSystemMessage(`Pulled from ${pool.name} pool.`, "system");
    if (results.length === 0) {
      addSystemMessage("No items received.", "system");
    } else {
      results.forEach((result) => {
        addSystemMessage(
          `Obtained ${result.name} [${result.rarity.toUpperCase()}]`,
          "system",
        );
      });
    }
  };

  const handleTitleEquip = (titleId) => {
    dispatchSystemEvent({
      type: "EQUIP_TITLE",
      payload: { titleId },
    });
  };

  const handleTitleUnequip = (titleId) => {
    dispatchSystemEvent({
      type: "UNEQUIP_TITLE",
      payload: { titleId },
    });
  };

  const normalizeAttributeLabel = (attributeKey) => {
    if (!attributeKey) return "attribute";
    return attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1);
  };

  const handleAllocateAttributePoint = (attributeKey) => {
    if (!attributeKey) return;
    const freePoints = state?.player?.attributes?.freePoints ?? 0;
    if (freePoints <= 0) {
      addSystemMessage("No free attribute points available.", "system");
      return;
    }

    dispatchSystemEvent({
      type: "ALLOCATE_ATTRIBUTE_POINT",
      payload: { attribute: attributeKey },
    });
  };

  const handleDeallocateAttributePoint = (attributeKey) => {
    if (!attributeKey) return;
    const invested = state?.player?.attributeInvestments?.[attributeKey] ?? 0;
    if (invested <= 0) {
      addSystemMessage(
        `No invested points to refund for ${normalizeAttributeLabel(attributeKey)}.`,
        "system",
      );
      return;
    }

    dispatchSystemEvent({
      type: "DEALLOCATE_ATTRIBUTE_POINT",
      payload: { attribute: attributeKey },
    });
  };

  const handleCraft = (recipe) => {
    const inventory = state.player?.inventory || [];
    const hasIngredients = recipe.ingredients.every((ingredient) => {
      const inventoryItem = inventory.find((item) => item.id === ingredient.id);
      return inventoryItem && inventoryItem.quantity >= ingredient.count;
    });

    if (!hasIngredients) {
      addSystemMessage(`Missing ingredients for ${recipe.name}`, "system");
      return;
    }

    dispatchSystemEvent({
      type: "CRAFT_ITEM",
      payload: { recipe },
    });

    dispatchSystemEvent({
      type: "AWARD_PROFESSION_XP",
      payload: {
        professionId: recipe.profession,
        xp: recipe.xp,
      },
    });

    addSystemMessage(`Crafted ${recipe.name} (+${recipe.xp} XP)`, "system");
  };

  const handleTitlePurchase = (titleOrId) => {
    const titleId =
      typeof titleOrId === "string" ? titleOrId : titleOrId?.id || null;
    if (!titleId) return;

    dispatchSystemEvent({
      type: "PURCHASE_TITLE",
      payload: { titleId },
    });
    addSystemMessage(`Purchased title: ${titleId}`, "system");
  };

  const handleCombatAttack = (enemyIndex = 0) => {
    if (state?.combat?.status !== "active") return;
    dispatchSystemEvent({
      type: "PLAYER_ATTACK",
      payload: { enemyIndex },
    });
  };

  const handleSkillUse = (skillId, enemyIndex = 0) => {
    if (state?.combat?.status !== "active") return;
    dispatchSystemEvent({
      type: "PLAYER_USE_SKILL",
      payload: { skillId, enemyIndex },
    });
  };

  const handleCombatEscape = () => {
    if (state?.combat?.status !== "active") return;
    dispatchSystemEvent({ type: "PLAYER_ESCAPE" });
  };

  // Handle input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput || !userInput.trim() || isLoading) return;

    const input = userInput.trim();
    setUserInput("");

    // Save state for rewind before action
    setState((prevState) => ({
      ...prevState,
      previousState: JSON.parse(JSON.stringify(prevState)),
    }));

    // Add user message to chat
    addSystemMessage(`> ${input}`, "user");

    // Process through narrative hook
    await submitInput(input, state);

    // Focus input again
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle action button click
  const handleActionClick = async (actionText) => {
    if (isLoading) return;
    await submitInput(actionText, state);
  };

  const handleNarrativeMemoryScroll = (direction = "down") => {
    const container = narrativeMemoryRef.current;
    if (!container) return;
    const delta = direction === "up" ? -200 : 200;
    container.scrollBy({ top: delta, behavior: "smooth" });
  };

  // Show character creation if character not created (AFTER all hooks)
  if (!characterCreated) {
    return <CharacterGenesisUI onComplete={handleCharacterCreationComplete} />;
  }

  const abilityList = state?.player?.abilities || [];
  const inventoryList = state?.player?.inventory || [];
  const inventoryPreview = inventoryList.slice(0, 6);

  return (
    <div className="app-frame">
      <div className="app-container">
        {/* Column 1: Left Sidebar - HUD */}
        {characterCreated ? (
          <div
            className="holo-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              overflowY: "auto",
            }}
          >
            <HudVitals player={state?.player} config={state?.config} />
            <ExperienceBar player={state?.player} />
            <ClassResourceBar player={state?.player} />
            <EquipmentSlots player={state?.player} />
            <StatusEffects player={state?.player} />
            <button
              className="holo-button"
              onClick={() => setShowLoadoutPanel((prev) => !prev)}
              style={{ fontSize: "0.8rem" }}
            >
              {showLoadoutPanel ? "[HIDE LOADOUT]" : "[SHOW LOADOUT]"}
            </button>
            {showLoadoutPanel && (
              <div
                className="holo-panel"
                style={{
                  padding: "0.75rem",
                  maxHeight: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "var(--holo-cyan)",
                      fontWeight: "bold",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Active Abilities
                  </div>
                  {abilityList.length === 0 ? (
                    <div
                      style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}
                    >
                      None learned.
                    </div>
                  ) : (
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "1rem",
                        maxHeight: "90px",
                        overflowY: "auto",
                      }}
                    >
                      {abilityList.slice(0, 8).map((ability, idx) => (
                        <li
                          key={`${ability.name}-${idx}`}
                          style={{ fontSize: "0.85rem" }}
                        >
                          {ability.name} (Lvl {ability.level || 1})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      color: "var(--holo-cyan)",
                      fontWeight: "bold",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Inventory Snapshot
                  </div>
                  {inventoryPreview.length === 0 ? (
                    <div
                      style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}
                    >
                      Inventory empty.
                    </div>
                  ) : (
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "1rem",
                        maxHeight: "90px",
                        overflowY: "auto",
                      }}
                    >
                      {inventoryPreview.map((item, idx) => (
                        <li
                          key={`${item.id}-${idx}`}
                          style={{ fontSize: "0.85rem" }}
                        >
                          {item.name || item.id}
                          {item.quantity ? ` x${item.quantity}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div></div>
        )}

        {/* Column 2: Center - Narrative */}
        <div className="narrative-column">
          <div className="narrative-scroll">
            {/* ASCII Status Block */}
            <div className="status-terminal" style={{ marginBottom: "1rem" }}>
              {renderStatusBlock(state?.player || {}, state?.config)}
            </div>

          {/* Narrative Content */}
          <div style={{ flex: 1, marginBottom: "1rem" }}>
            {chatLog.map((msg, index) => (
              <div
                key={index}
                className={msg.type}
                style={{ marginBottom: "0.5rem" }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Narrative Memory Cache */}
          {narrativeMemory.length > 0 && (
            <div className="holo-panel narrative-memory-panel">
              <div
                style={{
                  color: "var(--holo-cyan)",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                }}
              >
                AI Narrative Memory
              </div>
              {shouldShowNarrativeSummary && (
                <p
                  style={{
                    marginBottom: "0.5rem",
                    color: "var(--text-main)",
                    fontSize: "1rem",
                    lineHeight: 1.6,
                  }}
                >
                  {narrativeSummary}
                </p>
              )}
              <div className="narrative-memory-side-wrapper">
                <div
                  className="narrative-memory-entries"
                  ref={narrativeMemoryRef}
                  aria-label="AI narrative memory entries"
                >
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {recentNarrativeEntries.map((entry) => {
                      const isLatest =
                        entry.timestamp === latestNarrativeEntry?.timestamp;
                      const classNames = ["narrative-memory-entry"];
                      if (isLatest) {
                        classNames.push("narrative-memory-entry--latest");
                      }
                      return (
                        <li
                          key={entry.timestamp}
                          className={classNames.join(" ")}
                        >
                          {isLatest ? latestEntryTypewriterContent : entry.text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div
                  className="narrative-memory-side-controls"
                  aria-hidden="false"
                >
                  <button
                    type="button"
                    className="narrative-memory-scroll-button"
                    onClick={() => handleNarrativeMemoryScroll("up")}
                  >
                    ▲
                  </button>
                  <div className="narrative-memory-side-separator" />
                  <button
                    type="button"
                    className="narrative-memory-scroll-button"
                    onClick={() => handleNarrativeMemoryScroll("down")}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Command Form - Pinned to bottom */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(0, 243, 255, 0.3)",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter command..."
                  disabled={isLoading ? true : false}
                  style={{
                    flex: 1,
                    background: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(0, 243, 255, 0.3)",
                    color: "#00F3FF",
                    padding: "0.5rem",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading ? true : false}
                  className="holo-button"
                  style={{ minWidth: "80px" }}
                >
                  {isLoading ? "..." : "EXEC"}
                </button>
              </div>
            </form>

            {/* Action Suggestions */}
            {actionSuggestions && actionSuggestions.length > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                {actionSuggestions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action.t)}
                    disabled={isLoading ? true : false}
                    className="holo-button"
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.25rem 0.5rem",
                      marginRight: "0.25rem",
                      marginBottom: "0.25rem",
                      opacity: action.w || 1,
                    }}
                  >
                    {action.t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Right Sidebar - Tactical */}
        <div
          className="holo-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          {/* Combat Panel - Only when active */}
          {state?.combat?.status === "active" && (
            <div>
              <CombatUI
                combatState={state.combat}
                playerState={state.player}
                onAttack={handleCombatAttack}
                onUseSkill={handleSkillUse}
                onEscape={handleCombatEscape}
              />
            </div>
          )}

          {/* Quest Tracker */}
          <div style={{ flex: 1 }}>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "1rem" }}>
              ACTIVE QUESTS
            </h3>
            <QuestTracker quests={state?.quests} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "1rem" }}>
              COMMAND FEED
            </h3>
            <div className="holo-panel command-feed-panel">
              <div className="command-feed-scroll">
                {chatLog
                  .slice(-50)
                  .reverse()
                  .map((entry, idx) => {
                    const timestampLabel = entry.timestamp
                      ? new Date(entry.timestamp).toLocaleTimeString()
                      : "--:--";
                    return (
                      <div
                        key={`${entry.timestamp || idx}-${idx}`}
                        className="command-feed-entry"
                        style={{
                          color:
                            entry.type === "user"
                              ? "var(--holo-cyan)"
                              : entry.type === "narrative"
                                ? "var(--text-main)"
                                : "var(--text-dim)",
                        }}
                      >
                        <span className="command-feed-timestamp">
                          {timestampLabel}
                        </span>
                        <span>{entry.text}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <button
              className="holo-button"
              onClick={() => setShowShop(true)}
              style={{ fontSize: "0.8rem" }}
            >
              [SHOP]
            </button>
            <button
              className="holo-button"
              onClick={() => setShowGacha(true)}
              style={{ fontSize: "0.8rem" }}
            >
              [GACHA]
            </button>
            <button
              className="holo-button"
              onClick={() => setShowProfessions(true)}
              style={{ fontSize: "0.8rem" }}
            >
              [CRAFT]
            </button>
            <button
              className="holo-button"
              onClick={() => setShowStatusOverlay(true)}
              style={{ fontSize: "0.8rem" }}
            >
              [STATUS]
            </button>
          </div>
        </div>
      </div>

      {state?.player?.isDead && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <h2 style={{ color: "var(--holo-alert)", marginBottom: "1rem" }}>
            SYSTEM FAILURE
          </h2>
          <p style={{ marginBottom: "1.5rem", color: "var(--text-main)" }}>
            Critical damage sustained. System shutdown initiated.
          </p>
          <button
            className="holo-button"
            onClick={() => window.location.reload()}
            style={{
              borderColor: "var(--holo-alert)",
              color: "var(--holo-alert)",
            }}
          >
            Restart System
          </button>
        </div>
      )}

      <Suspense fallback={null}>
        {showShop && (
          <ShopUI
            isOpen={showShop}
            onClose={() => setShowShop(false)}
            gameState={state}
            onPurchase={handleShopPurchase}
          />
        )}

        {showGacha && (
          <GachaUI
            isOpen={showGacha}
            onClose={() => setShowGacha(false)}
            gameState={state}
            onPull={handleGachaPull}
          />
        )}

        {showTitleSystem && (
          <TitleUI
            isOpen={showTitleSystem}
            onClose={() => setShowTitleSystem(false)}
            gameState={state}
            onUnlock={() => {}}
            onEquip={handleTitleEquip}
            onUnequip={handleTitleUnequip}
            onPurchase={handleTitlePurchase}
          />
        )}

        {showProfessions && (
          <ProfessionUI
            isOpen={showProfessions}
            onClose={() => setShowProfessions(false)}
            gameState={state}
            onCraft={handleCraft}
          />
        )}

        {showStatusOverlay && (
          <StatusOverlay
            player={state?.player}
            config={state?.config}
            isOpen={showStatusOverlay}
            onClose={() => setShowStatusOverlay(false)}
            onAllocateAttribute={handleAllocateAttributePoint}
            onDeallocateAttribute={handleDeallocateAttributePoint}
          />
        )}
      </Suspense>

      <AdminTools dispatch={dispatchSystemEvent} getState={() => state} />
    </div>
  );
}
