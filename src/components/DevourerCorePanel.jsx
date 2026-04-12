import React, { useMemo } from "react";
import { buildDevourerCorePanelViewModel } from "./devourerCore/devourerCorePanelViewModel.js";

function MetricCard({ label, value, accent = "var(--holo-cyan)" }) {
  return (
    <div
      className="holo-panel"
      style={{
        padding: "0.85rem",
        display: "grid",
        gap: "0.35rem",
      }}
    >
      <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: accent, fontSize: "1.1rem", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <h3 style={{ color: "var(--holo-cyan)", margin: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function ActionCard({ title, meta, copy, command, onSubmitCommand, accent = "var(--holo-cyan)" }) {
  return (
    <div
      className="holo-panel"
      style={{
        padding: "0.9rem",
        display: "grid",
        gap: "0.45rem",
        borderColor: `${accent}55`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <strong style={{ color: accent }}>{title}</strong>
        {meta ? <span style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>{meta}</span> : null}
      </div>
      <div style={{ color: "var(--text-main)", lineHeight: 1.45 }}>{copy}</div>
      {command ? (
        <button
          type="button"
          className="holo-button"
          style={{ justifySelf: "start" }}
          onClick={() => onSubmitCommand?.(command)}
        >
          {command}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="holo-panel" style={{ padding: "0.9rem", color: "var(--text-dim)" }}>
      {text}
    </div>
  );
}

export default function DevourerCorePanel({ player, onSubmitCommand }) {
  const viewModel = useMemo(() => buildDevourerCorePanelViewModel(player), [player]);

  if (!viewModel) {
    return (
      <div className="holo-panel" style={{ padding: "1.5rem", color: "var(--text-dim)" }}>
        No Devourer Core is bound to this character.
      </div>
    );
  }

  return (
    <div
      className="holo-panel"
      style={{
        padding: "1.5rem",
        display: "grid",
        gap: "1rem",
        background: "rgba(0, 0, 0, 0.92)",
        border: "1px solid rgba(125, 255, 179, 0.4)",
        minHeight: "100%",
      }}
    >
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <h2 style={{ color: "var(--holo-cyan)", margin: 0 }}>Devourer Core</h2>
        <div style={{ color: "var(--text-main)" }}>
          Safe prey is absorbed automatically. Risky prey stays queued until you decide how to handle it.
        </div>
        {viewModel.lastNotice ? (
          <div
            className="holo-panel"
            style={{
              padding: "0.85rem",
              color: "var(--text-main)",
              lineHeight: 1.45,
              borderColor: "rgba(125, 255, 179, 0.35)",
            }}
          >
            {viewModel.lastNotice}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <MetricCard
          label={viewModel.resource.name}
          value={`${Math.floor(viewModel.resource.current)} / ${viewModel.resource.max}`}
          accent={viewModel.resource.color}
        />
        <MetricCard label="Taint" value={viewModel.taint} accent="var(--holo-alert)" />
        <MetricCard label="Known Prey" value={viewModel.knownPreyCount} accent="var(--holo-gold)" />
        <MetricCard label="Sentient Devours" value={viewModel.sentientDevours} accent="var(--holo-alert)" />
      </div>

      <Section title="Recent Prey">
        {viewModel.recentPrey.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {viewModel.recentPrey.map((entry) => (
              <span
                key={entry}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(125, 255, 179, 0.35)",
                  background: "rgba(125, 255, 179, 0.08)",
                  color: "var(--text-main)",
                  fontSize: "0.82rem",
                }}
              >
                {entry}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState text="No prey signatures have been logged yet." />
        )}
      </Section>

      <Section title="Safe Digest Opportunities">
        {viewModel.digestReady.length > 0 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {viewModel.digestReady.map((entry) => (
              <ActionCard
                key={`digest-${entry.family}`}
                title={entry.label}
                meta={`x${entry.count} stored`}
                copy={`Safe to absorb now. Each digest yields ${entry.biomassPerSample} Biomass and ${entry.taintPerSample} taint.`}
                command={entry.command}
                onSubmitCommand={onSubmitCommand}
                accent="var(--holo-cyan)"
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No stored prey currently qualifies for safe automatic intake." />
        )}
      </Section>

      <Section title="Queued Risk Samples">
        {viewModel.digestBlocked.length > 0 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {viewModel.digestBlocked.map((entry) => (
              <ActionCard
                key={`blocked-${entry.family}`}
                title={entry.label}
                meta={`x${entry.count} stored`}
                copy={`${entry.blockReasonText} Per digest: ${entry.biomassPerSample} Biomass, ${entry.taintPerSample} taint.`}
                accent="var(--holo-alert)"
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No risky prey is currently waiting in storage." />
        )}
      </Section>

      <Section title="Refinement Ready">
        {viewModel.refinementReady.length > 0 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {viewModel.refinementReady.map((entry) => (
              <ActionCard
                key={`refine-${entry.family}`}
                title={entry.label}
                meta={`Rank ${entry.currentRank}/${entry.maxRank}`}
                copy={`Knowledge ${entry.digested}/${entry.requiredKnowledge} and Biomass cost ${entry.biomassCost}. The line is ready for permanent integration.`}
                command={entry.command}
                onSubmitCommand={onSubmitCommand}
                accent="var(--holo-gold)"
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No prey line is currently ready for refinement." />
        )}
      </Section>

      <Section title="Core Cleanup">
        {viewModel.purgeAction ? (
          <ActionCard
            title={viewModel.purgeAction.label}
            copy={viewModel.purgeAction.reason}
            command={viewModel.purgeAction.command}
            onSubmitCommand={onSubmitCommand}
            accent="var(--holo-alert)"
          />
        ) : (
          <EmptyState text="Taint levels are stable. No purge is currently recommended." />
        )}
      </Section>

      <Section title="Adaptation Ranks">
        {viewModel.adaptationRanks.length > 0 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {viewModel.adaptationRanks.map((entry) => (
              <div
                key={`adapt-${entry.family}`}
                className="holo-panel"
                style={{ padding: "0.9rem", display: "grid", gap: "0.35rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                  <strong style={{ color: "var(--holo-cyan)" }}>{entry.label}</strong>
                  <span style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                    Rank {entry.rank}/{entry.maxRank}
                  </span>
                </div>
                <div style={{ color: "var(--text-main)" }}>
                  Refined {entry.refinedCount} time{entry.refinedCount === 1 ? "" : "s"}.
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No permanent adaptations have been stabilized yet." />
        )}
      </Section>
    </div>
  );
}
