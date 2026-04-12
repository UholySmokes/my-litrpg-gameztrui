import React, { useEffect, useMemo, useState } from "react";

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
    command: "study spell buildups",
  },
  {
    id: "epiphany",
    title: "Epiphany Trials",
    detail: "Push long-form study sessions where luck can trigger a sudden insight breakthrough.",
    command: "study epiphany trials",
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
  {
    id: "spell-recipes",
    title: "Spell Recipes (Workbench)",
    detail: "Focus on a specific essence + form pairing to unlock stable recipes in the unified engine.",
    command: "study spell",
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
  const journal = Array.isArray(magic.journal) ? magic.journal : [];
  const lastJournalEntry = journal.length > 0 ? journal[journal.length - 1] : null;
  const stability = magic.stability || {};
  const resonance = magic.resonance || {};
  const attunement = magic.attunement || {};
  const reserves = magic.reserves || {};
  const charges = Array.isArray(magic.charges) ? magic.charges : [];
  const activeWorkings = Array.isArray(magic.activeWorkings) ? magic.activeWorkings : [];
  const strain = magic.strain || {};
  const interference = magic.interference || {};
  const anchors = magic.anchors || {};
  const grammar = magic.grammar || {};
  const prepared = magic.prepared;

  const essenceOptions =
    Array.isArray(grammar.essences) && grammar.essences.length > 0
      ? grammar.essences
      : ["fire", "water", "earth", "air"];
  const formOptions =
    Array.isArray(grammar.forms) && grammar.forms.length > 0
      ? grammar.forms
      : ["bolt", "pulse", "shield"];

  const [selectedEssence, setSelectedEssence] = useState(
    () => attunement.focusedEssence || essenceOptions[0] || "fire",
  );
  const [selectedForm, setSelectedForm] = useState(() => formOptions[0] || "bolt");

  useEffect(() => {
    if (!essenceOptions.includes(selectedEssence)) {
      setSelectedEssence(attunement.focusedEssence || essenceOptions[0] || "fire");
    }
  }, [attunement.focusedEssence, essenceOptions, selectedEssence]);

  useEffect(() => {
    if (!formOptions.includes(selectedForm)) {
      setSelectedForm(formOptions[0] || "bolt");
    }
  }, [formOptions, selectedForm]);

  const guidedStudySuggestions = useMemo(() => {
    if (!Array.isArray(suggestions)) return [];
    return suggestions
      .map((suggestion) => {
        const label =
          typeof suggestion === "string"
            ? suggestion
            : suggestion?.label ||
              suggestion?.text ||
              suggestion?.command ||
              suggestion?.t ||
              String(suggestion);
        const command =
          typeof suggestion === "string"
            ? suggestion
            : suggestion?.command ||
              suggestion?.t ||
              suggestion?.label ||
              suggestion?.text ||
              String(suggestion);
        return { label, command };
      })
      .filter(
        (entry) =>
          typeof entry.command === "string" &&
          entry.command.trim().toLowerCase().startsWith("study "),
      )
      .slice(0, 6);
  }, [suggestions]);

  const suggestedCombo = useMemo(() => {
    const safeEssences = essenceOptions.length > 0 ? essenceOptions : ["fire"];
    const safeForms = formOptions.length > 0 ? formOptions : ["bolt"];
    const essence =
      safeEssences[journal.length % safeEssences.length] ||
      safeEssences[0] ||
      "fire";
    const form =
      safeForms[(journal.length + 1) % safeForms.length] || safeForms[0] || "bolt";
    return { essence, form };
  }, [essenceOptions, formOptions, journal.length]);

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
              <span>Reserves tracked</span>
              <strong>{reserveCount}</strong>
            </div>
            <div>
              <span>Journal entries</span>
              <strong>{journal.length}</strong>
            </div>
            <div>
              <span>Active workings</span>
              <strong>{activeWorkings.length}</strong>
            </div>
          </div>
          {lastJournalEntry ? (
            <p style={{ marginTop: "0.65rem", opacity: 0.85 }}>
              Last study: <strong>{String(lastJournalEntry.topic || "note").replace(/_/g, " ")}</strong>
              {lastJournalEntry.target ? ` â€” ${lastJournalEntry.target}` : ""}
            </p>
          ) : null}
          <p style={{ marginTop: "0.65rem" }}>
            Latest generated text: {latestEntryText || "No recent narrative output yet."}
          </p>
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Live State</div>
          <h3 className="surface-section__title">Magic Vitals</h3>
        </div>
        <div className="surface-section__body">
          <div className="atrium-room-idle__metrics">
            <div><span>Mana</span><strong>{magic.mana?.current ?? "?"}/{magic.mana?.max ?? "?"}</strong></div>
            <div><span>Strain</span><strong>{strain.current ?? 0}/{strain.max ?? 100} ({strain.state || "steady"})</strong></div>
            <div><span>Resonance</span><strong>{resonance.current ?? 0}/{resonance.max ?? 100} ({resonance.state || "quiet"})</strong></div>
            <div><span>Interference</span><strong>{interference.score ?? 0}</strong></div>
          </div>
          <h4 style={{ marginTop: "0.75rem" }}>Stability</h4>
          <div className="atrium-room-idle__metrics">
            <div><span>Body</span><strong>{stability.body?.current ?? "?"}/{stability.body?.max ?? "?"}</strong></div>
            <div><span>Mind</span><strong>{stability.mind?.current ?? "?"}/{stability.mind?.max ?? "?"}</strong></div>
            <div><span>Cognitive</span><strong>{stability.cognitive?.current ?? "?"}/{stability.cognitive?.max ?? "?"}</strong></div>
          </div>
          <h4 style={{ marginTop: "0.75rem" }}>Attunement</h4>
          <p>Stance: <strong>{attunement.stance || "open"}</strong>{attunement.focusedEssence ? ` · Focus: ${attunement.focusedEssence}` : ""}</p>
          {prepared ? (
            <p style={{ marginTop: "0.35rem" }}>Prepared: <strong>{JSON.stringify(prepared)}</strong></p>
          ) : null}
          <h4 style={{ marginTop: "0.75rem" }}>Anchors</h4>
          <p>Self: {anchors.self || "none"} · Area: {anchors.area || "none"} · Item: {anchors.itemId || "none"}</p>
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Reserves &amp; Charges</div>
          <h3 className="surface-section__title">Essence Reserves</h3>
        </div>
        <div className="surface-section__body">
          {Object.keys(reserves).length > 0 ? (
            <ul>
              {Object.entries(reserves).map(([essence, amount]) => (
                <li key={essence}><strong>{essence}</strong>: {typeof amount === "object" ? JSON.stringify(amount) : amount}</li>
              ))}
            </ul>
          ) : <p style={{ opacity: 0.7 }}>No essence reserves yet.</p>}
          {charges.length > 0 ? (
            <>
              <h4 style={{ marginTop: "0.5rem" }}>Charges</h4>
              <ul>
                {charges.map((c, i) => (
                  <li key={i}>{typeof c === "object" ? `${c.essence || "?"} (tier ${c.tier ?? "?"})` : String(c)}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Grammar</div>
          <h3 className="surface-section__title">Known Essences, Forms &amp; Patterns</h3>
        </div>
        <div className="surface-section__body">
          <p><strong>Essences:</strong> {(grammar.essences || []).join(", ") || "none"}</p>
          <p><strong>Forms:</strong> {(grammar.forms || []).join(", ") || "none"}</p>
          <p><strong>Patterns:</strong> {Object.keys(magic.unlockedPatterns || {}).join(", ") || "none"}</p>
          <p><strong>Deliveries:</strong> {(grammar.deliveries || []).join(", ") || "none"}</p>
          {Array.isArray(grammar.recipes) && grammar.recipes.length > 0 ? (
            <p><strong>Recipes:</strong> {grammar.recipes.map(r => typeof r === "string" ? r : r?.id || JSON.stringify(r)).join(", ")}</p>
          ) : null}
        </div>
      </section>

      <section className="surface-section">
        <div className="surface-section__header">
          <div className="surface-section__eyebrow">Workbench</div>
          <h3 className="surface-section__title">Spell Study Workbench</h3>
        </div>
        <div className="surface-section__body">
          <p style={{ opacity: 0.9 }}>
            Targeted study can unlock stable <strong>spell recipes</strong> (visible above under Grammar â†’ Recipes).
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginTop: "0.35rem",
            }}
          >
            <label>
              <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: "0.25rem" }}>
                Essence
              </div>
              <select
                value={selectedEssence}
                onChange={(e) => setSelectedEssence(e.target.value)}
                style={{ width: "100%" }}
              >
                {essenceOptions.map((essence) => (
                  <option key={essence} value={essence}>
                    {essence}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: "0.25rem" }}>
                Form
              </div>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                style={{ width: "100%" }}
              >
                {formOptions.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="adventure-tab__action-btn"
              onClick={() =>
                onSubmitCommand?.({
                  label: `Study spell: ${selectedEssence} ${selectedForm}`,
                  command: `study spell ${selectedEssence} ${selectedForm}`,
                })}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                marginBottom: "0.4rem",
              }}
            >
              <span className="adventure-tab__action-marker">::</span>
              <span>
                <strong>Study spell recipe</strong>
                <em style={{ display: "block", fontStyle: "normal", opacity: 0.8 }}>
                  Focused pairing: {selectedEssence} · {selectedForm}
                </em>
              </span>
            </button>

            <button
              type="button"
              className="adventure-tab__action-btn"
              onClick={() =>
                onSubmitCommand?.({
                  label: `Study suggested: ${suggestedCombo.essence} ${suggestedCombo.form}`,
                  command: `study spell ${suggestedCombo.essence} ${suggestedCombo.form}`,
                })}
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              <span className="adventure-tab__action-marker">::</span>
              <span>
                <strong>Study suggested combo</strong>
                <em style={{ display: "block", fontStyle: "normal", opacity: 0.8 }}>
                  Rotation drill: {suggestedCombo.essence} · {suggestedCombo.form}
                </em>
              </span>
            </button>
          </div>

          {guidedStudySuggestions.length > 0 ? (
            <div style={{ marginTop: "0.75rem" }}>
              <h4 style={{ marginTop: 0 }}>Guided drills</h4>
              {guidedStudySuggestions.map((entry, index) => (
                <button
                  key={`${entry.command}-${index}`}
                  type="button"
                  className="adventure-tab__action-btn"
                  onClick={() => onSubmitCommand?.({ label: entry.label, command: entry.command })}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    marginBottom: index === guidedStudySuggestions.length - 1 ? 0 : "0.4rem",
                  }}
                >
                  <span className="adventure-tab__action-marker">::</span>
                  <span>{entry.label}</span>
                </button>
              ))}
            </div>
          ) : null}
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
          <div className="surface-section__eyebrow">Magic Journal</div>
          <h3 className="surface-section__title">Research Log ({journal.length} entries)</h3>
        </div>
        <div className="surface-section__body">
          {journal.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {journal.slice(-10).reverse().map((entry, i) => (
                <li key={i} style={{ marginBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.4rem" }}>
                  <strong>T{entry.turn}</strong> · {entry.topic?.replace(/_/g, " ") || "note"}
                  {entry.target ? ` — target: ${entry.target}` : ""}
                  <br />
                  <em style={{ opacity: 0.85 }}>{entry.notes}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.7 }}>No journal entries yet. Use <strong>STUDY &lt;target&gt;</strong> or <strong>JOURNAL NOTE "..."</strong> to record observations.</p>
          )}
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
                <button
                  type="button"
                  className="adventure-tab__action-btn"
                  onClick={() =>
                    onSubmitCommand?.({
                      label: `Study rune: ${rune.name}`,
                      command: `study rune ${rune.name.toLowerCase()}`,
                    })}
                  style={{ width: "100%", justifyContent: "flex-start", marginTop: "0.35rem" }}
                >
                  <span className="adventure-tab__action-marker">::</span>
                  <span>Study this rune</span>
                </button>
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
                <button
                  type="button"
                  className="adventure-tab__action-btn"
                  onClick={() =>
                    onSubmitCommand?.({
                      label: `Study inscription: ${token.term}`,
                      command: `study inscription ${token.term.toLowerCase()}`,
                    })}
                  style={{ width: "100%", justifyContent: "flex-start", marginTop: "0.35rem" }}
                >
                  <span className="adventure-tab__action-marker">::</span>
                  <span>Study this inscription</span>
                </button>
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
