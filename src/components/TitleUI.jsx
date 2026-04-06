// TitleUI.jsx
import React, { useEffect, useRef, useState } from "react";
import { titleDatabase } from "../data/titleData.js";
import { getPurchasableTitles } from "../core/titleLogic.js";
import {
  PRESTIGE_MIN_LEVEL,
  calculatePrestigeShards,
  defaultPrestigeStats,
  getUpgradeCost,
} from "../../packages/game-core/src/systems/PrestigeSystem.ts";

export default function TitleUI({
  isOpen,
  onClose,
  gameState,
  onEquip,
  onUnequip,
  onPurchase,
  onPerformPrestige,
  onBuyPrestigeUpgrade,
  variant = "modal",
}) {
  const [activeTab, setActiveTab] = useState("unlocked");
  const dialogRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  const isModal = variant !== "window";
  useEffect(() => {
    if (!isModal || !isOpen) return;
    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      lastFocusedElementRef.current?.focus?.();
    };
  }, [isModal, isOpen]);

  useEffect(() => {
    if (!isModal || !isOpen || typeof onClose !== "function") return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModal, isOpen, onClose]);

  if (isModal && !isOpen) return null;

  const unlockedTitles = (gameState.player.unlockedTitles || [])
    .map((id) => titleDatabase.find((t) => t.id === id))
    .filter((t) => t);

  const equippedTitle = gameState.player.equippedTitle
    ? titleDatabase.find((t) => t.id === gameState.player.equippedTitle)
    : null;

  const purchasableTitles = getPurchasableTitles(gameState);
  const currency = gameState.player.currency || { goldCoins: 0, soulpoints: 0 };
  const prestige =
    gameState?.player?.prestige && typeof gameState.player.prestige === "object"
      ? { ...defaultPrestigeStats(), ...gameState.player.prestige }
      : defaultPrestigeStats();
  const prestigeHistory = Array.isArray(gameState?.player?.progress?.prestigeHistory)
    ? gameState.player.progress.prestigeHistory.slice(-3).reverse()
    : [];
  const playerLevel = gameState?.player?.level || 1;
  const canPrestige = playerLevel >= PRESTIGE_MIN_LEVEL;
  const shardPreview = calculatePrestigeShards(playerLevel);
  const prestigeUpgradeRows = Object.entries(prestige.upgrades || {})
    .map(([type, level]) => {
      const normalizedLevel = Number.isFinite(Number(level)) ? Number(level) : 0;
      const nextCost = getUpgradeCost(normalizedLevel);
      return {
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        level: normalizedLevel,
        nextCost,
        canAfford: prestige.soulShards >= nextCost,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const canAfford = (title) => {
    if (!title.unlockConditions?.purchase) return false;
    if (
      title.unlockConditions.purchase.goldCoins &&
      currency.goldCoins < title.unlockConditions.purchase.goldCoins
    )
      return false;
    if (
      title.unlockConditions.purchase.soulpoints &&
      currency.soulpoints < title.unlockConditions.purchase.soulpoints
    )
      return false;
    return true;
  };

  const panel = (
    <div className="holo-panel" style={{ padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 id="title-dialog-title" style={{ color: "var(--holo-cyan)", margin: 0 }}>
          [TITLE SYSTEM]
        </h2>
        {onClose && (
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
        )}
      </div>

          <div style={{ marginBottom: "1rem" }}>

          <div
            className="holo-panel"
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                  Prestige Rites
                </div>
                <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
                  Level {prestige.prestigeLevel} · {prestige.soulShards} soul shards · XP {prestige.xpMultiplier.toFixed(2)}x
                </div>
              </div>
              <button
                className="holo-button"
                type="button"
                onClick={() => onPerformPrestige?.()}
                disabled={typeof onPerformPrestige !== "function" || !canPrestige}
                style={{
                  borderColor: canPrestige ? "var(--holo-gold)" : "rgba(0, 243, 255, 0.4)",
                  color: canPrestige ? "var(--holo-gold)" : "var(--text-dim)",
                }}
              >
                {canPrestige
                  ? `Ascend for ${shardPreview} shards`
                  : `Requires level ${PRESTIGE_MIN_LEVEL}`}
              </button>
            </div>

            <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
              {canPrestige
                ? "Prestige resets level and experience to restart your climb with permanent shard growth."
                : `Reach level ${PRESTIGE_MIN_LEVEL} to unlock ascension.`}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {prestigeUpgradeRows.map((upgrade) => (
                <div
                  key={upgrade.type}
                  className="holo-panel"
                  style={{ padding: "0.75rem", display: "grid", gap: "0.4rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                      {upgrade.label}
                    </span>
                    <span style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
                      Rank {upgrade.level}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                    Next rite costs {upgrade.nextCost} shards.
                  </div>
                  <button
                    className="holo-button"
                    type="button"
                    onClick={() => onBuyPrestigeUpgrade?.(upgrade.type)}
                    disabled={
                      typeof onBuyPrestigeUpgrade !== "function" || !upgrade.canAfford
                    }
                    style={{ opacity: upgrade.canAfford ? 1 : 0.6 }}
                  >
                    Upgrade {upgrade.label}
                  </button>
                </div>
              ))}
            </div>

            {prestigeHistory.length > 0 ? (
              <div style={{ display: "grid", gap: "0.35rem" }}>
                <div style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                  Recent Ascensions
                </div>
                {prestigeHistory.map((entry, index) => (
                  <div
                    key={`${entry?.prestigeLevel || 0}-${entry?.atLevel || 0}-${index}`}
                    style={{ color: "var(--text-main)", fontSize: "0.85rem" }}
                  >
                    Prestige {entry?.prestigeLevel || 0} at level {entry?.atLevel || 0} · +
                    {entry?.shardsEarned || 0} shards
                  </div>
                ))}
              </div>
            ) : null}
          </div>
            <div style={{ color: "var(--text-main)" }}>
              Current Title:{" "}
              <span style={{ color: "var(--holo-gold)", fontWeight: "bold" }}>
                {equippedTitle ? equippedTitle.name : "None"}
              </span>
            </div>
            <div
              style={{
                color: "var(--text-main)",
                fontSize: "0.85rem",
                marginTop: "0.25rem",
              }}
            >
              Gold:{" "}
              <span style={{ color: "var(--holo-gold)" }}>
                {currency.goldCoins}
              </span>{" "}
              | Soulpoints:{" "}
              <span style={{ color: "var(--holo-cyan)" }}>
                {currency.soulpoints}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              className="holo-button"
              onClick={() => setActiveTab("unlocked")}
              style={{
                backgroundColor:
                  activeTab === "unlocked"
                    ? "rgba(0, 243, 255, 0.2)"
                    : "transparent",
              }}
            >
              Unlocked ({unlockedTitles.length})
            </button>
            <button
              className="holo-button"
              onClick={() => setActiveTab("purchasable")}
              style={{
                backgroundColor:
                  activeTab === "purchasable"
                    ? "rgba(0, 243, 255, 0.2)"
                    : "transparent",
              }}
            >
              Purchasable ({purchasableTitles.length})
            </button>
          </div>

          <div>
            {activeTab === "unlocked" ? (
              unlockedTitles.length > 0 ? (
                unlockedTitles.map((title) => (
                  <div
                    key={title.id}
                    className="holo-panel"
                    style={{ padding: "1rem", marginBottom: "1rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--holo-cyan)",
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                        }}
                      >
                        {title.name}{" "}
                        {equippedTitle?.id === title.id && "(EQUIPPED)"}
                      </div>
                      {equippedTitle?.id === title.id ? (
                        <button
                          className="holo-button"
                          onClick={() => onUnequip(title.id)}
                          style={{
                            fontSize: "0.85rem",
                            borderColor: "var(--holo-alert)",
                            color: "var(--holo-alert)",
                          }}
                        >
                          Unequip
                        </button>
                      ) : (
                        <button
                          className="holo-button"
                          onClick={() => onEquip(title.id)}
                          style={{ fontSize: "0.85rem" }}
                        >
                          Equip
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        color: "var(--text-main)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {title.description}
                    </div>
                    <div
                      style={{ fontSize: "0.85rem", color: "var(--text-main)" }}
                    >
                      <div>
                        Secondary Bonus (Always Active):{" "}
                        {JSON.stringify(title.secondaryBonus)}
                      </div>
                      <div>
                        Main Bonus (When Equipped):{" "}
                        {JSON.stringify(title.mainBonus)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: "var(--text-main)",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No unlocked titles
                </div>
              )
            ) : purchasableTitles.length > 0 ? (
              purchasableTitles.map((title) => {
                const affordable = canAfford(title);
                const price = title.unlockConditions?.purchase;
                const priceText = price?.goldCoins
                  ? `${price.goldCoins} Gold`
                  : price?.soulpoints
                    ? `${price.soulpoints} Soulpoints`
                    : "Free";

                return (
                  <div
                    key={title.id}
                    className="holo-panel"
                    style={{ padding: "1rem", marginBottom: "1rem" }}
                  >
                    <div
                      style={{
                        color: "var(--holo-cyan)",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                        fontSize: "1.1rem",
                      }}
                    >
                      {title.name}
                    </div>
                    <div
                      style={{
                        color: "var(--text-main)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {title.description}
                    </div>
                    <div
                      style={{
                        color: "var(--holo-gold)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Price: {priceText}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-main)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div>
                        Secondary Bonus: {JSON.stringify(title.secondaryBonus)}
                      </div>
                      <div>Main Bonus: {JSON.stringify(title.mainBonus)}</div>
                    </div>
                    <button
                      className="holo-button"
                      onClick={() => onPurchase(title)}
                      disabled={!affordable ? true : false}
                      style={{
                        width: "100%",
                        opacity: affordable ? 1 : 0.5,
                        cursor: affordable ? "pointer" : "not-allowed",
                      }}
                    >
                      {affordable ? "Purchase" : "Cannot Afford"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  color: "var(--text-main)",
                  textAlign: "center",
                  padding: "2rem",
                }}
              >
                No purchasable titles
              </div>
            )}
          </div>
    </div>
  );

  if (!isModal) {
    return <div style={{ maxHeight: "100%", overflow: "auto" }}>{panel}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }}
      >
        {panel}
      </div>
    </div>
  );
}
