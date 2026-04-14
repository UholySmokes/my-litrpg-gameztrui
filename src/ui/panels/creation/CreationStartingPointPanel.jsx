const EXAMPLE_STARTS = [
  "I arrive quietly, read the room, and ask who needs help first.",
  "I keep my head low, look for the nearest tension point, and offer my blade where it matters.",
  "I study the crowd, find the local authority, and ask what pressure is about to break.",
];

export default function CreationStartingPointPanel({
  selectedOriginName = "",
  startingPrompt = "",
  onStartingPromptChange,
  onOptimizePrompt,
  optimizedPromptAlternates = [],
  onSelectAlternate,
}) {
  return (
    <div className="creation-starting-point-panel">
      <div className="creation-starting-point-panel__intro">
        <div className="creation-starting-point-panel__eyebrow">First Invocation</div>
        <p>
          Script the exact line that should open the chronicle. This text becomes the
          first authored move and auto-runs{selectedOriginName ? ` in ${selectedOriginName}` : ""}.
        </p>
      </div>

      <label className="creation-starting-point-panel__label" htmlFor="creation-start-command">
        Invocation Draft
      </label>
      <textarea
        id="creation-start-command"
        className="creation-starting-point-panel__textarea"
        value={startingPrompt}
        onChange={(event) => onStartingPromptChange?.(event.target.value)}
        placeholder={
          selectedOriginName
            ? `I steady myself in ${selectedOriginName}, read the room, and ask where the pressure is building first.`
            : "I steady myself, read the room, and ask where the pressure is building first."
        }
        rows={6}
      />

      <div className="creation-starting-point-panel__toolbar">
        <button
          type="button"
          className="holo-button"
          onClick={() => onOptimizePrompt?.()}
          disabled={!startingPrompt.trim()}
        >
          Refine Invocation
        </button>
      </div>

      <div className="creation-starting-point-panel__grid">
        <section className="creation-starting-point-panel__panel">
          <div className="creation-starting-point-panel__panel-title">Archive Rewrites</div>
          {optimizedPromptAlternates.length > 0 ? (
            <div className="creation-starting-point-panel__option-list">
              {optimizedPromptAlternates.map((alternate) => (
                <button
                  key={alternate}
                  type="button"
                  className="creation-option-btn creation-starting-point-panel__option"
                  onClick={() => onSelectAlternate?.(alternate)}
                >
                  <strong>Use this rewrite</strong>
                  <span>{alternate}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="creation-starting-point-panel__empty">
              Refine the draft to generate cleaner alternate invocations you can still edit.
            </p>
          )}
        </section>

        <section className="creation-starting-point-panel__panel">
          <div className="creation-starting-point-panel__panel-title">Seed Phrases</div>
          <div className="creation-starting-point-panel__option-list">
            {EXAMPLE_STARTS.map((example) => (
              <button
                key={example}
                type="button"
                className="creation-option-btn creation-starting-point-panel__seed"
                onClick={() => onSelectAlternate?.(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
