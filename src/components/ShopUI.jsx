// ShopUI.jsx
import React, { useState } from "react";
import { getShopItemsByCategory } from "../data/shopData.js";
import { getTitleBonuses } from "../core/titleLogic.js";

export default function ShopUI({
  isOpen,
  onClose,
  gameState,
  onPurchase,
  variant = "modal",
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isModal = variant !== "window";
  if (isModal && !isOpen) return null;

  if (!gameState || !gameState.player) {
    return (
      <div className="holo-panel" style={{ padding: "1rem" }}>
        <div style={{ color: "var(--holo-cyan)", marginBottom: "1rem" }}>
          Shop unavailable
        </div>
        <div style={{ color: "rgba(0, 243, 255, 0.7)", fontSize: "0.9rem" }}>
          Character data not loaded. Please complete character creation first.
        </div>
      </div>
    );
  }

  const items = getShopItemsByCategory(selectedCategory);
  const currencySource = gameState.player.currency || {};
  const currency = {
    goldCoins: currencySource.goldCoins ?? gameState.player.gold ?? 0,
    soulpoints: currencySource.soulpoints ?? gameState.player.soulpoints ?? 0,
  };
  const titleBonuses = getTitleBonuses(gameState.player);
  const shopDiscount = Number.isFinite(titleBonuses.shopDiscount)
    ? Math.min(Math.max(titleBonuses.shopDiscount, 0), 0.9)
    : 0;

  const handlePurchase = (item) => {
    onPurchase(item);
  };

  const getDiscountedPrice = (item) => {
    const baseGold = item.price?.goldCoins ?? 0;
    const baseSoul = item.price?.soulpoints ?? 0;
    const multiplier = 1 - shopDiscount;
    return {
      goldCoins:
        baseGold > 0 ? Math.max(0, Math.floor(baseGold * multiplier)) : 0,
      soulpoints:
        baseSoul > 0 ? Math.max(0, Math.floor(baseSoul * multiplier)) : 0,
    };
  };

  const canAfford = (item) => {
    const price = getDiscountedPrice(item);
    if (price.goldCoins && currency.goldCoins < price.goldCoins) return false;
    if (price.soulpoints && currency.soulpoints < price.soulpoints)
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
        <h2 style={{ color: "var(--holo-cyan)", margin: 0 }}>[SHOP]</h2>
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

          <div
            style={{
              marginBottom: "1rem",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "var(--text-main)", marginRight: "1rem" }}>
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

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            {[
              "all",
              "items",
              "skills",
              "upgrades",
              "materials",
              "services",
            ].map((cat) => (
              <button
                key={cat}
                className="holo-button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor:
                    selectedCategory === cat
                      ? "rgba(0, 243, 255, 0.2)"
                      : "transparent",
                  textTransform: "capitalize",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {items.map((item) => {
              const affordable = canAfford(item);
              const discounted = getDiscountedPrice(item);
              const baseGold = item.price?.goldCoins ?? 0;
              const baseSoul = item.price?.soulpoints ?? 0;
              const baseText = baseGold
                ? `${baseGold} Gold`
                : `${baseSoul} Soulpoints`;
              const discountedText = discounted.goldCoins
                ? `${discounted.goldCoins} Gold`
                : `${discounted.soulpoints} Soulpoints`;
              const priceText =
                shopDiscount > 0 && discountedText !== baseText
                  ? `${discountedText} (was ${baseText})`
                  : baseText;

              return (
                <div
                  key={item.id}
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
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-main)",
                      marginBottom: "0.5rem",
                      minHeight: "40px",
                    }}
                  >
                    {item.description}
                  </div>
                  <div
                    style={{
                      color: "var(--holo-gold)",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {priceText}
                  </div>
                  <button
                    className="holo-button"
                    onClick={() => handlePurchase(item)}
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
            })}
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
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", maxHeight: "90vh", overflow: "auto" }}
      >
        {panel}
      </div>
    </div>
  );
}
