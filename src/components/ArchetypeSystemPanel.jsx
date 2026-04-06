import React, { useMemo } from "react";
import { buildArchetypeSystemViewModel } from "./archetypeSystem/archetypeSystemViewModel.js";

function DetailList({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section>
      <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>{title}</h3>
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
        }}
      >
        {items.map((item) => (
          <div
            key={`${title}-${item.slice(0, 24)}`}
            className="holo-panel"
            style={{
              padding: "0.75rem",
              color: "var(--text-main)",
              lineHeight: 1.5,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}


function DevourerConsole({ consoleData }) {
  if (!consoleData) return null;

  return (
    <section className="holo-panel" style={{ padding: "1rem", display: "grid", gap: "0.75rem" }}>
      <h3 style={{ color: "var(--holo-cyan)", margin: 0 }}>Devourer Console</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
        <div className="holo-panel" style={{ padding: "0.6rem" }}>
          <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Taint</div>
          <div style={{ color: "var(--holo-gold)" }}>{consoleData.taint}</div>
        </div>
        <div className="holo-panel" style={{ padding: "0.6rem" }}>
          <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Known Prey</div>
          <div style={{ color: "var(--text-main)" }}>{consoleData.knownPreyCount}</div>
        </div>
        <div className="holo-panel" style={{ padding: "0.6rem" }}>
          <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Sentient Devours</div>
          <div style={{ color: "var(--holo-gold)" }}>{consoleData.sentientDevours}</div>
        </div>
      </div>

      <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
        Stored Samples: {consoleData.storedSamples.length
          ? consoleData.storedSamples.map((entry) => `${entry.family} x${entry.count}`).join(", ")
          : "none"}
      </div>
      <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
        Adaptations: {consoleData.adaptations.length
          ? consoleData.adaptations.map((entry) => `${entry.family} r${entry.rank}/${entry.maxRank}`).join(", ")
          : "none"}
      </div>
      {consoleData.recentPrey.length ? (
        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
          Recent Prey: {consoleData.recentPrey.join(" | ")}
        </div>
      ) : null}
      {consoleData.lastNotice ? (
        <div style={{ color: "var(--text-main)", fontSize: "0.82rem", lineHeight: 1.4 }}>
          {consoleData.lastNotice}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {consoleData.commands.map((command) => (
          <button key={command} type="button" className="holo-button" title="Issue this command in terminal">
            {command}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function ArchetypeSystemPanel({ player }) {
  const system = useMemo(() => buildArchetypeSystemViewModel(player), [player]);

  return (
    <div
      className="holo-panel"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "rgba(0, 0, 0, 0.92)",
        border: "1px solid rgba(0, 243, 255, 0.4)",
        minHeight: "100%",
      }}
    >
      <div>
        <h2 style={{ color: "var(--holo-cyan)", margin: 0 }}>System Profile</h2>
        <div style={{ color: "var(--text-main)", marginTop: "0.35rem" }}>
          Review the active canon system bound to this character.
        </div>
      </div>

      {!system ? (
        <div style={{ color: "var(--text-dim)" }}>
          No canonical system is currently bound to this character.
        </div>
      ) : (
        <>
          <section
            className="holo-panel"
            style={{
              padding: "1rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <div>
              <div style={{ color: "var(--holo-cyan)", fontSize: "1.15rem", fontWeight: "bold" }}>
                {system.name}
              </div>
              <div style={{ color: "var(--text-main)" }}>{system.category}</div>
            </div>
            <div style={{ color: "var(--text-main)", lineHeight: 1.5 }}>{system.summary}</div>
            <div style={{ color: "var(--text-dim)", lineHeight: 1.5 }}>
              {system.descriptionPreview}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div className="holo-panel" style={{ padding: "0.75rem" }}>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                  Rarity
                </div>
                <div style={{ color: "var(--text-main)" }}>{system.rarity || "Unknown"}</div>
              </div>
              <div className="holo-panel" style={{ padding: "0.75rem" }}>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                  Stability
                </div>
                <div style={{ color: "var(--text-main)" }}>{system.stability || "Unknown"}</div>
              </div>
              {system.resource ? (
                <div
                  className="holo-panel"
                  style={{
                    padding: "0.75rem",
                    borderColor: `${system.resource.color}66`,
                  }}
                >
                  <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    Resource
                  </div>
                  <div style={{ color: system.resource.color, fontWeight: "bold" }}>
                    {system.resource.name}
                  </div>
                  <div style={{ color: "var(--text-main)" }}>
                    {Math.floor(system.resource.current)} / {system.resource.max}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <DevourerConsole consoleData={system.devourerConsole} />
          <DetailList title="Core Loop" items={system.coreLoop} />
          <DetailList title="Possible Uses" items={system.possibleUses} />
          <DetailList title="Limits" items={system.limits} />
          <DetailList title="Costs" items={system.costs} />
          <DetailList title="Narrative Hooks" items={system.narrativeHooks} />
          <DetailList title="Quest Hooks" items={system.questHooks} />
          <DetailList title="World Compatibility" items={system.worldCompatibility} />
        </>
      )}
    </div>
  );
}
