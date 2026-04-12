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


function formatRuntimeValue(value) {
  if (value === null || value === undefined) return "None";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length === 0 ? "none" : value.map(formatRuntimeValue).join(", ");
  
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "none";
    if (keys.every(k => typeof value[k]?.count !== 'undefined')) {
         return keys.map(k => `${k} x${value[k].count}`).join(", ");
    }
    if (keys.every(k => typeof value[k]?.rank !== 'undefined')) {
         return keys.map(k => `${k} r${value[k].rank}/${value[k].maxRank || '?'}`).join(", ");
    }
    return keys.length + " entries";
  }
  return "Complex Data";
}

function ArchetypeRuntimeHooks({ runtime, name }) {
  if (!runtime || Object.keys(runtime).length === 0) return null;

  return (
    <section className="holo-panel" style={{ padding: "1rem", display: "grid", gap: "0.75rem" }}>
      <h3 style={{ color: "var(--holo-cyan)", margin: 0 }}>{name} Console</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
        {Object.entries(runtime).map(([key, value]) => {
          if (Array.isArray(value)) return null;
          if (typeof value === "object" && value !== null) return null;
          if (key.toLowerCase().includes("notice")) return null;
          
          return (
            <div key={key} className="holo-panel" style={{ padding: "0.6rem" }}>
              <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                 {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div style={{ color: "var(--holo-gold)" }}>{formatRuntimeValue(value)}</div>
            </div>
          );
        })}
      </div>
      
      {Object.entries(runtime).map(([key, value]) => {
        if (typeof value !== "object" || value === null) return null;
        if (key.toLowerCase().includes("notice")) return null;
        
        return (
          <div key={key} style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
             <strong style={{ color: "var(--holo-cyan)" }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {formatRuntimeValue(value)}
          </div>
        );
      })}
      
      {runtime.lastNotice ? (
        <div style={{ color: "var(--text-main)", fontSize: "0.82rem", lineHeight: 1.4, borderTop: "1px solid var(--border-subtle)", paddingTop: "0.4rem" }}>
          {runtime.lastNotice}
        </div>
      ) : null}
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

          <ArchetypeRuntimeHooks runtime={system.runtime} name={system.name} />
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
