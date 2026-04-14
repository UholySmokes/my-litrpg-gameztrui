const THRESHOLD_RITES = [
  {
    sigil: "I",
    title: "Name The Sigil",
    copy: "Mark the chronicle with a namesake, a ruling system, and the first tone of the run.",
  },
  {
    sigil: "II",
    title: "Temper The Vessel",
    copy: "Shape lineage, doctrine, profession, and opening pressure until the build feels inevitable.",
  },
  {
    sigil: "III",
    title: "Seal The First Page",
    copy: "Choose the landing, script the first invocation, and descend only when the archive agrees.",
  },
];

const ARCHIVE_COVENANTS = [
  "Chosen origins become the canonical first landing.",
  "Creation stays reversible until the final seal is bound.",
  "The first scene echoes the build you just authored.",
];

const CHRONICLE_RELAYS = [
  {
    label: "Cloud Chronicle",
    copy: "Carry the active chronicle across browsers once the first seal is complete.",
  },
  {
    label: "Local Flame",
    copy: "Keep a clean, immediate browser-start path for fast rebuilds and playtest loops.",
  },
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
    <section className="character-hub character-hub--threshold">
      <div className="character-hub__nebula" aria-hidden="true" />
      <div className="character-hub__runes" aria-hidden="true" />

      <header className="character-hub__threshold-hero anime-slide-up">
        <div className="character-hub__brand-mark">
          <span className="character-hub__brand-line">Void Verse</span>
          <strong className="character-hub__brand-title">The Archive</strong>
        </div>

        <div className="character-hub__intro character-hub__hero">
          <div className="character-hub__eyebrow anime-shimmer">The Threshold</div>
          <h2 className="character-hub__title">Bind your chronicle before the void answers.</h2>
          <p className="character-hub__copy">
            This shell opens as a ceremonial archive instead of a flat launcher. Step
            onto the threshold, choose the forces that define the run, and descend only
            when the first page feels authored rather than random.
          </p>
          <div className="character-hub__account">
            <span>Bound profile</span>
            <strong>{accountLabel}</strong>
          </div>
        </div>
      </header>

      <div className="character-hub__threshold-grid">
        <section className="character-hub__threshold-rail character-hub__threshold-rail--rites">
          <div className="character-hub__panel-kicker">Threshold Rites</div>
          <h3 className="character-hub__panel-title">Three gates, one authored descent.</h3>

          <div className="character-hub__feature-list anime-stagger">
            {THRESHOLD_RITES.map((rite) => (
              <article key={rite.title} className="character-hub__feature character-hub__feature--stone anime-slide-up">
                <span className="character-hub__feature-index">{rite.sigil}</span>
                <div>
                  <h4>{rite.title}</h4>
                  <p>{rite.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="character-hub__altar anime-float">
          <div className="character-hub__altar-halo" aria-hidden="true" />
          <div className="character-hub__altar-fragment character-hub__altar-fragment--north" aria-hidden="true">
            Entry Sigil
          </div>
          <div className="character-hub__altar-fragment character-hub__altar-fragment--west" aria-hidden="true">
            Cloud Chronicle
          </div>
          <div className="character-hub__altar-fragment character-hub__altar-fragment--east" aria-hidden="true">
            Local Flame
          </div>

          <div className="character-hub__altar-core">
            <div className="character-hub__altar-label">Chronicle Altar</div>
            <div className="character-hub__altar-sigil" aria-hidden="true">
              <span>VV</span>
            </div>
            <h3 className="character-hub__altar-title">Enter The Archive</h3>
            <p className="character-hub__altar-copy">
              The first page begins with your chosen origin, not a stray fallback. Walk
              the rite, write the opening invocation, and let the archive echo it into
              the first scene.
            </p>

            <div className="character-hub__altar-actions">
              <button
                type="button"
                className="holo-button holo-button--solid anime-glow"
                onClick={() => onStartCreation?.()}
              >
                Enter The Archive
              </button>
            </div>
          </div>
        </section>

        <aside className="character-hub__threshold-rail character-hub__threshold-rail--signals">
          <div className="character-hub__panel-kicker">Archive Terms</div>
          <h3 className="character-hub__panel-title">What the shell promises before descent</h3>

          <div className="character-hub__pathway anime-stagger">
            {ARCHIVE_COVENANTS.map((signal) => (
              <div key={signal} className="character-hub__path-step anime-slide-left">
                <span>+</span>
                <strong>{signal}</strong>
              </div>
            ))}
          </div>

          <div className="character-hub__relay-list">
            {CHRONICLE_RELAYS.map((relay) => (
              <article key={relay.label} className="character-hub__relay-card">
                <div className="character-hub__relay-label">{relay.label}</div>
                <p>{relay.copy}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
