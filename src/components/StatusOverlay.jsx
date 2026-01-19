import React from "react";
import { ATTRIBUTE_METADATA } from "../constants/attributes.js";
import {
  ensureAttributeShape,
  getAttributeValue,
  calculateMaxHp,
  calculateMaxMana,
} from "../utils/AttributeMath.js";

export default function StatusOverlay({
  player,
  isOpen,
  onClose,
  onAllocateAttribute,
  onDeallocateAttribute,
}) {
  if (!isOpen || !player) return null;

  const handleAllocateAttribute = (attributeKey) => {
    if (typeof onAllocateAttribute === "function") {
      onAllocateAttribute(attributeKey);
    }
  };

  const handleDeallocateAttribute = (attributeKey) => {
    if (typeof onDeallocateAttribute === "function") {
      onDeallocateAttribute(attributeKey);
    }
  };

  const normalizedAttributes = ensureAttributeShape(player.attributes, 5);
  const attributeEntries = ATTRIBUTE_METADATA.map((attribute) => ({
    ...attribute,
    value: getAttributeValue(normalizedAttributes, attribute.key) || 0,
  }));

  const abilityList = player.abilities || [];
  const inventoryList = player.inventory || [];
  const equipment = player.equipment || {};
  const freeAttributePoints = player.attributes?.freePoints ?? 0;
  const attributeInvestments = player.attributeInvestments || {};

  const hpMaxCanonical = calculateMaxHp(normalizedAttributes);
  const manaMaxCanonical = calculateMaxMana(normalizedAttributes);
  const hpMax = player.hp?.max ?? hpMaxCanonical;
  const hpCurrent = player.hp?.current ?? hpMaxCanonical;
  const manaMax = player.mana?.max ?? manaMaxCanonical;
  const manaCurrent = player.mana?.current ?? manaMaxCanonical;

  const strength = getAttributeValue(normalizedAttributes, "strength");
  const dexterity = getAttributeValue(normalizedAttributes, "dexterity");
  const agility = getAttributeValue(normalizedAttributes, "agility");
  const vitality = getAttributeValue(normalizedAttributes, "vitality");
  const intelligence = getAttributeValue(normalizedAttributes, "intelligence");
  const wisdom = getAttributeValue(normalizedAttributes, "wisdom");
  const willpower = getAttributeValue(normalizedAttributes, "willpower");
  const luck = getAttributeValue(normalizedAttributes, "luck");

  const derivedCombatStats = [
    {
      label: "Attack Power",
      value: Math.round(strength * 2 + dexterity * 0.5),
      hint: "Physical scaling from Strength & Dexterity",
    },
    {
      label: "Spell Power",
      value: Math.round(intelligence * 2 + wisdom * 0.5),
      hint: "Magical scaling from Intelligence & Wisdom",
    },
    {
      label: "Defense",
      value: Math.round(vitality * 1.5 + strength * 0.25),
      hint: "Damage reduction from Vitality & Strength",
    },
    {
      label: "Crit Chance",
      value: `${Math.min(60, (luck + dexterity) * 0.5).toFixed(1)}%`,
      hint: "Chance to crit from Luck & Dexterity",
    },
    {
      label: "Evasion",
      value: `${Math.min(50, agility * 0.8 + dexterity * 0.2).toFixed(1)}%`,
      hint: "Avoidance from Agility & Dexterity",
    },
    {
      label: "Focus",
      value: Math.round(wisdom + willpower * 0.5),
      hint: "Resistance to debuffs from Wisdom & Willpower",
    },
  ];

  const equipmentEntries = [
    { key: "weapon", label: "Weapon" },
    { key: "armor", label: "Armor" },
    { key: "accessory", label: "Accessory" },
    { key: "title", label: "Title", item: player.title },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          background: "rgba(0, 0, 0, 0.92)",
          border: "1px solid rgba(0, 243, 255, 0.4)",
        }}
      >
        <div
          className="holo-panel"
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ color: "var(--holo-cyan)", margin: 0 }}>
                [STATUS OVERLAY]
              </h2>
              <div style={{ color: "var(--text-main)" }}>
                {player.name} · Level {player.level || 1} {player.class || ""}
              </div>
            </div>
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

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Vital Statistics
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <StatCard
                label="Health"
                value={`${hpCurrent} / ${hpMax}`}
                tooltip={`Derived cap: ${hpMaxCanonical}`}
              />
              <StatCard
                label="Mana"
                value={`${manaCurrent} / ${manaMax}`}
                tooltip={`Derived cap: ${manaMaxCanonical}`}
              />
              <StatCard
                label="Experience"
                value={`${player.xp?.current || 0} / ${player.xp?.max || 100}`}
              />
              <StatCard label="Title" value={player.title || "None"} />
              <StatCard label="Race" value={player.race || "Unknown"} />
              <StatCard label="Talent" value={player.talent || "None"} />
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Derived Combat Stats
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {derivedCombatStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  tooltip={stat.hint}
                />
              ))}
            </div>
          </section>

          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "0.5rem",
              }}
            >
              <h3 style={{ color: "var(--holo-cyan)", margin: 0 }}>
                Attributes
              </h3>
              <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
                Free Points: {freeAttributePoints}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {attributeEntries.map((entry) => (
                <div
                  key={entry.key}
                  className="holo-panel"
                  style={{
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                  title={entry.description}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}
                    >
                      {entry.label}
                    </span>
                    <span style={{ fontSize: "1.1rem" }}>{entry.value}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {entry.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <button
                      className="holo-button"
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        fontSize: "1rem",
                        lineHeight: 1,
                      }}
                      aria-label={`Remove point from ${entry.label}`}
                      disabled={
                        (attributeInvestments[entry.key] || 0) <= 0 ||
                        typeof onDeallocateAttribute !== "function"
                      }
                      onClick={() => handleDeallocateAttribute(entry.key)}
                    >
                      -
                    </button>
                    <div
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "var(--text-dim)",
                      }}
                    >
                      Invested: {attributeInvestments[entry.key] || 0}
                    </div>
                    <button
                      className="holo-button"
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        fontSize: "1rem",
                        lineHeight: 1,
                      }}
                      aria-label={`Add point to ${entry.label}`}
                      disabled={
                        freeAttributePoints <= 0 ||
                        typeof onAllocateAttribute !== "function"
                      }
                      onClick={() => handleAllocateAttribute(entry.key)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Abilities
            </h3>
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              {abilityList.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No abilities known.
                </div>
              ) : (
                abilityList.map((ability, idx) => (
                  <div
                    key={`${ability.name}-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      borderBottom: "1px solid rgba(0, 243, 255, 0.1)",
                      padding: "0.35rem 0",
                      fontSize: "0.9rem",
                    }}
                    title={ability.description || "No description provided."}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{ability.name}</span>
                      <span>Lvl {ability.level || 1}</span>
                    </div>
                    {ability.description && (
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}
                      >
                        {ability.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Equipped Gear
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {equipmentEntries.map((slot) => {
                const item =
                  slot.key === "title" ? player.title : equipment[slot.key];
                if (!item) {
                  return (
                    <div
                      key={slot.key}
                      className="holo-panel"
                      style={{ padding: "0.75rem" }}
                    >
                      <div style={{ color: "var(--text-dim)" }}>
                        {slot.label}
                      </div>
                      <div
                        style={{
                          color: "var(--text-main)",
                          fontSize: "0.85rem",
                        }}
                      >
                        [EMPTY]
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={slot.key}
                    className="holo-panel"
                    style={{ padding: "0.75rem" }}
                    title={item.description || "Equipped item"}
                  >
                    <div
                      style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}
                    >
                      {slot.label}
                    </div>
                    <div
                      style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}
                    >
                      {item.name || item.id || item}
                    </div>
                    {item.stats && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-main)",
                          marginTop: "0.25rem",
                        }}
                      >
                        {Object.entries(item.stats)
                          .map(([stat, value]) => `${stat}+${value}`)
                          .join(" · ")}
                      </div>
                    )}
                    {!item.stats && item.description && (
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Inventory Snapshot
            </h3>
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.5rem",
              }}
            >
              {inventoryList.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>Inventory empty.</div>
              ) : (
                inventoryList.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="holo-panel"
                    style={{ padding: "0.5rem" }}
                    title={item.description || "No description provided."}
                  >
                    <div
                      style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}
                    >
                      {item.name || item.id}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--text-main)" }}
                    >
                      Qty: {item.quantity ?? 1}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-dim)",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tooltip }) {
  return (
    <div className="holo-panel" style={{ padding: "0.75rem" }} title={tooltip}>
      <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
        {label}
      </div>
      <div style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
        {value}
      </div>
    </div>
  );
}
