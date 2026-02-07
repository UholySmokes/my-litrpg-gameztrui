import React, { useState } from "react";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { mergeInventoryItems } from "../utils/shared.js";

const styles = {
  container: {
    padding: "1rem",
    background: "#111",
    color: "#0f0",
    fontFamily: "monospace",
    border: "1px solid #0f0",
    margin: "1rem",
  },
  button: {
    background: "#333",
    color: "#fff",
    border: "1px solid #fff",
    padding: "0.5rem",
    cursor: "pointer",
    marginRight: "0.5rem",
  },
  output: {
    marginTop: "1rem",
    whiteSpace: "pre-wrap",
    background: "#000",
    padding: "0.5rem",
    maxHeight: "300px",
    overflowY: "auto",
  },
};

export default function AdminTools({ dispatch, getState }) {
  const [output, setOutput] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const addGold = (amount) => {
    const currentState = getState?.();
    if (!currentState) {
      setOutput("Cannot get current state");
      return;
    }

    // Add gold directly to player state
    const existingCurrency = currentState.player?.currency || {};
    const currentGold = existingCurrency.goldCoins ?? currentState.player?.gold ?? 0;
    const newGold = currentGold + amount;

    dispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...currentState.player,
          gold: newGold,
          currency: {
            ...existingCurrency,
            goldCoins: newGold,
          },
        },
      },
    });
    setOutput(`Added ${amount} gold (total: ${newGold})`);
  };

  const addLevel = () => {
    const currentState = getState?.();
    if (!currentState) {
      setOutput("Cannot get current state");
      return;
    }

    // Use existing LEVEL_UP action
    dispatch({ type: "LEVEL_UP" });
    setOutput(`Added 1 level`);
  };

  const addXP = (amount) => {
    // Use existing ADD_XP action
    dispatch({ type: "ADD_XP", payload: amount });
    setOutput(`Added ${amount} XP`);
  };

  const addSoulpoints = (amount) => {
    const currentState = getState?.();
    if (!currentState) {
      setOutput("Cannot get current state");
      return;
    }

    const existingCurrency = currentState.player?.currency || {};
    const currentSoulpoints = existingCurrency.soulpoints || 0;
    const newSoul = currentSoulpoints + amount;

    dispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...currentState.player,
          soulpoints:
            currentState.player?.soulpoints !== undefined
              ? (currentState.player?.soulpoints || 0) + amount
              : currentState.player?.soulpoints,
          currency: {
            ...existingCurrency,
            goldCoins:
              existingCurrency.goldCoins || currentState.player?.gold || 0,
            soulpoints: newSoul,
          },
        },
      },
    });
    setOutput(`Added ${amount} soulpoints (total: ${newSoul})`);
  };

  const refillVitals = () => {
    const currentState = getState?.();
    if (!currentState) {
      setOutput("Cannot get current state");
      return;
    }

    dispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...currentState.player,
          hp: {
            ...(currentState.player.hp || {}),
            current:
              currentState.player.hp?.max ||
              currentState.player.hp?.current ||
              100,
          },
          mana: {
            ...(currentState.player.mana || {}),
            current:
              currentState.player.mana?.max ||
              currentState.player.mana?.current ||
              50,
          },
        },
      },
    });
    setOutput("HP and Mana refilled to max");
  };

  const addCraftingMats = () => {
    const mats = [
      { id: "iron_ore", quantity: 5 },
      { id: "leather", quantity: 5 },
      { id: "magic_essence", quantity: 3 },
    ];
    dispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...(getState?.().player || {}),
          inventory: mergeInventoryItems(
            (getState?.().player?.inventory || []).map((item) => ({ ...item })),
            mats,
          ),
        },
      },
    });
    setOutput("Added crafting materials bundle");
  };

  const giveRandomGear = () => {
    const loot = [
      {
        id: "iron_sword",
        name: "Iron Sword",
        type: "equipment",
        equipSlot: "weapon",
      },
      {
        id: "chain_mail",
        name: "Chain Mail",
        type: "equipment",
        equipSlot: "armor",
      },
    ];
    dispatch({
      type: "UPDATE_STATE",
      payload: {
        player: {
          ...(getState?.().player || {}),
          inventory: mergeInventoryItems(
            (getState?.().player?.inventory || []).map((item) => ({ ...item })),
            loot,
          ),
        },
      },
    });
    setOutput("Added iron sword and chain mail to inventory");
  };

  const runGeneration = (type) => {
    let result;
    const start = performance.now();
    switch (type) {
      case "race":
        result = ContentGenerator.generateCharacterOptions(10).races;
        break;
      case "class":
        result = ContentGenerator.generateCharacterOptions(10).classes;
        break;
      case "skill":
        result = ContentGenerator.generateSkills(10, 5);
        break;
      default:
        result = "Unknown generation type";
    }
    const end = performance.now();

    const summary =
      `Generated ${Array.isArray(result) ? result.length : 1} items in ${(end - start).toFixed(2)}ms\n\n` +
      JSON.stringify(result, null, 2);
    setOutput(summary);

    // Log to console for debugging
    console.log(`Generated ${type}s:`, result);
  };

  return (
    <div>
      {/* Small Admin Button - Top Center */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: "fixed",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(51, 51, 51, 0.8)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          padding: "0.25rem 0.5rem",
          cursor: "pointer",
          fontSize: "0.7rem",
          fontFamily: "monospace",
          zIndex: 1000,
          borderRadius: "4px",
        }}
      >
        {isVisible ? "Hide" : "Admin"}
      </button>

      {/* Admin Panel - Only show when visible */}
      {isVisible && (
        <div
          style={{
            position: "fixed",
            top: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(17, 17, 17, 0.95)",
            color: "#0f0",
            fontFamily: "monospace",
            border: "1px solid #0f0",
            padding: "1rem",
            borderRadius: "4px",
            zIndex: 999,
            minWidth: "300px",
          }}
        >
          <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>
            <strong>Admin Tools</strong>
          </div>

          <div style={{ marginBottom: "0.5rem", fontSize: "0.7rem" }}>
            <strong>Player Stats:</strong>
            <div
              style={{
                marginTop: "0.25rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem",
              }}
            >
              <button onClick={() => addGold(1000)} style={styles.button}>
                +1k Gold
              </button>
              <button onClick={() => addSoulpoints(1000)} style={styles.button}>
                +1k Soulpoints
              </button>
              <button onClick={() => addLevel()} style={styles.button}>
                +1 Level
              </button>
              <button onClick={() => addXP(100)} style={styles.button}>
                +100 XP
              </button>
              <button onClick={() => addXP(1000)} style={styles.button}>
                +1k XP
              </button>
              <button onClick={refillVitals} style={styles.button}>
                Refill HP/Mana
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "0.5rem", fontSize: "0.7rem" }}>
            <strong>Content:</strong>
            <div
              style={{
                marginTop: "0.25rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem",
              }}
            >
              <button
                onClick={() => runGeneration("race")}
                style={styles.button}
              >
                Races
              </button>
              <button
                onClick={() => runGeneration("class")}
                style={styles.button}
              >
                Classes
              </button>
              <button
                onClick={() => runGeneration("skill")}
                style={styles.button}
              >
                Skills
              </button>
              <button onClick={giveRandomGear} style={styles.button}>
                Gear Drop
              </button>
              <button onClick={addCraftingMats} style={styles.button}>
                Craft Mats
              </button>
            </div>
          </div>

          {output && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", marginBottom: "0.25rem" }}>
                <strong>Output:</strong>
              </div>
              <div
                style={{
                  background: "#000",
                  padding: "0.25rem",
                  fontSize: "0.6rem",
                  maxHeight: "150px",
                  overflowY: "auto",
                  borderRadius: "2px",
                }}
              >
                {output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
