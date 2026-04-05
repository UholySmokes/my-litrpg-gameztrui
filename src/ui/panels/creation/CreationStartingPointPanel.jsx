import { useMemo } from "react";

const TYPE_LABELS = {
  social: "Social Hub",
  exploration: "Exploration",
  combat: "Combat Zone",
};

const TYPE_COLORS = {
  social: "#845EF7",
  exploration: "#20C997",
  combat: "#FF6B6B",
};

export default function CreationStartingPointPanel({
  startingPoints = [],
  selectedStartingPoint = null,
  onStartingPointSelect,
}) {
  const grouped = useMemo(() => {
    const groups = { social: [], exploration: [], combat: [] };
    for (const point of startingPoints) {
      const bucket = groups[point.type] || groups.exploration;
      bucket.push(point);
    }
    return groups;
  }, [startingPoints]);

  return (
    <div className="creation-starting-point-panel">
      <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "1rem" }}>
        Choose the zone where your chronicle begins. Each zone shapes early encounters and opportunities.
      </p>
      {Object.entries(grouped).map(([type, points]) =>
        points.length > 0 ? (
          <div key={type} style={{ marginBottom: "1.2rem" }}>
            <div
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: TYPE_COLORS[type] || "#aaa",
                marginBottom: "0.4rem",
                fontWeight: "bold",
              }}
            >
              {TYPE_LABELS[type] || type}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
              {points.map((point) => {
                const isSelected = selectedStartingPoint?.id === point.id;
                return (
                  <button
                    key={point.id}
                    type="button"
                    className={`creation-option-btn ${isSelected ? "creation-option-btn--selected" : ""}`}
                    onClick={() => onStartingPointSelect(isSelected ? null : point)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.3rem",
                      padding: "0.6rem 0.8rem",
                      textAlign: "left",
                      borderColor: isSelected ? TYPE_COLORS[type] : undefined,
                    }}
                  >
                    <strong style={{ fontSize: "0.85rem" }}>{point.name}</strong>
                    <span style={{ fontSize: "0.7rem", opacity: 0.65, lineHeight: 1.3 }}>
                      {point.summary}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
