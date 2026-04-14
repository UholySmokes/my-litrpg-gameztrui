import { useState } from "react";

function SkillList({
  title,
  tone = "gold",
  items = [],
  emptyLabel,
}) {
  return (
    <section className={`creation-summary__skill-card creation-summary__skill-card--${tone}`}>
      <div className="creation-summary__skill-title">{title}</div>
      {items.length > 0 ? (
        <ul className="creation-summary__skill-list">
          {items.map((item) => (
            <li key={item.id || item.name}>
              <strong>{item.name}</strong>
              <span>
                {item.description || "System memory fragmented."}
                {item.level || item.rank ? ` (Rank ${item.level || item.rank})` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="creation-summary__empty">{emptyLabel}</p>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  title,
  copy,
  meta = null,
  badge = null,
}) {
  return (
    <article className="creation-summary__card">
      <div className="creation-summary__card-label">{label}</div>
      <div className="creation-summary__card-title-row">
        <h4 className="creation-summary__card-title">{title}</h4>
        {badge ? <span className="creation-summary__card-badge">{badge}</span> : null}
      </div>
      <p className="creation-summary__card-copy">{copy}</p>
      {meta ? <div className="creation-summary__card-meta">{meta}</div> : null}
    </article>
  );
}

export default function CreationSummaryPanel({
  asciiArt,
  selectionSummary,
  selectedActiveSkills,
  selectedPassiveSkills,
  maxActiveSkills = 3,
  maxPassiveSkills = 6,
  typewriterText,
  syncProgress,
  canFinalize,
  onFinalize,
}) {
  const [isInitializing, setIsInitializing] = useState(false);
  const racePassiveAbility = selectionSummary.racePassiveAbility;
  const raceActiveAbility = selectionSummary.raceActiveAbility;
  const professionSkills = Array.isArray(selectionSummary.professionSkills)
    ? selectionSummary.professionSkills
    : [];
  const grantedActiveSkills = Array.isArray(selectionSummary.grantedActiveSkills)
    ? selectionSummary.grantedActiveSkills
    : [];
  const grantedPassiveSkills = Array.isArray(selectionSummary.grantedPassiveSkills)
    ? selectionSummary.grantedPassiveSkills
    : [];

  const biomeBadge =
    selectionSummary.originBiome && typeof selectionSummary.originBiome === "string"
      ? selectionSummary.originBiome
      : null;

  const automaticInscriptions = [
    ...grantedActiveSkills.map((skill) => ({
      ...skill,
      description: `${skill.description || "Automatic active inscription."} Active.`,
    })),
    ...grantedPassiveSkills.map((skill) => ({
      ...skill,
      description: `${skill.description || "Automatic passive inscription."} Passive.`,
    })),
  ];

  return (
    <section className="creation-summary">
      <div className="creation-summary__hero">
        <div className="creation-summary__sigil-shell">
          <div className="creation-summary__sigil-glow" aria-hidden="true" />
          <pre className="creation-summary__ascii" aria-hidden="true">
            {asciiArt}
          </pre>
        </div>

        <div className="creation-summary__progress-shell">
          <div className="creation-summary__eyebrow">Dossier Integrity</div>
          <div className="creation-summary__progress-row">
            <strong>Archive sync</strong>
            <span>{syncProgress}%</span>
          </div>
          <div className="creation-summary__progress-track" aria-hidden="true">
            <div
              className="creation-summary__progress-fill"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          <p className="creation-summary__hero-copy">
            {canFinalize
              ? "The first page is stable. The archive recognizes the build as coherent."
              : "The dossier is still unstable. Resolve the remaining rite fragments before descent."}
          </p>
        </div>
      </div>

      <div className="creation-summary__grid">
        <SummaryCard
          label="First Invocation"
          title="Opening line"
          copy={selectionSummary.startingPrompt}
          meta="This line auto-runs as the first authored move."
        />
        <SummaryCard
          label="Landing"
          title={selectionSummary.originName}
          copy={selectionSummary.originDescription}
          badge={biomeBadge}
        />
        <SummaryCard
          label="Lineage"
          title={selectionSummary.raceName}
          copy={selectionSummary.raceDescription}
          meta={
            <>
              {racePassiveAbility ? (
                <div>
                  <strong>Passive:</strong> {racePassiveAbility.name}
                </div>
              ) : null}
              {raceActiveAbility ? (
                <div>
                  <strong>Active:</strong> {raceActiveAbility.name}
                </div>
              ) : null}
            </>
          }
        />
        <SummaryCard
          label="Doctrine"
          title={selectionSummary.className}
          copy={selectionSummary.classDescription}
          meta={
            <>
              <div>
                <strong>Inscription:</strong> {selectionSummary.talentName}
              </div>
              <div>{selectionSummary.talentDescription}</div>
            </>
          }
        />
        <SummaryCard
          label="Trade"
          title={selectionSummary.professionName || "Path Undefined"}
          copy={selectionSummary.professionDescription || "Commit to a trade to ground the opening page."}
          meta={
            professionSkills.length ? (
              <div>
                <strong>Tier one:</strong>{" "}
                {professionSkills
                  .slice(0, 6)
                  .map((skill) => String(skill).replace(/_/g, " "))
                  .join(", ")}
              </div>
            ) : null
          }
        />
        <SummaryCard
          label="System"
          title={selectionSummary.systemName}
          copy={selectionSummary.systemDescription}
          meta={selectionSummary.systemMatchSummary || null}
        />
        <SummaryCard
          label="Starter Kit"
          title={selectionSummary.starterKitLabel || "Pending"}
          copy="The first descent carries the following loadout."
          meta={
            <>
              <div>
                <strong>Weapon:</strong> {selectionSummary.starterWeaponName || "Pending"}
              </div>
              <div>
                <strong>Armor:</strong> {selectionSummary.starterArmorName || "Pending"}
              </div>
              <div>
                <strong>Pack:</strong> {selectionSummary.starterSupportName || "Pending"} +{" "}
                {selectionSummary.starterConsumableName || "Pending"}
              </div>
            </>
          }
        />
      </div>

      <div className="creation-summary__skills">
        <SkillList
          title="Automatic Inscriptions"
          tone="emerald"
          items={automaticInscriptions}
          emptyLabel="No automatic system inscriptions."
        />
        <SkillList
          title={`Active Disciplines (${selectedActiveSkills.length}/${maxActiveSkills})`}
          tone="gold"
          items={selectionSummary.activeSkills || []}
          emptyLabel={`Select ${maxActiveSkills} active disciplines.`}
        />
        <SkillList
          title={`Passive Disciplines (${selectedPassiveSkills.length}/${maxPassiveSkills})`}
          tone="cyan"
          items={selectionSummary.passiveSkills || []}
          emptyLabel={`Select ${maxPassiveSkills} passive disciplines.`}
        />
      </div>

      <div className="creation-summary__closing">
        <div className="creation-summary__closing-copy">
          <div className="creation-summary__eyebrow">Archive Whisper</div>
          <p>{typewriterText}</p>
        </div>

        <div className="creation-summary__seal">
          <div
            className={[
              "creation-summary__seal-status",
              canFinalize ? "creation-summary__seal-status--ready" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {canFinalize
              ? "Chronicle stable. Ready to seal."
              : "Chronicle unstable. Complete the remaining rites."}
          </div>

          {canFinalize ? (
            <button
              type="button"
              className="holo-button holo-button--solid creation-summary__seal-button"
              onClick={async () => {
                if (isInitializing || typeof onFinalize !== "function") {
                  return;
                }
                setIsInitializing(true);
                try {
                  await onFinalize();
                } finally {
                  setIsInitializing(false);
                }
              }}
              disabled={isInitializing}
              aria-busy={isInitializing}
            >
              {isInitializing ? "Sealing..." : "Seal The Chronicle"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
