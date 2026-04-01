import React from "react";

const STUDY_METHODS = [
  {
    id: "natural-phenomena",
    title: "Natural Phenomena",
    detail: "Observe storms, tides, heat mirage, and leyline echoes to infer magical laws.",
    command: "study natural phenomena",
  },
  {
    id: "spell-buildup",
    title: "Spell Buildups",
    detail: "Try different element anchors, sequencing, and release tempo to discover stable combinations.",
    command: "test spell buildup combinations",
  },
  {
    id: "epiphany",
    title: "Epiphany Trials",
    detail: "Push long-form study sessions where luck can trigger a sudden insight breakthrough.",
    command: "perform focused study for epiphany",
  },
  {
    id: "inscriptions",
    title: "Inscriptions (Magical Text)",
    detail: "Decode grammar rules, invocation cadence, and inscription intent to unlock safer casts.",
    command: "study magical inscriptions",
  },
  {
    id: "runes",
    title: "Runes (Magic Symbols)",
    detail: "Analyze rune geometry and pairing behavior to build stronger symbol chains.",
    command: "study magical runes",
  },
];

const RUNES = [
  { symbol: "ᚨ", name: "Aeth", meaning: "arcane flow / initiation" },
  { symbol: "ᚱ", name: "Ruun", meaning: "channeling / movement" },
  { symbol: "ᚲ", name: "Kael", meaning: "focus / stabilization" },
  { symbol: "ᛟ", name: "Oth", meaning: "ward / containment" },
  { symbol: "ᛞ", name: "Dra", meaning: "release / impact" },
  { symbol: "ᛇ", name: "Eir", meaning: "insight / epiphany" },
];

const INSCRIPTION_ALPHABET = [
  { glyph: "Aa", term: "Astra", effect: "Begins a cast sequence" },
  { glyph: "Be", term: "Bel", effect: "Amplifies current mana throughput" },
  { glyph: "Cy", term: "Cyr", effect: "Rotates spell polarity" },
  { glyph: "Do", term: "Dorn", effect: "Anchors an effect to terrain" },
  { glyph: "El", term: "Elyr", effect: "Improves precision and control" },
  { glyph: "Fy", term: "Fyre", effect: "Accelerates release window" },
  { glyph: "Ga", term: "Gala", effect: "Dampens instability spikes" },
  { glyph: "Hu", term: "Hush", effect: "Silences ambient magical noise" },
];

function StudyAction({ method, onSubmitCommand }) {
  return (
    <button
      type="button"
      className="adventure-tab__action-btn"
      onClick={() => onSubmitCommand?.({ label: method.title, command: method.command })}
      style={{ width: "100%", justifyContent: "flex-start", marginBottom: "0.4rem" }}
    >
      <span className="adventure-tab__action-marker">::</span>
      <span>
        <strong>{method.title}</strong>
        <em style={{ display: "block", fontStyle: "normal", opacity: 0.8 }}>{method.detail}</em>
      </span>
    </button>
  );
}

export default function MagicStudyPanel({ player, latestEntryText, onSubmitCommand, suggestions = [] }) {
  const magic = player?.magic && typeof player.magic === "object" ? player.magic : {};
  const unlockedPatternCount = Object.keys(magic.unlockedPatterns || {}).length;
  const reserveCount = Object.keys(magic.reserves || {}).length;

  return (
    <div className="atrium-room-stack">
      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Study Room</div>
          <h3 className="surface-section__title">Magic Study: Theory, Symbols, and Discovery</h3>
        </div>
        <div className="surface-section__body">
          <p>
            Learn through observation, experimentation, and symbolic decoding. Lucky breakthroughs can trigger
            epiphanies that accelerate mastery.
          </p>
          <div className="atrium-room-idle__metrics">
            <div>
              <span>Unlocked patterns</span>
              <strong>{unlockedPatternCount}</strong>
            </div>
            <div>
              <span>Resonance reserves tracked</span>
              <strong>{reserveCount}</strong>
            </div>
          </div>
          <p style={{ marginTop: "0.65rem" }}>
            Latest generated text: {latestEntryText || "No recent narrative output yet."}
          </p>
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Study Actions</div>
          <h3 className="surface-section__title">Ways to study magic</h3>
        </div>
        <div className="surface-section__body">
          {STUDY_METHODS.map((method) => (
            <StudyAction key={method.id} method={method} onSubmitCommand={onSubmitCommand} />
          ))}
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Rune Lexicon</div>
          <h3 className="surface-section__title">Runes (Magic Symbols)</h3>
        </div>
        <div className="surface-section__body">
          <ul>
            {RUNES.map((rune) => (
              <li key={rune.name}>
                <strong>{rune.symbol}</strong> {rune.name} — {rune.meaning}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Inscription Script</div>
          <h3 className="surface-section__title">Alphabet of Inscriptions (Magical Text)</h3>
        </div>
        <div className="surface-section__body">
          <ul>
            {INSCRIPTION_ALPHABET.map((token) => (
              <li key={token.glyph}>
                <strong>{token.glyph}</strong> · {token.term}: {token.effect}
              </li>
            ))}
          </ul>
          {Array.isArray(suggestions) && suggestions.length > 0 ? (
            <p style={{ marginTop: "0.75rem", opacity: 0.8 }}>
              Tip: parser-safe suggestions are also available from the Command Dais if you want guided spell study.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
