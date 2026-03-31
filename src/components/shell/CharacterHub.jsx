const GENESIS_PILLARS = [
  {
    title: "System First",
    copy: "Bind the progression engine before you decide lineage, class, or craft.",
  },
  {
    title: "No Premade Hero",
    copy: "Featured combat identities are gone. Every run now starts as a blank chronicle.",
  },
  {
    title: "Author The Shape",
    copy: "Race, doctrine, profession, attributes, perks, and alignment stay under your control.",
  },
];

const GENESIS_STEPS = [
  "Name and bind the run",
  "Choose System, origin, race, and class",
  "Tune craft, stats, skills, perks, and alignment",
];

export default function CharacterHub({
  user = null,
  onStartCreation,
}) {
  const accountLabel =
    user?.id === "local"
      ? "Local Chronicle"
      : user?.email || user?.id || "Linked Traveler";

  return (
    <section className="character-hub">
      <div className="character-hub__intro character-hub__hero">
        <div className="character-hub__eyebrow">Character Hub</div>
        <h2 className="character-hub__title">Build the run from zero.</h2>
        <p className="character-hub__copy">
          No featured combat identity is waiting for you here. Start from a blank
          chronicle, bind a System, shape your lineage, and author the combat role
          yourself inside the full genesis flow.
        </p>
        <div className="character-hub__account">
          <span>Bound profile</span>
          <strong>{accountLabel}</strong>
        </div>
      </div>

      <div className="character-hub__body character-hub__body--solo">
        <section className="character-hub__mission">
          <div className="character-hub__panel-kicker">Genesis Scope</div>
          <h3 className="character-hub__panel-title">
            Every run starts authored, not assigned.
          </h3>
          <div className="character-hub__feature-list">
            {GENESIS_PILLARS.map((pillar) => (
              <article key={pillar.title} className="character-hub__feature">
                <h4>{pillar.title}</h4>
                <p>{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="character-hub__launch">
          <div className="character-hub__panel-kicker">Launch Vector</div>
          <h3 className="character-hub__panel-title">Shape the whole identity in one pass.</h3>
          <div className="character-hub__pathway">
            {GENESIS_STEPS.map((step, index) => (
              <div key={step} className="character-hub__path-step">
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
          <p className="character-hub__launch-copy">
            The build stays reversible during creation, but the opening premise is
            yours from the first click.
          </p>
          <div className="character-hub__launch-footer">
            <button
              type="button"
              className="holo-button holo-button--solid"
              onClick={() => onStartCreation?.()}
            >
              Begin Character Genesis
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
