// GachaUI.jsx
import React, { useState } from "react";
import {
  gachaPools,
  calculateGachaResult,
  getAdjustedRarityRates,
} from "../data/gachaData.js";
import { getTitleBonuses } from "../core/titleLogic.js";

const rarityColors = {
  common: "#9d9d9d",
  uncommon: "#1eff00",
  rare: "#0070dd",
  epic: "#a335ee",
  legendary: "#ff8000",
};

export default function GachaUI({
  isOpen,
  onClose,
  gameState,
  onPull,
  variant = "modal",
}) {
  const [selectedPool, setSelectedPool] = useState("equipment");
  const [lastResults, setLastResults] = useState([]);

  const isModal = variant !== "window";
  if (isModal && !isOpen) return null;

  if (!gameState || !gameState.player) {
    return (
      <div className="holo-panel gacha-empty">
        <div className="gacha-empty__title">Gacha unavailable</div>
        <div className="gacha-empty__body">
          Character data not loaded. Please complete character creation first.
        </div>
      </div>
    );
  }

  const pool = gachaPools[selectedPool];
  const titleBonuses = getTitleBonuses(gameState.player);
  const gachaBonus = Number.isFinite(titleBonuses.gachaBonus)
    ? Math.min(Math.max(titleBonuses.gachaBonus, 0), 0.5)
    : 0;
  const effectiveRates = getAdjustedRarityRates(pool.rarityRates, gachaBonus);
  const currencySource = gameState.player.currency || {};
  const currency = {
    goldCoins: currencySource.goldCoins ?? gameState.player.gold ?? 0,
    soulpoints: currencySource.soulpoints ?? gameState.player.soulpoints ?? 0,
  };

  const canAfford = () => {
    if (pool.cost.goldCoins && currency.goldCoins < pool.cost.goldCoins)
      return false;
    if (pool.cost.soulpoints && currency.soulpoints < pool.cost.soulpoints)
      return false;
    return true;
  };

  const handlePull = () => {
    if (!canAfford()) return;

    const results = calculateGachaResult(selectedPool, pool.pullCount, {
      gachaBonus,
    });
    setLastResults(results);
    onPull(selectedPool, results);
  };

  const priceText = pool.cost.goldCoins
    ? `${pool.cost.goldCoins} Gold`
    : `${pool.cost.soulpoints} Soulpoints`;

  const panel = (
    <div className="gacha-modal__frame">
      <header className="gacha-modal__header">
        <div className="gacha-modal__title-group">
          <div className="gacha-modal__title">Gacha terminal</div>
          <div className="gacha-modal__subtitle">Fortune engine online</div>
        </div>
        {onClose && (
          <button className="holo-button holo-button--danger" onClick={onClose}>
            Close
          </button>
        )}
      </header>

        <div className="gacha-modal__body">
          <aside className="gacha-modal__sidebar">
            <div className="gacha-modal__currency">
              <div>
                Gold: <span>{currency.goldCoins}</span>
              </div>
              <div>
                Soulpoints: <span>{currency.soulpoints}</span>
              </div>
            </div>

            <div className="gacha-modal__pool-list">
              {Object.keys(gachaPools).map((poolId) => {
                const isSelected = selectedPool === poolId;
                return (
                  <button
                    key={poolId}
                    className={`holo-button gacha-modal__pool-button${
                      isSelected ? " gacha-modal__pool-button--active" : ""
                    }`}
                    onClick={() => {
                      setSelectedPool(poolId);
                      setLastResults([]);
                    }}
                  >
                    {gachaPools[poolId].name}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="gacha-modal__details">
            <div className="gacha-modal__pool-card">
              <div className="gacha-modal__pool-name">{pool.name}</div>
              <div className="gacha-modal__pool-desc">{pool.description}</div>
              <div className="gacha-modal__pool-cost">Cost: {priceText}</div>
              <div className="gacha-modal__rates">
                {Object.entries(effectiveRates).map(([rarity, rate]) => (
                  <div
                    key={rarity}
                    className="gacha-modal__rate"
                    style={{ "--rarity-color": rarityColors[rarity] }}
                  >
                    <span>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </span>
                    <span>{(rate * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <button
                className="holo-button holo-button--solid gacha-modal__pull"
                onClick={handlePull}
                disabled={!canAfford() ? true : false}
              >
                {canAfford() ? "Pull" : "Cannot afford"}
              </button>
            </div>

            {lastResults.length > 0 && (
              <div className="gacha-modal__results">
                <div className="gacha-modal__results-title">Drop log</div>
                <div className="gacha-modal__results-grid">
                  {lastResults.map((result, index) => (
                    <div
                      key={index}
                      className="gacha-modal__result"
                      style={{ "--rarity-color": rarityColors[result.rarity] }}
                    >
                      <div>{result.name}</div>
                      <div className="gacha-modal__result-rarity">
                        {result.rarity.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="gacha-modal" style={{ maxHeight: "100%", overflow: "auto" }}>
        {panel}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content gacha-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {panel}
      </div>
    </div>
  );
}
