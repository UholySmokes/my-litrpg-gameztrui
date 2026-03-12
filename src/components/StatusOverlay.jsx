import React, { useEffect, useRef, useState } from "react";
import StatusMagicSection from "./statusOverlay/StatusMagicSection.jsx";
import StatusStatCard from "./statusOverlay/StatusStatCard.jsx";
import { buildStatusOverlayViewModel } from "./statusOverlay/statusOverlayViewModel.js";

export default function StatusOverlay({
  player,
  world,
  config,
  isOpen,
  onClose,
  onAllocateAttribute,
  onDeallocateAttribute,
  onEvolveSkill,
  onFuseSkills,
  onEvolveClass,
  onEvolveRace,
  onStudySpell,
  variant = "modal",
}) {
  const [fusionSkillA, setFusionSkillA] = useState("");
  const [fusionSkillB, setFusionSkillB] = useState("");
  const [studySkillId, setStudySkillId] = useState("");
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

  if ((isModal && !isOpen) || !player) return null;

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

  const viewModel = buildStatusOverlayViewModel({
    player,
    world,
    config,
    interactionState: {
      fusionSkillA,
      fusionSkillB,
      studySkillId,
    },
  });
  const { summary, magic, attributes, abilities, progression, collections } = viewModel;
  const {
    classLabel,
    raceLabel,
  } = summary;
  const {
    attributeEntries,
    freeAttributePoints,
    attributeInvestments,
  } = attributes;
  const { abilityList } = abilities;
  const {
    requiredClassEvolutionLevel,
    classEvolutionOptions,
    raceEvolutionOptions,
    evolvableSkills,
    fusionCandidates,
    spellCandidates,
    selectedSpell,
    canFuseSelection,
    professionEntries,
  } = progression;
  const { equipmentEntries, inventoryList } = collections;
  const equipment = player?.equipment || {};

  const panel = (
    <div
      className="holo-panel"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "rgba(0, 0, 0, 0.92)",
        border: "1px solid rgba(0, 243, 255, 0.4)",
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
              <h2 id="status-dialog-title" style={{ color: "var(--holo-cyan)", margin: 0 }}>
                Character Status
              </h2>
              <div style={{ color: "var(--text-main)" }}>
                {player.name} · Level {player.level || 1} {classLabel}
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
              <StatusStatCard
                label="Health"
                value={`${summary.hpCurrent} / ${summary.hpMax}`}
                tooltip={`Derived cap: ${summary.hpMaxCanonical}`}
              />
              <StatusStatCard
                label="Mana"
                value={`${summary.manaCurrent} / ${summary.manaMax}`}
                tooltip={`Derived cap: ${summary.manaMaxCanonical}`}
              />
              <StatusStatCard
                label="Experience"
                value={`${summary.xpCurrent} / ${summary.xpMax}`}
              />
              <StatusStatCard label="Title" value={summary.titleLabel} />
              <StatusStatCard label="System" value={summary.archetypeSystemLabel} />
              <StatusStatCard label="Race" value={summary.raceLabel} />
              <StatusStatCard label="Talents" value={summary.talentLabel} />
              <StatusStatCard label="Secondary Class" value={summary.secondaryClassLabel} />
              <StatusStatCard label="Alignment" value={summary.alignmentLabel} />
              <StatusStatCard label="Starter Trees" value={summary.starterTreeLabel} />
              <StatusStatCard label="Creation Perks" value={String(summary.creationPerkCount)} />
              <StatusStatCard label="Skill Loadout" value={summary.skillLoadoutLabel} />
            </div>
          </section>

          <StatusMagicSection magic={magic} />

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
              {summary.derivedCombatStats.map((stat) => (
                <StatusStatCard
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
                  title={
                    entry.value !== entry.baseValue
                      ? `${entry.description} (Titles: ${
                          entry.value - entry.baseValue > 0 ? "+" : ""
                        }${entry.value - entry.baseValue})`
                      : entry.description
                  }
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
                    {entry.value !== entry.baseValue && (
                      <span>
                        {" "}
                        (Titles: {entry.value - entry.baseValue > 0 ? "+" : ""}
                        {entry.value - entry.baseValue})
                      </span>
                    )}
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
                    title={ability.description || "No details available."}
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
              Class Evolution
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ marginBottom: "0.4rem" }}>
                Current Class: {classLabel || "Unknown"}
              </div>
              <div style={{ color: "var(--text-dim)", marginBottom: "0.5rem" }}>
                Baseline requirement this stage: Level {requiredClassEvolutionLevel}
              </div>
              {classEvolutionOptions.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No further class evolutions are available.
                </div>
              ) : (
                classEvolutionOptions.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      borderTop: "1px solid rgba(0, 243, 255, 0.1)",
                      paddingTop: "0.55rem",
                      marginTop: "0.55rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                        {option.targetClass?.name || option.name}
                      </span>
                      <button
                        className="holo-button"
                        style={{ fontSize: "0.72rem", minWidth: "108px" }}
                        disabled={!option.unlocked || typeof onEvolveClass !== "function"}
                        onClick={() => onEvolveClass?.(option.id)}
                      >
                        Evolve
                      </button>
                    </div>
                    <div style={{ color: "var(--text-main)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                      {option.description}
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                      Requirements: {option.requirementText}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Race Evolution
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ marginBottom: "0.4rem" }}>
                Current Race Form: {raceLabel}
              </div>
              {raceEvolutionOptions.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  Race evolution limit reached for this lineage.
                </div>
              ) : (
                raceEvolutionOptions.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      borderTop: "1px solid rgba(0, 243, 255, 0.1)",
                      paddingTop: "0.55rem",
                      marginTop: "0.55rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                        {option.name}
                      </span>
                      <button
                        className="holo-button"
                        style={{ fontSize: "0.72rem", minWidth: "108px" }}
                        disabled={!option.unlocked || typeof onEvolveRace !== "function"}
                        onClick={() => onEvolveRace?.(option.id)}
                      >
                        Evolve
                      </button>
                    </div>
                    <div style={{ color: "var(--text-main)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                      {option.description}
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                      Requirements: {option.requirementText}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Skill Evolution
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {evolvableSkills.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No skills eligible. Skills must be level 10 or higher to evolve.
                </div>
              ) : (
                evolvableSkills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.35rem 0",
                      borderBottom: "1px solid rgba(0, 243, 255, 0.1)",
                    }}
                  >
                    <span>
                      {skill.name} (Lvl {skill.level || 1})
                    </span>
                    <button
                      className="holo-button"
                      style={{ fontSize: "0.75rem" }}
                      disabled={typeof onEvolveSkill !== "function"}
                      onClick={() => onEvolveSkill?.(skill.id)}
                    >
                      Evolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Skill Fusion
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={fusionSkillA}
                  onChange={(event) => setFusionSkillA(event.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Skill A</option>
                  {fusionCandidates.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.type})
                    </option>
                  ))}
                </select>
                <select
                  value={fusionSkillB}
                  onChange={(event) => setFusionSkillB(event.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Skill B</option>
                  {fusionCandidates.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.type})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="holo-button"
                style={{ marginTop: "0.5rem" }}
                disabled={!canFuseSelection || typeof onFuseSkills !== "function"}
                onClick={() => onFuseSkills?.(fusionSkillA, fusionSkillB)}
              >
                Fuse Skills
              </button>
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Spell Study
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  className="holo-button"
                  disabled={typeof onStudySpell !== "function"}
                  onClick={() => onStudySpell?.({ mode: "create" })}
                >
                  Study New Spell
                </button>
                <select
                  value={studySkillId}
                  onChange={(event) => setStudySkillId(event.target.value)}
                  style={{ flex: 1, minWidth: "200px" }}
                >
                  <option value="">Select spell to improve</option>
                  {spellCandidates.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} (Lvl {skill.level || 1})
                    </option>
                  ))}
                </select>
                <button
                  className="holo-button"
                  disabled={
                    !selectedSpell || typeof onStudySpell !== "function"
                  }
                  onClick={() =>
                    onStudySpell?.({
                      mode: "improve",
                      skillId: selectedSpell?.id,
                    })
                  }
                >
                  Improve Spell
                </button>
              </div>
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Professions
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              {professionEntries.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No professions learned.
                </div>
              ) : (
                professionEntries.map(([id, data]) => (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.25rem 0",
                    }}
                  >
                    <span>{id}</span>
                    <span>XP {data?.xp ?? 0}</span>
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
                const item = slot.item ?? equipment[slot.key];
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
                        No item equipped
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
                    title={item.description || "No details available."}
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
  );

  if (!isModal) {
    return <div style={{ maxHeight: "100%", overflow: "auto" }}>{panel}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        tabIndex={-1}
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
        {panel}
      </div>
    </div>
  );
}
