// GameUI.jsx - Technical Cleanup & Dashboard Refactor
import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useGameEngine } from "../hook/usegamestate";
import { useNarrative } from "../hook/useNarrative";
import AdminTools from "./AdminTools";
import { QuestManager } from "../systems/quest/QuestManager.js";
import { gachaPools } from "../data/gachaData.js";
import { getTitleBonuses } from "../core/titleLogic.js";
import CharacterCreationMode from "../ui/modes/CharacterCreationMode.jsx";
import GameMode from "../ui/modes/GameMode.jsx";

const ShopUI = lazy(() => import("./ShopUI"));
const GachaUI = lazy(() => import("./GachaUI"));
const TitleUI = lazy(() => import("./TitleUI"));
const ProfessionUI = lazy(() => import("./ProfessionUI"));
const StatusOverlay = lazy(() => import("./StatusOverlay.jsx"));
const SaveLoadUI = lazy(() => import("./SaveLoadUI.jsx"));

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

export default function GameUI({ user }) {
  // PART 1: State Sanitation - Define missing visibility states
  const [showShop, setShowShop] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showTitleSystem, setShowTitleSystem] = useState(false);
  const [showProfessions, setShowProfessions] = useState(false);
  const [characterCreated, setCharacterCreated] = useState(false);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);

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
  const autosaveTimerRef = useRef(null);
  useEffect(() => {
    const container = narrativeMemoryRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [narrativeMemory.length]);

  useEffect(() => {
    if (!state) return;

    // Debounced local autosave
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          "localAutosave:v1",
          JSON.stringify({
            id: "autosave",
            save_name: "Autosave",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || "unknown",
            game_state: state,
          }),
        );
      } catch (err) {
        console.warn("Autosave failed:", err);
      }
    }, 600);

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
  const handleSuggestionClick = async (actionText) => {
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
    return <CharacterCreationMode onComplete={handleCharacterCreationComplete} />;
  }

  return (
    <div className="app-frame">
      <div className="app-container">
        <div className="command-deck__quick-actions">
          <button className="holo-button" onClick={() => setShowShop(true)}>
            [SHOP]
          </button>
          <button className="holo-button" onClick={() => setShowGacha(true)}>
            [GACHA]
          </button>
          <button className="holo-button" onClick={() => setShowProfessions(true)}>
            [CRAFT]
          </button>
          <button
            className="holo-button"
            onClick={() => setShowStatusOverlay(true)}
          >
            [STATUS]
          </button>
          <button className="holo-button" onClick={() => setShowTitleSystem(true)}>
            [TITLES]
          </button>
          <button className="holo-button" onClick={() => setShowSaveLoad(true)}>
            [SAVE/LOAD]
          </button>
        </div>
        <GameMode
          player={state?.player}
          config={state?.config}
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
          onScrollUp={() => handleNarrativeMemoryScroll("up")}
          onScrollDown={() => handleNarrativeMemoryScroll("down")}
          quests={state?.quests}
          combatState={state?.combat}
          onAttack={handleCombatAttack}
          onUseSkill={handleSkillUse}
          onEscape={handleCombatEscape}
        />
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
            onEvolveSkill={handleEvolveSkill}
            onFuseSkills={handleFuseSkills}
            onEvolveClass={handleEvolveClass}
          />
        )}

        {showSaveLoad && (
          <SaveLoadUI
            isOpen={showSaveLoad}
            onClose={() => setShowSaveLoad(false)}
            gameState={state}
            onLoadState={handleLoadState}
            addSystemMessage={addSystemMessage}
            user={user}
          />
        )}
      </Suspense>

      <AdminTools dispatch={dispatchSystemEvent} getState={() => state} />
    </div>
  );
}
