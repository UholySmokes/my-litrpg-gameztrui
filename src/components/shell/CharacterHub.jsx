import { useMemo, useState } from "react";
import {
  FEATURED_ARCHETYPES,
  formatIdentityLabel,
} from "./shellState.js";

function SpotlightMetric({ label, value }) {
  return (
    <div className="character-hub__metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CharacterHub({
  user = null,
  onStartCreation,
}) {
  const [selectedId, setSelectedId] = useState(FEATURED_ARCHETYPES[0]?.id || "");
  const selectedHero = useMemo(
    () =>
      FEATURED_ARCHETYPES.find((hero) => hero.id === selectedId) ||
      FEATURED_ARCHETYPES[0],
    [selectedId],
  );

  const accountLabel =
    user?.id === "local"
      ? "Local Chronicle"
      : user?.email || user?.id || "Linked Traveler";

  return (
    <section className="character-hub">
      <div className="character-hub__intro">
        <div className="character-hub__eyebrow">Character Hub</div>
        <h2 className="character-hub__title">Choose the fantasy of your next run.</h2>
        <p className="character-hub__copy">
          Start with a featured combat identity, then lock in your exact race,
          class, profession, and System bindings inside the full creation flow.
        </p>
        <div className="character-hub__account">
          <span>Bound profile</span>
          <strong>{accountLabel}</strong>
        </div>
      </div>

      <div className="character-hub__body">
        <div className="character-hub__roster">
          {FEATURED_ARCHETYPES.map((hero) => {
            const active = hero.id === selectedHero?.id;
            return (
              <button
                key={hero.id}
                type="button"
                className={[
                  "character-hub__card",
                  `character-hub__card--${hero.accent}`,
                  active ? "character-hub__card--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedId(hero.id)}
              >
                <div className="character-hub__card-eyebrow">
                  {hero.lineage} • {hero.classLabel}
                </div>
                <div className="character-hub__card-name">{hero.name}</div>
                <div className="character-hub__card-role">{hero.role}</div>
                <div className="character-hub__card-copy">{hero.summary}</div>
                <div className="character-hub__traits">
                  {hero.traits.map((trait) => (
                    <span key={trait}>{trait}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <aside
          className={[
            "character-hub__spotlight",
            selectedHero ? `character-hub__spotlight--${selectedHero.accent}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="character-hub__spotlight-kicker">Featured Path</div>
          <h3 className="character-hub__spotlight-name">{selectedHero?.name}</h3>
          <div className="character-hub__spotlight-meta">
            {formatIdentityLabel(selectedHero?.lineage)} • {formatIdentityLabel(selectedHero?.classLabel)}
          </div>
          <p className="character-hub__spotlight-copy">{selectedHero?.summary}</p>

          <div className="character-hub__metrics">
            <SpotlightMetric label="Role" value={selectedHero?.role || "-"} />
            <SpotlightMetric label="Lineage" value={selectedHero?.lineage || "-"} />
            <SpotlightMetric label="Class" value={selectedHero?.classLabel || "-"} />
          </div>

          <div className="character-hub__spotlight-footer">
            <div className="character-hub__spotlight-note">
              Your exact build is still fully reversible during creation.
            </div>
            <button
              type="button"
              className="holo-button holo-button--solid"
              onClick={() => onStartCreation?.(selectedHero)}
            >
              Begin Character Genesis
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
