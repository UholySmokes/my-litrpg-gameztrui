import React from "react";
import {
  ensureAttributeShape,
  calculateMaxHp,
  calculateMaxMana,
} from "../utils/AttributeMath.js";
import { getEffectiveAttributes } from "../core/titleLogic.js";

export default function HudVitals({ player, config }) {
  const resolvedConfig =
    config && typeof config === "object" && !Array.isArray(config)
      ? config
      : {};
  const baseAttributeValue = Number.isFinite(resolvedConfig.baseAttributeValue)
    ? resolvedConfig.baseAttributeValue
    : 5;

  const normalizedAttributes = ensureAttributeShape(
    player?.attributes,
    baseAttributeValue,
  );
  const effectiveAttributes = getEffectiveAttributes(
    { ...(player || {}), attributes: normalizedAttributes },
    { ...resolvedConfig, baseAttributeValue },
    normalizedAttributes,
  );
  const canonicalHpMax = calculateMaxHp(effectiveAttributes);
  const canonicalManaMax = calculateMaxMana(effectiveAttributes);

  const hpMax = player?.hp?.max ?? canonicalHpMax;
  const hpCurrent = player?.hp?.current ?? hpMax;
  const manaMax = player?.mana?.max ?? canonicalManaMax;
  const manaCurrent = player?.mana?.current ?? manaMax;

  const healthPercentage = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 100;
  const manaPercentage = manaMax > 0 ? (manaCurrent / manaMax) * 100 : 100;
  const isLowHealth = healthPercentage < 30;
  const isLowMana = manaPercentage < 30;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.35rem",
          color: "var(--text-main)",
          fontSize: "0.9rem",
        }}
      >
        <span>
          Health: {hpCurrent}/{hpMax}
        </span>
        <span>
          Mana: {manaCurrent}/{manaMax}
        </span>
      </div>

      <div className="health-bar-container" style={{ marginBottom: "0.4rem" }}>
        <div className="health-bar">
          <div
            className="health-bar-fill"
            style={{
              width: `${Math.max(0, Math.min(healthPercentage, 100))}%`,
              background: isLowHealth
                ? "linear-gradient(90deg, var(--holo-alert), #ff6b9d)"
                : "linear-gradient(90deg, var(--holo-alert), var(--holo-cyan))",
            }}
          ></div>
        </div>
      </div>

      <div className="mana-bar-container">
        <div className="mana-bar">
          <div
            className="mana-bar-fill"
            style={{
              width: `${Math.max(0, Math.min(manaPercentage, 100))}%`,
              background: isLowMana
                ? "linear-gradient(90deg, var(--holo-magenta), var(--holo-alert))"
                : "linear-gradient(90deg, var(--holo-blue), var(--holo-cyan))",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
