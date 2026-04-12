import React, { useMemo, useState, useEffect } from "react";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { mergeInventoryItems } from "../utils/shared.js";
import { listAgents, runAgent } from "../core/AgentService.js";
import "./AdminTools.css";

const EXTRA_COMMANDS = [
  { label: "Give Wooden Sword", type: "give_item", id: "wooden_sword", name: "Wooden Sword", itemType: "equipment", qty: 1 },
  { label: "Give Wooden Bow", type: "give_item", id: "wooden_bow", name: "Wooden Bow", itemType: "equipment", qty: 1 },
  { label: "Give Wooden Staff", type: "give_item", id: "wooden_staff", name: "Wooden Staff", itemType: "equipment", qty: 1 },
  { label: "Give Iron Sword", type: "give_item", id: "iron_sword", name: "Iron Sword", itemType: "equipment", qty: 1 },
  { label: "Give Iron Axe", type: "give_item", id: "iron_axe", name: "Iron Axe", itemType: "equipment", qty: 1 },
  { label: "Give Iron Bow", type: "give_item", id: "iron_bow", name: "Iron Bow", itemType: "equipment", qty: 1 },
  { label: "Give Iron Dagger", type: "give_item", id: "iron_dagger", name: "Iron Dagger", itemType: "equipment", qty: 1 },
  { label: "Give Iron Staff", type: "give_item", id: "iron_staff", name: "Iron Staff", itemType: "equipment", qty: 1 },
  { label: "Give Steel Sword", type: "give_item", id: "steel_sword", name: "Steel Sword", itemType: "equipment", qty: 1 },
  { label: "Give Steel Axe", type: "give_item", id: "steel_axe", name: "Steel Axe", itemType: "equipment", qty: 1 },
  { label: "Give Steel Bow", type: "give_item", id: "steel_bow", name: "Steel Bow", itemType: "equipment", qty: 1 },
  { label: "Give Steel Dagger", type: "give_item", id: "steel_dagger", name: "Steel Dagger", itemType: "equipment", qty: 1 },
  { label: "Give Steel Staff", type: "give_item", id: "steel_staff", name: "Steel Staff", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Sword", type: "give_item", id: "mithril_sword", name: "Mithril Sword", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Axe", type: "give_item", id: "mithril_axe", name: "Mithril Axe", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Bow", type: "give_item", id: "mithril_bow", name: "Mithril Bow", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Dagger", type: "give_item", id: "mithril_dagger", name: "Mithril Dagger", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Staff", type: "give_item", id: "mithril_staff", name: "Mithril Staff", itemType: "equipment", qty: 1 },
  { label: "Give Novice Robes", type: "give_item", id: "novice_robes", name: "Novice Robes", itemType: "equipment", qty: 1 },
  { label: "Give Leather Armor", type: "give_item", id: "leather_armor", name: "Leather Armor", itemType: "equipment", qty: 1 },
  { label: "Give Hard Leather Armor", type: "give_item", id: "hard_leather", name: "Hard Leather", itemType: "equipment", qty: 1 },
  { label: "Give Iron Mail", type: "give_item", id: "iron_mail", name: "Iron Mail", itemType: "equipment", qty: 1 },
  { label: "Give Iron Plate", type: "give_item", id: "iron_plate", name: "Iron Plate", itemType: "equipment", qty: 1 },
  { label: "Give Steel Mail", type: "give_item", id: "steel_mail", name: "Steel Mail", itemType: "equipment", qty: 1 },
  { label: "Give Steel Plate", type: "give_item", id: "steel_plate", name: "Steel Plate", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Mail", type: "give_item", id: "mithril_mail", name: "Mithril Mail", itemType: "equipment", qty: 1 },
  { label: "Give Mithril Plate", type: "give_item", id: "mithril_plate", name: "Mithril Plate", itemType: "equipment", qty: 1 },
  { label: "Give Void Robes", type: "give_item", id: "void_robes", name: "Void Robes", itemType: "equipment", qty: 1 },
  { label: "Give Elven Cloak", type: "give_item", id: "elven_cloak", name: "Elven Cloak", itemType: "equipment", qty: 1 },
  { label: "Give Ring of Health", type: "give_item", id: "ring_health", name: "Ring of Health", itemType: "equipment", qty: 1 },
  { label: "Give Ring of Mana", type: "give_item", id: "ring_mana", name: "Ring of Mana", itemType: "equipment", qty: 1 },
  { label: "Give Ring of Strength", type: "give_item", id: "ring_strength", name: "Ring of Strength", itemType: "equipment", qty: 1 },
  { label: "Give Ring of Agility", type: "give_item", id: "ring_agility", name: "Ring of Agility", itemType: "equipment", qty: 1 },
  { label: "Give Ring of Intelligence", type: "give_item", id: "ring_intelligence", name: "Ring of Intelligence", itemType: "equipment", qty: 1 },
  { label: "Give Amulet of Life", type: "give_item", id: "amulet_life", name: "Amulet of Life", itemType: "equipment", qty: 1 },
  { label: "Minor Health Potion", type: "give_item", id: "minor_hp", name: "Minor Health Potion", itemType: "consumable", qty: 5 },
  { label: "Basic Health Potion", type: "give_item", id: "basic_hp", name: "Basic Health Potion", itemType: "consumable", qty: 5 },
  { label: "Greater Health Potion", type: "give_item", id: "greater_hp", name: "Greater Health Potion", itemType: "consumable", qty: 5 },
  { label: "Superior Health Potion", type: "give_item", id: "superior_hp", name: "Superior Health Potion", itemType: "consumable", qty: 5 },
  { label: "Minor Mana Potion", type: "give_item", id: "minor_mp", name: "Minor Mana Potion", itemType: "consumable", qty: 5 },
  { label: "Basic Mana Potion", type: "give_item", id: "basic_mp", name: "Basic Mana Potion", itemType: "consumable", qty: 5 },
  { label: "Greater Mana Potion", type: "give_item", id: "greater_mp", name: "Greater Mana Potion", itemType: "consumable", qty: 5 },
  { label: "Superior Mana Potion", type: "give_item", id: "superior_mp", name: "Superior Mana Potion", itemType: "consumable", qty: 5 },
  { label: "Rejuvenation Elixir", type: "give_item", id: "rejuv_elixir", name: "Rejuvenation Elixir", itemType: "consumable", qty: 1 },
  { label: "Panacea", type: "give_item", id: "panacea", name: "Panacea", itemType: "consumable", qty: 1 },
  { label: "Give Scrap Wood", type: "give_item", id: "scrap_wood", name: "Scrap Wood", itemType: "material", qty: 10 },
  { label: "Give Pine Logs", type: "give_item", id: "pine_logs", name: "Pine Logs", itemType: "material", qty: 10 },
  { label: "Give Oak Logs", type: "give_item", id: "oak_logs", name: "Oak Logs", itemType: "material", qty: 10 },
  { label: "Give Iron Ore", type: "give_item", id: "iron_ore", name: "Iron Ore", itemType: "material", qty: 10 },
  { label: "Give Steel Ingot", type: "give_item", id: "steel_ingot", name: "Steel Ingot", itemType: "material", qty: 10 },
  { label: "Give Mithril Ore", type: "give_item", id: "mithril_ore", name: "Mithril Ore", itemType: "material", qty: 10 },
  { label: "Give Gold Nugget", type: "give_item", id: "gold_nugget", name: "Gold Nugget", itemType: "material", qty: 10 },
  { label: "Give Diamond", type: "give_item", id: "diamond", name: "Diamond", itemType: "material", qty: 1 },
  { label: "Give Ruby", type: "give_item", id: "ruby", name: "Ruby", itemType: "material", qty: 1 },
  { label: "Give Emerald", type: "give_item", id: "emerald", name: "Emerald", itemType: "material", qty: 1 },
  { label: "Set Level 1", type: "set_level", level: 1 },
  { label: "Set Level 5", type: "set_level", level: 5 },
  { label: "Set Level 10", type: "set_level", level: 10 },
  { label: "Set Level 25", type: "set_level", level: 25 },
  { label: "Set Level 50", type: "set_level", level: 50 },
  { label: "Set Level 100", type: "set_level", level: 100 },
  { label: "Teleport: Starter Village", type: "set_location", location: "Starter Village" },
  { label: "Teleport: Dark Forest", type: "set_location", location: "Dark Forest" },
  { label: "Teleport: Goblin Caverns", type: "set_location", location: "Goblin Caverns" },
  { label: "Teleport: Dragon Peak", type: "set_location", location: "Dragon Peak" },
  { label: "Teleport: The Void", type: "set_location", location: "The Void" },
  { label: "Teleport: Goblin Camp", type: "set_location", location: "Goblin Camp" },
  { label: "Teleport: Crystal Mines", type: "set_location", location: "Crystal Mines" },
  { label: "Teleport: Elven Forest", type: "set_location", location: "Elven Forest" },
  { label: "Teleport: Dwarven Kingdom", type: "set_location", location: "Dwarven Kingdom" },
  { label: "Teleport: Demon Realm", type: "set_location", location: "Demon Realm" },
  { label: "Teleport: Celestial City", type: "set_location", location: "Celestial City" },
  { label: "Add Status: Poison", type: "add_status", status: "Poison" },
  { label: "Add Status: Burn", type: "add_status", status: "Burn" },
  { label: "Add Status: Bleed", type: "add_status", status: "Bleed" },
  { label: "Add Status: Regen", type: "add_status", status: "Regen" },
  { label: "Add Status: Haste", type: "add_status", status: "Haste" },
  { label: "Add Status: Shield", type: "add_status", status: "Shield" },
  { label: "Add Status: Frenzy", type: "add_status", status: "Frenzy" },
  { label: "Add Status: Cursed", type: "add_status", status: "Cursed" },
  { label: "Add Status: Blind", type: "add_status", status: "Blind" },
  { label: "Add Status: Silence", type: "add_status", status: "Silence" },
  { label: "Add Status: Stun", type: "add_status", status: "Stun" },
  { label: "Add Status: Invincible", type: "add_status", status: "Invincible" },
  { label: "Add Status: Invisible", type: "add_status", status: "Invisible" },
  { label: "Clear All Statuses", type: "clear_status" },
  { label: "Unlock Skill: Fireball", type: "unlock_skill", skill: "Fireball" },
  { label: "Unlock Skill: Heal", type: "unlock_skill", skill: "Heal" },
  { label: "Unlock Skill: Slash", type: "unlock_skill", skill: "Slash" },
  { label: "Unlock Skill: Stealth", type: "unlock_skill", skill: "Stealth" },
  { label: "Unlock Skill: Bash", type: "unlock_skill", skill: "Bash" },
  { label: "Unlock Skill: Taunt", type: "unlock_skill", skill: "Taunt" },
  { label: "Unlock Skill: Fly", type: "unlock_skill", skill: "Fly" },
  { label: "Unlock Skill: Lightning Bolt", type: "unlock_skill", skill: "Lightning Bolt" },
  { label: "Unlock Skill: Ice Spike", type: "unlock_skill", skill: "Ice Spike" },
  { label: "Unlock Skill: Shadow Strike", type: "unlock_skill", skill: "Shadow Strike" },
  { label: "Unlock Skill: Holy Light", type: "unlock_skill", skill: "Holy Light" },
  { label: "Unlock Skill: Whirlwind", type: "unlock_skill", skill: "Whirlwind" },
  { label: "Unlock Skill: Earthquake", type: "unlock_skill", skill: "Earthquake" },
  { label: "Unlock Skill: Poison Dart", type: "unlock_skill", skill: "Poison Dart" },
  { label: "Unlock Skill: Backstab", type: "unlock_skill", skill: "Backstab" },
  { label: "Add Quest: Rat Problem", type: "add_quest", quest: "Rat Problem" },
  { label: "Add Quest: Dragon Slayer", type: "add_quest", quest: "Dragon Slayer" },
  { label: "Add Quest: Missing Artifact", type: "add_quest", quest: "Missing Artifact" },
  { label: "Add Quest: Goblin Menace", type: "add_quest", quest: "Goblin Menace" },
  { label: "Add Quest: Lost Ring", type: "add_quest", quest: "Lost Ring" },
  { label: "Add Quest: Defeat the Demon King", type: "add_quest", quest: "Defeat the Demon King" },
  { label: "Complete All Quests", type: "complete_quests" },
  { label: "Reset All Quests", type: "reset_quests" },
];

export default function AdminTools({ dispatch, getState }) {
  const isDevBuild = true; // Boolean(import.meta.env.DEV);

  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("player");
  const [output, setOutput] = useState("");
  const [agentCatalog, setAgentCatalog] = useState([]);
  const [agentSelection, setAgentSelection] = useState("narrator");
  const [agentInput, setAgentInput] = useState(
    JSON.stringify(
      {
        game_state: {
          location: "Ashen Gate",
          hp: 42,
        },
      },
      null,
      2,
    ),
  );
  const [agentModel, setAgentModel] = useState("gemini-2.5-flash");
  const [agentTemperature, setAgentTemperature] = useState("0.8");
  const [agentBusy, setAgentBusy] = useState(false);

  // Amounts for input fields
  const [goldAmount, setGoldAmount] = useState(1000);
  const [soulpointsAmount, setSoulpointsAmount] = useState(100);
  const [xpAmount, setXpAmount] = useState(100);
  const [hpAmount, setHpAmount] = useState(50);
  const [manaAmount, setManaAmount] = useState(50);
  const [attributePointsAmount, setAttributePointsAmount] = useState(5);

  const readState = () => (typeof getState === "function" ? getState() : null);
  const currentState = readState();
  const playerState = currentState?.player || null;
  const playerSummary = useMemo(() => {
    if (!playerState) {
      return {
        level: 0,
        gold: 0,
        soulpoints: 0,
        xp: "0 / 0",
        hp: "0 / 0",
        mana: "0 / 0",
      };
    }

    const level = Number(playerState.level || 0);
    const currency = playerState.currency || {};
    const gold = Number(currency.goldCoins ?? playerState.gold ?? 0);
    const soulpoints = Number(currency.soulpoints ?? playerState.soulpoints ?? 0);
    const xpCurrent = Number(playerState.xp?.current ?? playerState.xp ?? 0);
    const xpMax = Number(playerState.xp?.max ?? 0);
    const hpCurrent = Number(playerState.hp?.current ?? 0);
    const hpMax = Number(playerState.hp?.max ?? 0);
    const manaCurrent = Number(playerState.mana?.current ?? 0);
    const manaMax = Number(playerState.mana?.max ?? 0);

    return {
      level,
      gold,
      soulpoints,
      xp: `${xpCurrent} / ${xpMax}`,
      hp: `${hpCurrent} / ${hpMax}`,
      mana: `${manaCurrent} / ${manaMax}`,
    };
  }, [playerState]);

  useEffect(() => {
    if (!isDevBuild) return undefined;
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.ctrlKey && e.key === "`") {
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevBuild]);

  const parseAmount = (rawValue) => {
    const value = Number.parseInt(rawValue, 10);
    return Number.isFinite(value) ? value : null;
  };

  const handleDispatch = (action) => {
    if (typeof dispatch !== "function") {
      setOutput("Admin action failed: dispatch is unavailable.");
      return;
    }
    dispatch(action);
  };

  const addGold = (amount) => {
    const value = parseAmount(amount);
    const snapshot = readState();
    if (!snapshot?.player) return;
    if (value === null) {
      setOutput("Invalid gold amount.");
      return;
    }

    handleDispatch({
        type: "UPDATE_STATE",
        payload: {
            player: {
                ...snapshot.player,
                currency: {
                    ...(snapshot.player.currency || {}),
                    goldCoins: ((snapshot.player.currency || {}).goldCoins || 0) + value,
                },
            },
        },
    });
    setOutput(`Added ${value} gold.`);
  };

  const addSoulpoints = (amount) => {
    const value = parseAmount(amount);
    const snapshot = readState();
    if (!snapshot?.player) return;
    if (value === null) {
      setOutput("Invalid soulpoints amount.");
      return;
    }
    
    handleDispatch({
        type: "UPDATE_STATE",
        payload: {
            player: {
                ...snapshot.player,
                currency: {
                    ...(snapshot.player.currency || {}),
                    soulpoints: ((snapshot.player.currency || {}).soulpoints || 0) + value,
                },
            },
        },
    });
    setOutput(`Added ${value} soulpoints.`);
  };

  const addXP = (amount) => {
    const value = parseAmount(amount);
    if (value === null) {
      setOutput("Invalid XP amount.");
      return;
    }
    handleDispatch({ type: "ADD_XP", payload: value });
    setOutput(`Added ${value} XP`);
  };

  const addLevel = () => {
    handleDispatch({ type: "LEVEL_UP" });
    setOutput(`Added 1 level`);
  };

  const adjustVital = (vitalKey, delta, label) => {
    const snapshot = readState();
    const vital = snapshot?.player?.[vitalKey];
    if (!vital) {
      setOutput(`Cannot adjust ${label}: player data missing.`);
      return;
    }
    const current = Number(vital.current ?? 0);
    const max = Number(vital.max ?? 0);
    const next = Math.max(0, Math.min(current + delta, max));
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...snapshot.player,
          [vitalKey]: {
            ...vital,
            current: next,
          },
        },
      },
    });
  };

  const healHp = (amount) => {
    const value = parseAmount(amount);
    if (value === null) {
      setOutput("Invalid HP amount.");
      return;
    }
    const delta = Math.abs(value);
    adjustVital("hp", delta, "HP");
    setOutput(`Healed ${delta} HP.`);
  };

  const damageHp = (amount) => {
    const value = parseAmount(amount);
    if (value === null) {
      setOutput("Invalid HP amount.");
      return;
    }
    const delta = -Math.abs(value);
    adjustVital("hp", delta, "HP");
    setOutput(`Damaged ${Math.abs(delta)} HP.`);
  };

  const restoreMana = (amount) => {
    const value = parseAmount(amount);
    if (value === null) {
      setOutput("Invalid Mana amount.");
      return;
    }
    const delta = Math.abs(value);
    adjustVital("mana", delta, "Mana");
    setOutput(`Restored ${delta} Mana.`);
  };

  const drainMana = (amount) => {
    const value = parseAmount(amount);
    if (value === null) {
      setOutput("Invalid Mana amount.");
      return;
    }
    const delta = -Math.abs(value);
    adjustVital("mana", delta, "Mana");
    setOutput(`Drained ${Math.abs(delta)} Mana.`);
  };

  const addAttributePoints = (amount) => {
    const value = parseAmount(amount);
    const snapshot = readState();
    if (!snapshot?.player) return;
    if (value === null) {
      setOutput("Invalid attribute points amount.");
      return;
    }
    const attributes = { ...(snapshot.player.attributes || {}) };
    const current = Number(attributes.freePoints ?? 0);
    const next = Math.max(0, current + value);
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...snapshot.player,
          attributes: {
            ...attributes,
            freePoints: next,
          },
        },
      },
    });
    setOutput(`Adjusted free attribute points by ${value}.`);
  };

  const revivePlayer = () => {
    const snapshot = readState();
    if (!snapshot?.player?.hp || !snapshot?.player?.mana) {
      setOutput("Cannot revive: player HP/Mana data missing.");
      return;
    }
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...snapshot.player,
          isDead: false,
          hp: { ...snapshot.player.hp, current: snapshot.player.hp.max },
          mana: { ...snapshot.player.mana, current: snapshot.player.mana.max },
        },
      },
    });
    setOutput("Revived player and refilled vitals.");
  };

  const refillVitals = () => {
    const snapshot = readState();
    if (!snapshot?.player?.hp || !snapshot?.player?.mana) {
      setOutput("Cannot refill vitals: player HP/Mana data missing.");
      return;
    }

    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...snapshot.player,
          hp: { ...snapshot.player.hp, current: snapshot.player.hp.max },
          mana: { ...snapshot.player.mana, current: snapshot.player.mana.max },
        },
      },
    });
    setOutput("HP and Mana refilled to max");
  };

  const addCraftingMats = () => {
    const snapshot = readState();
    if (!snapshot?.player) return;

    const mats = [
      { id: "iron_ore", quantity: 10 },
      { id: "leather", quantity: 10 },
      { id: "magic_essence", quantity: 5 },
    ];
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...snapshot.player,
          inventory: mergeInventoryItems(snapshot.player.inventory || [], mats),
        },
      },
    });
    setOutput("Added crafting materials bundle.");
  };

  const giveRandomGear = () => {
    const snapshot = readState();
    if (!snapshot?.player) return;

    const loot = [
        { id: "iron_sword", name: "Iron Sword", type: "equipment", equipSlot: "weapon", quantity: 1 },
        { id: "chain_mail", name: "Chain Mail", type: "equipment", equipSlot: "armor", quantity: 1 },
    ];
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...snapshot.player,
          inventory: mergeInventoryItems(snapshot.player.inventory || [], loot),
        },
      },
    });
    setOutput("Added iron sword and chain mail to inventory.");
  };

  const runGeneration = (type) => {
    try {
      const start = performance.now();
      let result;
      if (type === "race" || type === "class") {
        const options = ContentGenerator.generateCharacterOptions(5);
        result = type === "race" ? options.races : options.classes;
      } else if (type === "skill") {
        result = ContentGenerator.generateSkills(10, 5);
      } else {
        result = "Unknown generation type";
      }
      const end = performance.now();
      const summary = `Generated ${Array.isArray(result) ? result.length : 1} ${type}s in ${(end - start).toFixed(2)}ms\n\n${JSON.stringify(result, null, 2)}`;
      setOutput(summary);
      console.log(`Generated ${type}s:`, result);
    } catch (error) {
      setOutput(`Generation failed for "${type}": ${String(error?.message || error)}`);
    }
  };
  
  const resetGame = () => {
    if (window.confirm("Are you sure you want to reset all game data? This cannot be undone.")) {
      handleDispatch({ type: "RESET_GAME_STATE" });
      setOutput("Game state has been reset.");
    }
  };

  const clearOutput = () => {
    setOutput("");
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setOutput((prev) => `${prev}\n\n[Copied output to clipboard.]`);
    } catch {
      setOutput((prev) => `${prev}\n\n[Copy failed: clipboard not available.]`);
    }
  };

  const handleFetchAgents = async () => {
    setAgentBusy(true);
    try {
      const result = await listAgents();
      if (!result.success) {
        setOutput(`Agent list failed: ${result.error}`);
        return;
      }
      const names = result.agents.map((item) => item.name || item.id).filter(Boolean);
      setAgentCatalog(result.agents);
      if (names.length > 0) {
        setAgentSelection((current) => (names.includes(current) ? current : names[0]));
      }
      setOutput(
        `Agents (${result.agents.length}):\n${JSON.stringify(result.agents, null, 2)}`,
      );
    } finally {
      setAgentBusy(false);
    }
  };

  const handleRunAgent = async () => {
    let parsedInput;
    try {
      parsedInput = agentInput ? JSON.parse(agentInput) : {};
    } catch {
      setOutput("Invalid agent input JSON.");
      return;
    }

    const temperature = Number.parseFloat(agentTemperature);
    const payload = {
      agent: agentSelection || "narrator",
      input: parsedInput,
      model: String(agentModel || "").trim() || undefined,
      temperature: Number.isFinite(temperature) ? temperature : undefined,
    };

    setAgentBusy(true);
    try {
      const result = await runAgent(payload);
      if (!result.success) {
        setOutput(`Agent run failed: ${result.error}`);
        return;
      }
      setOutput(
        `Agent "${payload.agent}" response:\n${JSON.stringify(result.data, null, 2)}`,
      );
    } finally {
      setAgentBusy(false);
    }
  };

  const runMacro = (macro) => {
    const snapshot = readState();
    if (!snapshot) {
      setOutput("No snapshot available.");
      return;
    }
    
    try {
      if (macro.type === "give_item") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: {
            player: {
              ...snapshot.player,
              inventory: mergeInventoryItems(snapshot.player.inventory || [], [
                { id: macro.id, name: macro.name, type: macro.itemType || "item", quantity: macro.qty || 1 }
              ])
            }
          }
        });
        setOutput(`Given ${macro.qty || 1}x ${macro.name}`);
      } else if (macro.type === "set_level") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: { player: { ...snapshot.player, level: macro.level } }
        });
        setOutput(`Level set to ${macro.level}`);
      } else if (macro.type === "set_location") {
        handleDispatch({
          type: "UPDATE_STATE",
          payload: { location: macro.location }
        });
        setOutput(`Location set to ${macro.location}`);
      } else if (macro.type === "add_status") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: {
            player: {
              ...snapshot.player,
              statusEffects: [...(snapshot.player.statusEffects || []), macro.status]
            }
          }
        });
        setOutput(`Added status: ${macro.status}`);
      } else if (macro.type === "clear_status") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: { player: { ...snapshot.player, statusEffects: [] } }
        });
        setOutput('Cleared all status effects');
      } else if (macro.type === "unlock_skill") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: {
            player: {
              ...snapshot.player,
              skills: [...(snapshot.player.skills || []), macro.skill]
            }
          }
        });
        setOutput(`Unlocked skill: ${macro.skill}`);
      } else if (macro.type === "add_quest") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: {
            player: {
              ...snapshot.player,
              quests: [...(snapshot.player.quests || []), { id: macro.quest, status: "active" }]
            }
          }
        });
        setOutput(`Added quest: ${macro.quest}`);
      } else if (macro.type === "complete_quests") {
        if (!snapshot.player) return;
        const quests = (snapshot.player.quests || []).map(q => ({ ...q, status: "completed" }));
        handleDispatch({
          type: "UPDATE_STATE",
          payload: { player: { ...snapshot.player, quests } }
        });
        setOutput('Completed all quests');
      } else if (macro.type === "reset_quests") {
        if (!snapshot.player) return;
        handleDispatch({
          type: "UPDATE_STATE",
          payload: { player: { ...snapshot.player, quests: [] } }
        });
        setOutput('Reset all quests');
      }
    } catch(e) {
      setOutput(`Macro error: ${e.message}`);
    }
  };

  const renderCommandsTab = () => (
    <div>
      <div className="admin-tools-section">
        <h3>Extra Commands ({EXTRA_COMMANDS.length})</h3>
        <div className="admin-tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {EXTRA_COMMANDS.map((cmd, i) => (
            <button key={i} className="admin-tools-button" onClick={() => runMacro(cmd)}>
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlayerTab = () => (
    <div>
      <div className="admin-tools-section">
        <h3>Player Economy</h3>
        <div className="admin-tools-grid">
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              aria-label="Gold amount"
            />
            <button className="admin-tools-button" onClick={() => addGold(goldAmount)}>Add Gold</button>
          </div>
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={soulpointsAmount}
              onChange={(e) => setSoulpointsAmount(e.target.value)}
              aria-label="Soulpoints amount"
            />
            <button className="admin-tools-button" onClick={() => addSoulpoints(soulpointsAmount)}>Add Soulpoints</button>
          </div>
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={xpAmount}
              onChange={(e) => setXpAmount(e.target.value)}
              aria-label="XP amount"
            />
            <button className="admin-tools-button" onClick={() => addXP(xpAmount)}>Add XP</button>
          </div>
          <button className="admin-tools-button" onClick={addLevel}>+1 Level</button>
        </div>
      </div>
      <div className="admin-tools-section">
        <h3>Vitals</h3>
        <div className="admin-tools-grid">
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={hpAmount}
              onChange={(e) => setHpAmount(e.target.value)}
              aria-label="HP amount"
            />
            <button className="admin-tools-button" onClick={() => healHp(hpAmount)}>Heal HP</button>
          </div>
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={hpAmount}
              onChange={(e) => setHpAmount(e.target.value)}
              aria-label="HP damage amount"
            />
            <button className="admin-tools-button" onClick={() => damageHp(hpAmount)}>Damage HP</button>
          </div>
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={manaAmount}
              onChange={(e) => setManaAmount(e.target.value)}
              aria-label="Mana amount"
            />
            <button className="admin-tools-button" onClick={() => restoreMana(manaAmount)}>Restore Mana</button>
          </div>
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={manaAmount}
              onChange={(e) => setManaAmount(e.target.value)}
              aria-label="Mana drain amount"
            />
            <button className="admin-tools-button" onClick={() => drainMana(manaAmount)}>Drain Mana</button>
          </div>
          <button className="admin-tools-button" onClick={refillVitals}>Refill Vitals</button>
          <button className="admin-tools-button" onClick={revivePlayer}>Revive Player</button>
        </div>
      </div>
      <div className="admin-tools-section">
        <h3>Attributes</h3>
        <div className="admin-tools-grid">
          <div className="admin-tools-input-group">
            <input
              type="number"
              value={attributePointsAmount}
              onChange={(e) => setAttributePointsAmount(e.target.value)}
              aria-label="Attribute points amount"
            />
            <button className="admin-tools-button" onClick={() => addAttributePoints(attributePointsAmount)}>Add Attribute Points</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="admin-tools-grid">
      <button className="admin-tools-button" onClick={() => runGeneration('race')}>Gen Races</button>
      <button className="admin-tools-button" onClick={() => runGeneration('class')}>Gen Classes</button>
      <button className="admin-tools-button" onClick={() => runGeneration('skill')}>Gen Skills</button>
      <button className="admin-tools-button" onClick={giveRandomGear}>Gear Drop</button>
      <button className="admin-tools-button" onClick={addCraftingMats}>Crafting Mats</button>
    </div>
  );

  const renderSystemTab = () => (
    <div>
        <div className="admin-tools-summary-grid">
            <div className="admin-tools-stat-card">
              <span>Level</span>
              <strong>{playerSummary.level}</strong>
            </div>
            <div className="admin-tools-stat-card">
              <span>Gold</span>
              <strong>{playerSummary.gold}</strong>
            </div>
            <div className="admin-tools-stat-card">
              <span>Soulpoints</span>
              <strong>{playerSummary.soulpoints}</strong>
            </div>
            <div className="admin-tools-stat-card">
              <span>XP</span>
              <strong>{playerSummary.xp}</strong>
            </div>
            <div className="admin-tools-stat-card">
              <span>HP</span>
              <strong>{playerSummary.hp}</strong>
            </div>
            <div className="admin-tools-stat-card">
              <span>Mana</span>
              <strong>{playerSummary.mana}</strong>
            </div>
        </div>
        <div className="admin-tools-grid admin-tools-system-actions">
            <button className="admin-tools-button admin-tools-danger-button" onClick={resetGame}>Reset Game</button>
        </div>
        <div className="admin-tools-section">
            <h3>Player State Inspector</h3>
            <div className="admin-tools-output" style={{ maxHeight: '300px' }}>
                <pre>{JSON.stringify(playerState, null, 2)}</pre>
            </div>
        </div>
    </div>
  );

  const renderAgentsTab = () => {
    const agentNames = agentCatalog
      .map((item) => item.name || item.id)
      .filter(Boolean);
    const selectOptions = [...new Set([...agentNames, agentSelection || "narrator"])];

    return (
      <div>
        <div className="admin-tools-section">
          <h3>Agent Routes (Dev)</h3>
          <div className="admin-tools-grid">
            <button
              className="admin-tools-button"
              onClick={handleFetchAgents}
              disabled={agentBusy}
            >
              {agentBusy ? "Loading..." : "Fetch /api/agents"}
            </button>
          </div>
        </div>
        <div className="admin-tools-section">
          <h3>Run Agent</h3>
          <div className="admin-tools-grid">
            <label className="admin-tools-field">
              <span>Agent</span>
              <select
                value={agentSelection}
                onChange={(event) => setAgentSelection(event.target.value)}
              >
                {selectOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-tools-field">
              <span>Model</span>
              <input
                value={agentModel}
                onChange={(event) => setAgentModel(event.target.value)}
                placeholder="gemini-2.5-flash"
              />
            </label>
            <label className="admin-tools-field">
              <span>Temperature</span>
              <input
                value={agentTemperature}
                onChange={(event) => setAgentTemperature(event.target.value)}
                placeholder="0.8"
              />
            </label>
            <label className="admin-tools-field admin-tools-field-full">
              <span>Input JSON</span>
              <textarea
                value={agentInput}
                onChange={(event) => setAgentInput(event.target.value)}
                rows={8}
              />
            </label>
            <button
              className="admin-tools-button"
              onClick={handleRunAgent}
              disabled={agentBusy}
            >
              {agentBusy ? "Running..." : "POST /api/agents/run"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isDevBuild) return null;

  return (
    <div>
      <button className="admin-toggle-button" onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? "Hide Admin" : "Show Admin"} (Ctrl+`)
      </button>

      {isVisible && (
        <div className="admin-tools-container">
          <div className="admin-tools-header">
            <h2>Admin Tools</h2>
            <button
              type="button"
              className="admin-tools-close-button"
              onClick={() => setIsVisible(false)}
              aria-label="Close admin tools"
            >
              x
            </button>
          </div>
          
          <div className="admin-tools-tabs">
            <button className={`admin-tools-tab ${activeTab === 'player' ? 'active' : ''}`} onClick={() => setActiveTab('player')}>Player</button>
            <button className={`admin-tools-tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>Content</button>
            <button className={`admin-tools-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System</button>
            <button className={`admin-tools-tab ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>Agents</button>
            <button className={`admin-tools-tab ${activeTab === 'commands' ? 'active' : ''}`} onClick={() => setActiveTab('commands')}>Commands</button>
          </div>

          <div className="admin-tools-content">
            {activeTab === 'player' && renderPlayerTab()}
            {activeTab === 'content' && renderContentTab()}
            {activeTab === 'system' && renderSystemTab()}
            {activeTab === 'agents' && renderAgentsTab()}
            {activeTab === 'commands' && renderCommandsTab()}

            {output && (
                <div className="admin-tools-section">
                    <div className="admin-tools-output-header">
                      <h3>Output</h3>
                      <div className="admin-tools-output-actions">
                        <button className="admin-tools-button" type="button" onClick={copyOutput}>Copy</button>
                        <button className="admin-tools-button" type="button" onClick={clearOutput}>Clear</button>
                      </div>
                    </div>
                    <div className="admin-tools-output">{output}</div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
