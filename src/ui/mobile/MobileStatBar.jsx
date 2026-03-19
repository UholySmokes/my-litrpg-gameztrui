import React from "react";
import {
  ensureAttributeShape,
  calculateMaxHp,
  calculateMaxMana,
} from "../../utils/AttributeMath.js";
import { getEffectiveAttributes } from "../../core/titleLogic.js";

/**
 * Compact persistent stat bar for mobile layout.
 * Shows: player name + level, HP bar, Mana bar, optional resource bar, XP bar.
 */
export default function MobileStatBar({ player, config }) {
  const resolvedConfig =
    config && typeof config === "object" && !Array.isArray(config) ? config : {};
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

  const hpMax = player?.hp?.max ?? calculateMaxHp(effectiveAttributes);
  const hpCurrent = player?.hp?.current ?? hpMax;
  const manaMax = player?.mana?.max ?? calculateMaxMana(effectiveAttributes);
  const manaCurrent = player?.mana?.current ?? manaMax;

  const hpPct = hpMax > 0 ? Math.min(100, (hpCurrent / hpMax) * 100) : 100;
  const manaPct = manaMax > 0 ? Math.min(100, (manaCurrent / manaMax) * 100) : 100;
  const isLowHp = hpPct < 30;
  const isLowMana = manaPct < 30;

  // XP
  const currentXp = player?.xp?.current ?? player?.xp ?? 0;
  const level = player?.level ?? 1;
  const xpMax = player?.xp?.max ?? 0;
  const xpPct =
    xpMax > 0 && Number.isFinite(currentXp)
      ? Math.min(100, (currentXp / xpMax) * 100)
      : 0;

  const playerName = player?.name || "Adventurer";
  const classResource = player?.classResource;

  return (
    <div className="mobile-stat-bar">
      {/* Header row: name + level */}
      <div className="mobile-stat-bar__header">
        <span className="mobile-stat-bar__name">{playerName}</span>
        <span className="mobile-stat-bar__level">LV.{level}</span>
      </div>

      <div className="mobile-stat-bar__bars">
        {/* HP */}
        <div className={`mobile-bar mobile-bar--hp${isLowHp ? " mobile-bar--low" : ""}`}>
          <div className="mobile-bar__fill" style={{ width: `${hpPct}%` }} />
          <span className="mobile-bar__label">
            HP {hpCurrent}/{hpMax}
          </span>
        </div>

        {/* Mana */}
        <div className={`mobile-bar mobile-bar--mana${isLowMana ? " mobile-bar--low" : ""}`}>
          <div className="mobile-bar__fill" style={{ width: `${manaPct}%` }} />
          <span className="mobile-bar__label">
            MP {manaCurrent}/{manaMax}
          </span>
        </div>

        {/* Class resource (Rage/Chi/Focus etc.) if present */}
        {classResource && classResource.max > 0 && (
          <div className="mobile-bar mobile-bar--resource">
            <div
              className="mobile-bar__fill"
              style={{
                width: `${Math.min(100, ((classResource.current ?? 0) / classResource.max) * 100)}%`,
              }}
            />
            <span className="mobile-bar__label">
              {classResource.name || "Resource"} {classResource.current ?? 0}/
              {classResource.max}
            </span>
          </div>
        )}

        {/* XP (thin) */}
        <div className="mobile-bar mobile-bar--xp">
          <div className="mobile-bar__fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>
    </div>
  );
}
