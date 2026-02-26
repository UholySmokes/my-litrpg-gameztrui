import React, { useMemo, useState, useEffect } from "react";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { mergeInventoryItems } from "../utils/shared.js";
import { listAgents, runAgent } from "../core/AgentService.js";
import "./AdminTools.css";

export default function AdminTools({ dispatch, getState }) {
  const isDevBuild = Boolean(import.meta.env.DEV);
  if (!isDevBuild) return null;

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
          </div>

          <div className="admin-tools-content">
            {activeTab === 'player' && renderPlayerTab()}
            {activeTab === 'content' && renderContentTab()}
            {activeTab === 'system' && renderSystemTab()}
            {activeTab === 'agents' && renderAgentsTab()}

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
