// TitleUI.jsx
import React, { useState } from "react";
import { titleDatabase } from "../data/titleData.js";
import { getPurchasableTitles } from "../systems/titles/TitleSystem.js";

export default function TitleUI({
  isOpen,
  onClose,
  gameState,
  onEquip,
  onUnequip,
  onPurchase,
}) {
  const [activeTab, setActiveTab] = useState("unlocked");

  if (!isOpen) return null;

  const unlockedTitles = (gameState.player.unlockedTitles || [])
    .map((id) => titleDatabase.find((t) => t.id === id))
    .filter((t) => t);

  const equippedTitle = gameState.player.equippedTitle
    ? titleDatabase.find((t) => t.id === gameState.player.equippedTitle)
    : null;

  const purchasableTitles = getPurchasableTitles(gameState);
  const currency = gameState.player.currency || { goldCoins: 0, soulpoints: 0 };

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }}
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
              [TITLE SYSTEM]
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

          <div style={{ marginBottom: "1rem" }}>
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
      </div>
    </div>
  );
}
