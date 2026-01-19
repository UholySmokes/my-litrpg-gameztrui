// ProfessionUI.jsx - Crafting and profession management interface
import React, { useState } from "react";
import {
  PROFESSIONS,
  getRecipesForProfession,
  getTierFromXp,
  getFullProfessionRank,
} from "../systems/profession/ProfessionRegistry.js";

export default function ProfessionUI({ isOpen, onClose, gameState, onCraft }) {
  const [selectedProfession, setSelectedProfession] = useState(null);

  if (!isOpen) return null;

  if (!gameState || !gameState.player) {
    return (
      <div className="holo-panel" style={{ padding: "1rem" }}>
        <div style={{ color: "var(--holo-cyan)", marginBottom: "1rem" }}>
          Professions unavailable
        </div>
        <div style={{ color: "rgba(0, 243, 255, 0.7)", fontSize: "0.9rem" }}>
          Character data not loaded. Please complete character creation first.
        </div>
      </div>
    );
  }

  const playerProfessions = gameState.player.professions || {};

  const handleCraft = (recipe) => {
    if (onCraft) {
      onCraft(recipe);
    }
  };

  const canCraft = (recipe) => {
    // Check if player has required ingredients
    const inventory = gameState.player.inventory || [];
    return recipe.ingredients.every((ingredient) => {
      const inventoryItem = inventory.find((item) => item.id === ingredient.id);
      const inventoryQuantity = inventoryItem
        ? (inventoryItem.quantity ?? 1)
        : 0;
      return inventoryQuantity >= ingredient.count;
    });
  };

  const getProfessionXp = (professionId) => {
    return playerProfessions[professionId]?.xp || 0;
  };

  const getProfessionLevel = (professionId) => {
    const xp = getProfessionXp(professionId);
    return getFullProfessionRank(xp);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px", maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="holo-panel" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ color: "var(--holo-cyan)", margin: 0 }}>
              [PROFESSIONS]
            </h2>
            <button
              className="holo-button"
              onClick={onClose}
              style={{
                borderColor: "var(--holo-alert)",
                color: "var(--holo-alert)",
              }}
            >
              Close
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "1rem",
            }}
          >
            {/* Profession List */}
            <div>
              <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
                Your Professions
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {Object.entries(PROFESSIONS).map(([id, profession]) => {
                  const level = getProfessionLevel(id);
                  const xp = getProfessionXp(id);

                  return (
                    <div
                      key={id}
                      className="holo-panel"
                      style={{
                        padding: "0.75rem",
                        cursor: "pointer",
                        border:
                          selectedProfession === id
                            ? "2px solid var(--holo-cyan)"
                            : "1px solid rgba(0, 243, 255, 0.3)",
                        backgroundColor:
                          selectedProfession === id
                            ? "rgba(0, 243, 255, 0.1)"
                            : "transparent",
                      }}
                      onClick={() => setSelectedProfession(id)}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "var(--holo-cyan)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {profession.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-main)",
                        }}
                      >
                        {level.rank} (Tier {level.tier})
                      </div>
                      <div
                        style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}
                      >
                        XP: {xp} / {level.nextTierXp || "Max"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recipe/Crafting Area */}
            <div>
              {selectedProfession ? (
                <>
                  <h3
                    style={{
                      color: "var(--holo-cyan)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {PROFESSIONS[selectedProfession].name} Recipes
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {getRecipesForProfession(
                      selectedProfession,
                      getTierFromXp(getProfessionXp(selectedProfession)).tier,
                    ).map((recipe) => {
                      const craftable = canCraft(recipe);

                      return (
                        <div
                          key={recipe.id}
                          className="holo-panel"
                          style={{ padding: "1rem" }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              color: "var(--holo-cyan)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {recipe.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-main)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {recipe.description}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-dim)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <strong>Ingredients:</strong>
                            {recipe.ingredients.map((ing) => {
                              const inventoryItem =
                                gameState.player.inventory?.find(
                                  (item) => item.id === ing.id,
                                );
                              const inventoryQuantity = inventoryItem
                                ? (inventoryItem.quantity ?? 1)
                                : 0;
                              const hasEnough = inventoryQuantity >= ing.count;
                              return (
                                <div
                                  key={ing.id}
                                  style={{
                                    color: hasEnough
                                      ? "var(--holo-green)"
                                      : "var(--holo-alert)",
                                  }}
                                >
                                  {ing.count}x {ing.id}{" "}
                                  {hasEnough ? "✓" : `(${inventoryQuantity})`}
                                </div>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--holo-gold)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            XP: {recipe.xp} | Time: {recipe.time}s
                          </div>
                          <button
                            className="holo-button"
                            onClick={() => handleCraft(recipe)}
                            disabled={!craftable ? true : false}
                            style={{
                              width: "100%",
                              opacity: craftable ? 1 : 0.5,
                              cursor: craftable ? "pointer" : "not-allowed",
                            }}
                          >
                            {craftable ? "Craft" : "Missing Ingredients"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-dim)",
                    padding: "2rem",
                  }}
                >
                  Select a profession to view recipes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
