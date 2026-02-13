import React, { useMemo, useState, useEffect } from "react";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { mergeInventoryItems } from "../utils/shared.js";
import "./AdminTools.css";

export default function AdminTools({ dispatch, getState }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("player");
  const [output, setOutput] = useState("");

  // Amounts for input fields
  const [goldAmount, setGoldAmount] = useState(1000);
  const [soulpointsAmount, setSoulpointsAmount] = useState(100);
  const [xpAmount, setXpAmount] = useState(100);

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
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.ctrlKey && e.key === "`") {
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const renderPlayerTab = () => (
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
      <button className="admin-tools-button" onClick={refillVitals}>Refill Vitals</button>
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
          </div>

          <div className="admin-tools-content">
            {activeTab === 'player' && renderPlayerTab()}
            {activeTab === 'content' && renderContentTab()}
            {activeTab === 'system' && renderSystemTab()}

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
