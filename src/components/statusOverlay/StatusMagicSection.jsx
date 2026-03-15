import StatusStatCard from "./StatusStatCard.jsx";

export default function StatusMagicSection({ magic }) {
  return (
    <section>
      <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
        Magic Ecology
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <StatusStatCard
          label="Resonance"
          value={`${magic.resonanceCurrent.toFixed(1)} / ${magic.resonanceMax.toFixed(1)}`}
          tooltip="Rising resonance increases instability and overload risk"
        />
        <StatusStatCard
          label="Resonance State"
          value={magic.resonanceState}
        />
        <StatusStatCard
          label="Reserve Total"
          value={magic.reserveTotal.toFixed(1)}
        />
        <StatusStatCard
          label="Stored Charges"
          value={String(magic.chargeCount)}
        />
        <StatusStatCard label="Prepared" value={magic.preparedLabel} />
        <StatusStatCard
          label="Unlocked Patterns"
          value={String(magic.unlockedPatternCount)}
        />
        <StatusStatCard
          label="Magic Perks"
          value={String(magic.perkCount)}
        />
        <StatusStatCard
          label="Ambient Weather"
          value={magic.ambientWeatherLabel}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <div className="holo-panel" style={{ padding: "0.75rem" }}>
          <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
            Ambient Drivers
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Time: {magic.ambientProvenance.timeOfDay || "unknown"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Weather: {magic.ambientProvenance.weatherType || "unknown"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Anomalies: {magic.anomalyNames.length ? magic.anomalyNames.join(", ") : "none"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Sources: {magic.sourceNames.length ? magic.sourceNames.join(", ") : "none"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
            Draw notables:{" "}
            {magic.drawNotables.length
              ? magic.drawNotables
                  .map((entry) => `${entry.essence} x${entry.mult.toFixed(2)}`)
                  .join(" | ")
              : "none"}
          </div>
        </div>

        <div className="holo-panel" style={{ padding: "0.75rem" }}>
          <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
            Reserve Composition
          </div>
          {magic.reserveRows.length === 0 ? (
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              No stored reserves.
            </div>
          ) : (
            magic.reserveRows.slice(0, 8).map((row) => (
              <div
                key={row.essence}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  color: "var(--text-main)",
                  padding: "0.15rem 0",
                }}
              >
                <span>{row.essence}</span>
                <span>
                  {row.amount.toFixed(2)} | taint {(row.taint * 100).toFixed(1)}%
                </span>
              </div>
            ))
          )}
        </div>

        <div className="holo-panel" style={{ padding: "0.75rem" }}>
          <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
            Pattern & Anchor State
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Anchored Self: {magic.anchors.self ? "yes" : "no"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Anchored Area: {magic.anchors.area ? "yes" : "no"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
            Anchored Item: {magic.anchors.itemId || "none"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
            {magic.unlockedPatternRows.length === 0
              ? "No unlocked patterns yet."
              : magic.unlockedPatternRows
                  .map((row) => `${row.kind}: ${row.patterns.join(", ")}`)
                  .join(" | ")}
          </div>
        </div>

        <div className="holo-panel" style={{ padding: "0.75rem" }}>
          <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
            Perk Progress
          </div>
          {magic.ownedPerkIds.length === 0 ? (
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              No perks owned.
            </div>
          ) : (
            <div style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
              Owned: {magic.ownedPerkIds.join(", ")}
            </div>
          )}
          {magic.perkProgressRows.length > 0 && (
            <div style={{ marginTop: "0.35rem" }}>
              {magic.perkProgressRows.slice(0, 6).map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    color: "var(--text-main)",
                  }}
                >
                  <span>{row.id}</span>
                  <span>
                    rank {row.rank} | xp {row.totalXp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
