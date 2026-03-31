const ARRIVAL_RITES = [
  {
    title: "Bind The Lattice",
    copy: "Choose the system that will color every recommendation, growth lane, and skill bias.",
  },
  {
    title: "Shape The Vessel",
    copy: "Define lineage, doctrine, profession, and the narrative role that will carry the run.",
  },
  {
    title: "Seal The Oath",
    copy: "Lock the opening build only after the full chamber sequence resolves cleanly.",
  },
];

const ARRIVAL_SIGNALS = [
  "Systems determine recommendation pressure and opening loadouts.",
  "Every run begins from zero. No pre-authored hero path overrides genesis.",
  "Creation remains reversible until the final oath is sealed.",
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
    <section className="character-hub character-hub--arrival">
      <div className="character-hub__intro character-hub__hero">
        <div className="character-hub__eyebrow">Arrival Chamber</div>
        <h2 className="character-hub__title">Enter the genesis atrium.</h2>
        <p className="character-hub__copy">
          The chamber is quiet until you bind a system and begin forging the next
          chronicle. No premade champion stands in for you here. The run starts only
          after the lattice recognizes a name, a lineage, and an oath.
        </p>
        <div className="character-hub__account">
          <span>Bound profile</span>
          <strong>{accountLabel}</strong>
        </div>
      </div>

      <div className="character-hub__arrival-grid">
        <section className="character-hub__arrival-main">
          <div className="character-hub__panel-kicker">Ritual Sequence</div>
          <h3 className="character-hub__panel-title">A full-room genesis ritual awaits.</h3>

          <div className="character-hub__feature-list">
            {ARRIVAL_RITES.map((rite, index) => (
              <article key={rite.title} className="character-hub__feature">
                <span className="character-hub__feature-index">{`0${index + 1}`}</span>
                <div>
                  <h4>{rite.title}</h4>
                  <p>{rite.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="character-hub__arrival-side">
          <div className="character-hub__panel-kicker">Atrium Signals</div>
          <h3 className="character-hub__panel-title">What the chamber guarantees</h3>

          <div className="character-hub__pathway">
            {ARRIVAL_SIGNALS.map((signal) => (
              <div key={signal} className="character-hub__path-step">
                <span>+</span>
                <strong>{signal}</strong>
              </div>
            ))}
          </div>

          <p className="character-hub__launch-copy">
            Begin the chamber walk to rebuild identity, doctrine, and the opening
            power profile from the ground up.
          </p>

          <div className="character-hub__launch-footer">
            <button
              type="button"
              className="holo-button holo-button--solid"
              onClick={() => onStartCreation?.()}
            >
              Enter Character Genesis
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
