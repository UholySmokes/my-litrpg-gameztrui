import React, { useState, useEffect } from "react";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { mergeInventoryItems } from "../utils/shared.js";
import "./AdminTools.css";

export default function AdminTools({ dispatch, getState }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("Player");
  const [output, setOutput] = useState("");
  const [playerState, setPlayerState] = useState(null);

  // Amounts for input fields
  const [goldAmount, setGoldAmount] = useState(1000);
  const [soulpointsAmount, setSoulpointsAmount] = useState(100);
  const [xpAmount, setXpAmount] = useState(100);

  useEffect(() => {
    if (isVisible) {
      const currentState = getState?.();
      setPlayerState(currentState?.player);
    }
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '`') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, getState]);

  const handleDispatch = (action) => {
    dispatch(action);
    // Refresh player state after dispatching an action
    setTimeout(() => {
        const currentState = getState?.();
        setPlayerState(currentState?.player);
    }, 100);
  };

  const addGold = (amount) => {
    const value = parseInt(amount, 10);
    if (isNaN(value)) return;

    handleDispatch({
        type: "UPDATE_STATE",
        payload: {
            player: {
                ...getState().player,
                currency: {
                    ...getState().player.currency,
                    goldCoins: (getState().player.currency.goldCoins || 0) + value,
                },
            },
        },
    });
    setOutput(`Added ${value} gold.`);
  };

  const addSoulpoints = (amount) => {
    const value = parseInt(amount, 10);
    if (isNaN(value)) return;
    
    handleDispatch({
        type: "UPDATE_STATE",
        payload: {
            player: {
                ...getState().player,
                currency: {
                    ...getState().player.currency,
                    soulpoints: (getState().player.currency.soulpoints || 0) + value,
                },
            },
        },
    });
    setOutput(`Added ${value} soulpoints.`);
  };

  const addXP = (amount) => {
    const value = parseInt(amount, 10);
    if (isNaN(value)) return;
    handleDispatch({ type: "ADD_XP", payload: value });
    setOutput(`Added ${value} XP`);
  };

  const addLevel = () => {
    handleDispatch({ type: "LEVEL_UP" });
    setOutput(`Added 1 level`);
  };

  const refillVitals = () => {
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...getState().player,
          hp: { ...getState().player.hp, current: getState().player.hp.max },
          mana: { ...getState().player.mana, current: getState().player.mana.max },
        },
      },
    });
    setOutput("HP and Mana refilled to max");
  };

  const addCraftingMats = () => {
    const mats = [
      { id: "iron_ore", quantity: 10 },
      { id: "leather", quantity: 10 },
      { id: "magic_essence", quantity: 5 },
    ];
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...getState().player,
          inventory: mergeInventoryItems(getState().player.inventory, mats),
        },
      },
    });
    setOutput("Added crafting materials bundle.");
  };

  const giveRandomGear = () => {
    const loot = [
        { id: "iron_sword", name: "Iron Sword", type: "equipment", equipSlot: "weapon", quantity: 1 },
        { id: "chain_mail", name: "Chain Mail", type: "equipment", equipSlot: "armor", quantity: 1 },
    ];
    handleDispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...getState().player,
          inventory: mergeInventoryItems(getState().player.inventory, loot),
        },
      },
    });
    setOutput("Added iron sword and chain mail to inventory.");
  };

  const runGeneration = (type) => {
    const start = performance.now();
    let result;
    switch (type) {
      case "race": result = ContentGenerator.generateCharacterOptions(5).races; break;
      case "class": result = ContentGenerator.generateCharacterOptions(5).classes; break;
      case "skill": result = ContentGenerator.generateSkills(10, 5); break;
      default: result = "Unknown generation type";
    }
    const end = performance.now();
    const summary = `Generated ${Array.isArray(result) ? result.length : 1} ${type}s in ${(end - start).toFixed(2)}ms\n\n` + JSON.stringify(result, null, 2);
    setOutput(summary);
    console.log(`Generated ${type}s:`, result);
  };
  
  const resetGame = () => {
    if (window.confirm("Are you sure you want to reset all game data? This cannot be undone.")) {
      handleDispatch({ type: "RESET_GAME_STATE" });
      setOutput("Game state has been reset.");
      setTimeout(() => {
        const currentState = getState?.();
        setPlayerState(currentState?.player);
      }, 100);
    }
  };

  const renderPlayerTab = () => (
    <div className="admin-tools-grid">
      <div className="admin-tools-input-group">
        <input type="number" value={goldAmount} onChange={e => setGoldAmount(e.target.value)} />
        <button className="admin-tools-button" onClick={() => addGold(goldAmount)}>Add Gold</button>
      </div>
      <div className="admin-tools-input-group">
        <input type="number" value={soulpointsAmount} onChange={e => setSoulpointsAmount(e.target.value)} />
        <button className="admin-tools-button" onClick={() => addSoulpoints(soulpointsAmount)}>Add Soulpoints</button>
      </div>
      <div className="admin-tools-input-group">
        <input type="number" value={xpAmount} onChange={e => setXpAmount(e.target.value)} />
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
        <div className="admin-tools-grid">
            <button className="admin-tools-button" onClick={resetGame}>Reset Game</button>
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
            <button onClick={() => setIsVisible(false)} style={{background: 'none', border: 'none', color: '#f00', fontSize: '1.2em', cursor: 'pointer'}}>X</button>
          </div>
          
          <div className="admin-tools-tabs">
            <button className={`admin-tools-tab ${activeTab === 'Player' ? 'active' : ''}`} onClick={() => setActiveTab('Player')}>Player</button>
            <button className={`admin-tools-tab ${activeTab === 'Content' ? 'active' : ''}`} onClick={() => setActiveTab('Content')}>Content</button>
            <button className={`admin-tools-tab ${activeTab === 'System' ? 'active' : ''}`} onClick={() => setActiveTab('System')}>System</button>
          </div>

          <div className="admin-tools-content">
            {activeTab === 'Player' && renderPlayerTab()}
            {activeTab === 'Content' && renderContentTab()}
            {activeTab === 'System' && renderSystemTab()}

            {output && (
                <div className="admin-tools-section">
                    <h3>Output</h3>
                    <div className="admin-tools-output">{output}</div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
