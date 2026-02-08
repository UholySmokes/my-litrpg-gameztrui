import { useState, useMemo } from "react";
import { CATEGORY_CONFIG, getCategoryConfig } from "../../../systems/archetype/ArchetypeSystemRegistry.js";

const CATEGORY_ORDER = ["System", "Authority", "Path", "Framework", "Privilege", "Overlay"];

function CategoryBadge({ category }) {
  const config = getCategoryConfig(category);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.15rem 0.45rem",
        borderRadius: "3px",
        fontSize: "0.6rem",
        fontWeight: "bold",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: config.color,
        background: `${config.color}18`,
        border: `1px solid ${config.color}44`,
      }}
    >
      <span style={{ fontSize: "0.7rem" }}>{config.icon}</span>
      {config.label}
    </span>
  );
}

function TagPill({ tag }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.1rem 0.35rem",
        borderRadius: "8px",
        fontSize: "0.55rem",
        color: "var(--text-dim)",
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {tag}
    </span>
  );
}

function SystemCard({ system, isSelected, isExpanded, onSelect, onToggleExpand }) {
  const config = getCategoryConfig(system.category);
  return (
    <div
      style={{
        borderRadius: "6px",
        overflow: "hidden",
        border: isSelected
          ? `2px solid ${config.color}`
          : "1px solid rgba(255, 255, 255, 0.12)",
        background: isSelected
          ? `linear-gradient(135deg, ${config.color}15, rgba(0,0,0,0.7))`
          : "rgba(0, 0, 0, 0.55)",
        transition: "all 0.2s ease",
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: "100%",
          padding: "0.6rem 0.65rem",
          background: "none",
          border: "none",
          color: isSelected ? config.color : "#00F3FF",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{system.name}</span>
          <CategoryBadge category={system.category} />
        </div>
        <div style={{ fontSize: "0.65rem", opacity: 0.8, lineHeight: "1.35" }}>
          {system.summary || system.description}
        </div>
        {Array.isArray(system.tags) && system.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginTop: "0.15rem" }}>
            {system.tags.slice(0, 4).map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}
      </button>

      {(isSelected || isExpanded) && (
        <div
          style={{
            padding: "0 0.65rem 0.6rem",
            borderTop: `1px solid ${config.color}33`,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          {Array.isArray(system.coreLoop) && system.coreLoop.length > 0 && (
            <div style={{ marginTop: "0.4rem" }}>
              <div style={{ color: config.color, fontSize: "0.65rem", fontWeight: "bold", marginBottom: "0.2rem" }}>
                CORE LOOP
              </div>
              <ol style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.6rem", color: "var(--text-main)", lineHeight: "1.4" }}>
                {system.coreLoop.map((step, i) => (
                  <li key={i} style={{ marginBottom: "0.15rem" }}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {Array.isArray(system.progression) && system.progression.length > 0 && (
            <div>
              <div style={{ color: "var(--holo-gold)", fontSize: "0.65rem", fontWeight: "bold", marginBottom: "0.2rem" }}>
                PROGRESSION
              </div>
              <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.6rem", color: "var(--text-main)", lineHeight: "1.4", listStyle: "disc" }}>
                {system.progression.slice(0, 3).map((step, i) => (
                  <li key={i} style={{ marginBottom: "0.15rem" }}>{step}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(system.narrativeHooks) && system.narrativeHooks.length > 0 && (
            <div>
              <div style={{ color: "#E599F7", fontSize: "0.65rem", fontWeight: "bold", marginBottom: "0.2rem" }}>
                NARRATIVE HOOKS
              </div>
              <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.6rem", color: "var(--text-dim)", lineHeight: "1.4", listStyle: "none" }}>
                {system.narrativeHooks.slice(0, 2).map((hook, i) => (
                  <li key={i} style={{ marginBottom: "0.15rem" }}>&bull; {hook}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              fontSize: "0.55rem",
              cursor: "pointer",
              padding: "0.2rem 0",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {isExpanded ? "\u25B2 collapse" : "\u25BC expand details"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CreationArchetypeSystemPanel({
  systems,
  selectedSystem,
  onSystemSelect,
  onAction,
}) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const selectedId = selectedSystem?.id || selectedSystem;

  // Group systems by category
  const grouped = useMemo(() => {
    const groups = {};
    for (const system of (systems || [])) {
      const cat = system.category || "Unknown";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(system);
    }
    return groups;
  }, [systems]);

  const categories = useMemo(() => {
    const present = Object.keys(grouped);
    return CATEGORY_ORDER.filter((c) => present.includes(c)).concat(
      present.filter((c) => !CATEGORY_ORDER.includes(c))
    );
  }, [grouped]);

  // Filter to active category or show all
  const visibleSystems = useMemo(() => {
    if (activeCategory && grouped[activeCategory]) {
      return grouped[activeCategory];
    }
    return systems || [];
  }, [activeCategory, grouped, systems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <div
        style={{
          color: "var(--holo-cyan)",
          fontFamily: "monospace",
          fontSize: "1.1rem",
          textTransform: "uppercase",
          letterSpacing: "3px",
        }}
      >
        Archetype System
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", lineHeight: "1.4" }}>
        Choose a system, authority, path, or framework to shape how you grow and interact with the world.
      </div>

      {/* Category filter tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            fontSize: "0.6rem",
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: "pointer",
            background: !activeCategory ? "rgba(0, 243, 255, 0.2)" : "rgba(0, 0, 0, 0.4)",
            border: !activeCategory ? "1px solid var(--holo-cyan)" : "1px solid rgba(255,255,255,0.15)",
            color: !activeCategory ? "var(--holo-cyan)" : "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          ALL ({(systems || []).length})
        </button>
        {categories.map((cat) => {
          const config = getCategoryConfig(cat);
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(isActive ? null : cat)}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.6rem",
                fontFamily: "monospace",
                fontWeight: "bold",
                cursor: "pointer",
                background: isActive ? `${config.color}25` : "rgba(0, 0, 0, 0.4)",
                border: isActive ? `1px solid ${config.color}` : "1px solid rgba(255,255,255,0.15)",
                color: isActive ? config.color : "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span>{config.icon}</span>
              {cat} ({(grouped[cat] || []).length})
            </button>
          );
        })}
      </div>

      {/* Category description */}
      {activeCategory && (
        <div style={{
          fontSize: "0.65rem",
          color: getCategoryConfig(activeCategory).color,
          padding: "0.3rem 0.5rem",
          background: `${getCategoryConfig(activeCategory).color}0A`,
          borderRadius: "4px",
          borderLeft: `3px solid ${getCategoryConfig(activeCategory).color}`,
        }}>
          {getCategoryConfig(activeCategory).description}
        </div>
      )}

      {/* System list */}
      <div
        style={{
          display: "grid",
          gap: "0.4rem",
          maxHeight: "340px",
          overflowY: "auto",
          paddingRight: "0.2rem",
        }}
      >
        {visibleSystems.map((system) => (
          <SystemCard
            key={system.id}
            system={system}
            isSelected={system.id === selectedId}
            isExpanded={system.id === expandedId}
            onSelect={() => onAction?.(() => onSystemSelect(system.id))}
            onToggleExpand={() => setExpandedId(expandedId === system.id ? null : system.id)}
          />
        ))}
        {visibleSystems.length === 0 && (
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", padding: "1rem 0", textAlign: "center" }}>
            No systems available in this category.
          </div>
        )}
      </div>
    </div>
  );
}
