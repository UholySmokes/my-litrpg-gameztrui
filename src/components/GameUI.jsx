// GameUI.jsx - Technical Cleanup & Dashboard Refactor
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useGameEngine } from "../hook/usegamestate";
import { useNarrative } from "../hook/useNarrative";
import AdminTools from "./AdminTools";
import { QuestManager } from "../systems/quest/QuestManager.js";
import { gachaPools } from "../data/gachaData.js";
import { getTitleBonuses } from "../core/titleLogic.js";
import { mergeInventoryItems } from "../utils/shared.js";
import CharacterCreationMode from "../ui/modes/CharacterCreationMode.jsx";
import GameMode from "../ui/modes/GameMode.jsx";

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

const AUTOSAVE_DEBOUNCE_MS = 2000;
const TRANSITION_DURATION_MS = 1200;
const MAX_LOCAL_SAVES = 20;

export default function GameUI({ user }) {
  // PART 1: State Sanitation - Define missing visibility states
  const [showShop, setShowShop] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showTitleSystem, setShowTitleSystem] = useState(false);
  const [showProfessions, setShowProfessions] = useState(false);
  const [characterCreated, setCharacterCreated] = useState(false);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [equipmentSelectSlot, setEquipmentSelectSlot] = useState(null);

  const {
    state,
    chatLog,
    addSystemMessage,
    setState,
    evaluateQuestProgress,
    dispatchSystemEvent,
    dispatch,
  } = useGameEngine();

  const narrativeSummary = state?.narrative?.summary;
  const narrativeEntries = state?.narrative?.entries || [];
  const recentNarrativeEntries = narrativeEntries.slice(-10).reverse();
  const latestNarrativeEntry = narrativeEntries[narrativeEntries.length - 1];
  const latestNarrativeRawText = latestNarrativeEntry?.text || "";
  const latestNarrativeText = latestNarrativeRawText.trim();
  const latestEntryTypewriterContent = useMemo(
    () => (latestNarrativeRawText ? renderTypewriterText(latestNarrativeRawText) : null),
    [latestNarrativeRawText],
  );
  const sanitizedNarrativeSummary = narrativeSummary?.trim() || "";
  const shouldShowNarrativeSummary =
    sanitizedNarrativeSummary.length > 0 &&
    sanitizedNarrativeSummary !== latestNarrativeText;
  const narrativeMemoryRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const transitionAudioRef = useRef(null);
  const previousStateRef = useRef(null);
  useEffect(() => {
    const container = narrativeMemoryRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [narrativeEntries.length]);

  useEffect(() => {
    if (!state) return;

    // Debounced local autosave
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      try {
        const { previousState, ...stateToSave } = state;
        localStorage.setItem(
          "localAutosave:v1",
          JSON.stringify({
            id: "autosave",
            save_name: "Autosave",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || "unknown",
            game_state: stateToSave,
          }),
        );
      } catch (err) {
        console.warn("Autosave failed:", err);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [state, user?.id]);

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

  const handleEvolveSkill = (skillId) => {
    dispatch({
      type: "EVOLVE_SKILL",
      payload: { skillId },
    });
  };

  const handleFuseSkills = (skillAId, skillBId) => {
    dispatch({
      type: "FUSE_SKILLS",
      payload: { skillAId, skillBId },
    });
  };

  const handleEvolveClass = () => {
    dispatch({ type: "EVOLVE_CLASS" });
  };

  const handleStudySpell = (payload = { mode: "create" }) => {
    dispatchSystemEvent({
      type: "STUDY_SPELL",
      payload,
    });
  };

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
    setIsTransitioning(true);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setCharacterCreated(true);
      setIsTransitioning(false);
    }, TRANSITION_DURATION_MS);

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
          `Obtained ${result.name} [${(result.rarity || "unknown").toUpperCase()}]`,
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

  const handleEquipItem = (slot, item) => {
    if (!slot || !item) return;
    dispatch({
      type: "EQUIP_ITEM",
      payload: { slot, item },
    });
  };

  const handleUnequipItem = (slot) => {
    if (!slot) return;
    dispatch({
      type: "UNEQUIP_ITEM",
      payload: { slot },
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

  const handleClassAbilityUse = (abilityId, enemyIndex = 0) => {
    if (state?.combat?.status !== "active") return;
    dispatchSystemEvent({
      type: "PLAYER_USE_CLASS_ABILITY",
      payload: { abilityId, enemyIndex },
    });
  };

  const handleRaceAbilityUse = (abilityId, enemyIndex = 0) => {
    if (state?.combat?.status !== "active") return;
    dispatchSystemEvent({
      type: "PLAYER_USE_RACE_ABILITY",
      payload: { abilityId, enemyIndex },
    });
  };

  const handleLoadState = (loadedState) => {
    if (!loadedState) return;
    setState(loadedState);
    addSystemMessage("Loaded save game.", "system");
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

    // Save state for rewind before action (stored outside reducer state)
    previousStateRef.current = state;

    // Add user message to chat
    addSystemMessage(`> ${input}`, "user");

    // Process through narrative hook
    try {
      await submitInput(input, state);
    } catch (err) {
      console.error("Submit failed:", err);
      addSystemMessage("Something went wrong processing your action.", "system");
    }

    // Focus input again
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle action button click
  const handleSuggestionClick = async (actionText) => {
    if (isLoading) return;
    try {
      await submitInput(actionText, state);
    } catch (err) {
      console.error("Suggestion action failed:", err);
      addSystemMessage("Something went wrong processing your action.", "system");
    }
  };


  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef(null);
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionAudioRef.current?.close();
    };
  }, []);
  useEffect(() => {
    if (!isTransitioning) return;
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      if (!transitionAudioRef.current) {
        transitionAudioRef.current = new AudioCtx();
      }
      const ctx = transitionAudioRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const classId = state?.player?.class?.id || state?.player?.class;
      const audioProfile = (() => {
        switch (classId) {
          case "warrior":
            return {
              type: "square",
              start: 180,
              end: 420,
              gain: 0.07,
              duration: 0.45,
            };
          case "mage":
            return {
              type: "sine",
              start: 300,
              end: 980,
              gain: 0.08,
              duration: 0.5,
            };
          case "rogue":
            return {
              type: "triangle",
              start: 260,
              end: 720,
              gain: 0.06,
              duration: 0.35,
            };
          case "monk":
            return {
              type: "sine",
              start: 200,
              end: 600,
              gain: 0.055,
              duration: 0.4,
            };
          case "paladin":
            return {
              type: "sawtooth",
              start: 220,
              end: 520,
              gain: 0.07,
              duration: 0.5,
            };
          case "necromancer":
            return {
              type: "sawtooth",
              start: 140,
              end: 420,
              gain: 0.06,
              duration: 0.55,
            };
          case "ranger":
            return {
              type: "triangle",
              start: 240,
              end: 680,
              gain: 0.06,
              duration: 0.4,
            };
          case "berserker":
            return {
              type: "square",
              start: 160,
              end: 520,
              gain: 0.08,
              duration: 0.45,
            };
          default:
            return {
              type: "sine",
              start: 220,
              end: 880,
              gain: 0.08,
              duration: 0.5,
            };
        }
      })();
      osc.type = audioProfile.type;
      osc.frequency.setValueAtTime(audioProfile.start, now);
      osc.frequency.exponentialRampToValueAtTime(
        audioProfile.end,
        now + audioProfile.duration * 0.5,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        audioProfile.gain,
        now + 0.05,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + audioProfile.duration,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + audioProfile.duration + 0.05);
    } catch {
      return;
    }
  }, [isTransitioning, state?.player?.class]);

  const showCreationMode = !characterCreated;
  const showGameMode = characterCreated || isTransitioning;
  const [focusWindowRequest, setFocusWindowRequest] = useState(null);
  const requestWindowFocus = (id) => {
    setFocusWindowRequest({ id, nonce: Date.now() });
  };
  const toggleWindow = (id, isOpen, setOpen) => {
    if (isOpen) {
      requestWindowFocus(id);
      return;
    }
    setOpen(true);
    requestWindowFocus(id);
  };

  const handleOpenEquipmentSlot = (slotKey) => {
    if (!slotKey) return;
    setEquipmentSelectSlot(slotKey);
    requestWindowFocus("equipmentSelect");
  };

  const handleCloseEquipmentSelect = () => {
    setEquipmentSelectSlot(null);
  };

  const handleCloseShop = useCallback(() => setShowShop(false), []);
  const handleCloseGacha = useCallback(() => setShowGacha(false), []);
  const handleCloseTitleSystem = useCallback(() => setShowTitleSystem(false), []);
  const handleCloseProfessions = useCallback(() => setShowProfessions(false), []);
  const handleCloseStatusOverlay = useCallback(() => setShowStatusOverlay(false), []);
  const handleCloseSaveLoad = useCallback(() => setShowSaveLoad(false), []);
  const handleCloseQuests = useCallback(() => setShowQuests(false), []);

  return (
    <div className="app-frame">
      <div className="app-container">
        <div className="mode-stage">
          {isTransitioning && (
            <div className="mode-transition-overlay" aria-hidden="true">
              <div className="mode-transition-overlay__scan" />
              <div className="mode-transition-overlay__glow" />
              <div className="mode-transition-overlay__copy">
                SYSTEM HANDOFF
              </div>
              <div className="mode-transition-overlay__subcopy">
                Synchronizing narrative stream...
              </div>
            </div>
          )}
          <div
            className={[
              "mode-shell",
              "mode-shell--creation",
              showCreationMode ? "mode-shell--active" : "",
              isTransitioning ? "mode-shell--fade-out" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <CharacterCreationMode onComplete={handleCharacterCreationComplete} />
          </div>
          <div
            className={[
              "mode-shell",
              "mode-shell--game",
              showGameMode ? "mode-shell--active" : "",
              isTransitioning ? "mode-shell--fade-in" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="command-deck__quick-actions">
              <button
                className="holo-button"
                onClick={() => toggleWindow("quests", showQuests, setShowQuests)}
              >
                [QUESTS]
              </button>
              <button
                className="holo-button"
                onClick={() => toggleWindow("shop", showShop, setShowShop)}
              >
                [SHOP]
              </button>
              <button
                className="holo-button"
                onClick={() => toggleWindow("gacha", showGacha, setShowGacha)}
              >
                [GACHA]
              </button>
              <button
                className="holo-button"
                onClick={() =>
                  toggleWindow("craft", showProfessions, setShowProfessions)
                }
              >
                [CRAFT]
              </button>
              <button
                className="holo-button"
                onClick={() =>
                  toggleWindow("status", showStatusOverlay, setShowStatusOverlay)
                }
              >
                [STATUS]
              </button>
              <button
                className="holo-button"
                onClick={() =>
                  toggleWindow("titles", showTitleSystem, setShowTitleSystem)
                }
              >
                [TITLES]
              </button>
              <button
                className="holo-button"
                onClick={() =>
                  toggleWindow("saveLoad", showSaveLoad, setShowSaveLoad)
                }
              >
                [SAVE/LOAD]
              </button>
            </div>
            <GameMode
              player={state?.player}
              config={state?.config}
              gameState={state}
              chatLog={chatLog}
              userInput={userInput}
              onInputChange={setUserInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              inputRef={inputRef}
              suggestions={actionSuggestions}
              onSuggestionSelect={handleSuggestionClick}
              narrativeSummary={shouldShowNarrativeSummary ? narrativeSummary : ""}
              narrativeEntries={recentNarrativeEntries}
              latestEntry={latestNarrativeEntry}
              latestEntryText={latestEntryTypewriterContent}
              narrativeMemoryRef={narrativeMemoryRef}
              equipmentSelectSlot={equipmentSelectSlot}
              onSelectEquipmentSlot={handleOpenEquipmentSlot}
              onCloseEquipmentSelect={handleCloseEquipmentSelect}
              onEquipItem={handleEquipItem}
              onUnequipItem={handleUnequipItem}
              onEquipTitle={handleTitleEquip}
              onUnequipTitle={handleTitleUnequip}
              quests={state?.quests}
              combatState={state?.combat}
              onAttack={handleCombatAttack}
              onUseSkill={handleSkillUse}
              onUseClassAbility={handleClassAbilityUse}
              onUseRaceAbility={handleRaceAbilityUse}
              onEscape={handleCombatEscape}
              showShop={showShop}
              showGacha={showGacha}
              showTitleSystem={showTitleSystem}
              showProfessions={showProfessions}
              showStatusOverlay={showStatusOverlay}
              showSaveLoad={showSaveLoad}
              showQuests={showQuests}
              onCloseShop={handleCloseShop}
              onCloseGacha={handleCloseGacha}
              onCloseTitleSystem={handleCloseTitleSystem}
              onCloseProfessions={handleCloseProfessions}
              onCloseStatusOverlay={handleCloseStatusOverlay}
              onCloseSaveLoad={handleCloseSaveLoad}
              onCloseQuests={handleCloseQuests}
              onShopPurchase={handleShopPurchase}
              onGachaPull={handleGachaPull}
              onTitleEquip={handleTitleEquip}
              onTitleUnequip={handleTitleUnequip}
              onTitlePurchase={handleTitlePurchase}
              onCraft={handleCraft}
              onAllocateAttribute={handleAllocateAttributePoint}
              onDeallocateAttribute={handleDeallocateAttributePoint}
              onEvolveSkill={handleEvolveSkill}
              onFuseSkills={handleFuseSkills}
              onEvolveClass={handleEvolveClass}
              onStudySpell={handleStudySpell}
              onLoadState={handleLoadState}
              addSystemMessage={addSystemMessage}
              user={user}
              focusWindowRequest={focusWindowRequest}
            />
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

      <AdminTools dispatch={dispatchSystemEvent} getState={() => state} />
    </div>
  );
}
